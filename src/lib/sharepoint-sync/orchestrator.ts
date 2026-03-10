import { prisma } from "@/lib/db";
import { SharePointConnector } from "./connector";
import type { ConnectorOptions } from "./connector";
import { ExcelParser } from "./parser";
import { DataTransformer } from "./transformer";
import type { SharePointFile, TransformResult } from "./types";

export class SyncOrchestrator {
  private connector: SharePointConnector;
  private parser: ExcelParser;
  private transformer: DataTransformer;

  constructor(options: ConnectorOptions) {
    this.connector = new SharePointConnector(options);
    this.parser = new ExcelParser();
    this.transformer = new DataTransformer();
  }

  async runSync(triggeredBy = "manual"): Promise<string> {
    // Create sync job record
    const job = await prisma.syncJob.create({
      data: { triggeredBy, status: "running" },
    });

    try {
      // Load column mappings
      await this.transformer.loadMappings();

      // Load config
      const config = await prisma.syncConfig.findUnique({ where: { id: "default" } });
      const filePattern = config?.filePattern || "*.xlsx";

      // Discover files
      const files = await this.connector.listFiles(filePattern);

      await prisma.syncJob.update({
        where: { id: job.id },
        data: { totalFiles: files.length },
      });

      if (files.length === 0) {
        await prisma.syncJob.update({
          where: { id: job.id },
          data: { status: "completed", completedAt: new Date() },
        });
        return job.id;
      }

      // Filter to changed files only (delta detection)
      const filesToProcess = await this.filterChangedFiles(files);

      let totalImported = 0;
      let totalUpdated = 0;
      let totalRejected = 0;
      let filesFailed = 0;
      let filesProcessed = 0;

      for (const file of filesToProcess) {
        const startMs = Date.now();
        const fileLog = await prisma.syncFileLog.create({
          data: {
            syncJobId: job.id,
            fileName: file.name,
            filePath: file.path,
            fileSize: file.size,
            lastModified: file.lastModified,
            eTag: file.eTag,
            status: "processing",
          },
        });

        try {
          // Download
          const buffer = await this.connector.downloadFile(file.path);

          // Parse
          const parsed = await this.parser.parse(buffer, file.name, file.path);

          if (parsed.errors.length > 0 && parsed.sheets.length === 0) {
            throw new Error(parsed.errors.join("; "));
          }

          // Transform all sheets
          let fileImported = 0;
          let fileRejected = 0;
          const allResults: TransformResult[] = [];

          for (const sheet of parsed.sheets) {
            const { results, errors } = this.transformer.transform(sheet, file.name);
            allResults.push(...results);
            fileRejected += errors.length;

            if (errors.length > 0) {
              console.warn(`[Sync] Warnings for ${file.name}/${sheet.sheetName}:`, errors);
            }
          }

          // Upsert KPI data
          const { imported, updated } = await this.upsertKPIs(allResults);
          fileImported = imported + updated;

          // Update file cache
          await prisma.fileSyncCache.upsert({
            where: { filePath: file.path },
            create: {
              filePath: file.path,
              fileName: file.name,
              eTag: file.eTag,
              lastModified: file.lastModified,
              lastSyncedAt: new Date(),
            },
            update: {
              eTag: file.eTag,
              lastModified: file.lastModified,
              lastSyncedAt: new Date(),
            },
          });

          const processingMs = Date.now() - startMs;
          await prisma.syncFileLog.update({
            where: { id: fileLog.id },
            data: {
              status: "completed",
              rowsFound: allResults.length,
              rowsImported: fileImported,
              rowsRejected: fileRejected,
              processingMs,
              errorMessage: parsed.errors.length > 0 ? parsed.errors.join("; ") : null,
            },
          });

          totalImported += imported;
          totalUpdated += updated;
          totalRejected += fileRejected;
          filesProcessed++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          const processingMs = Date.now() - startMs;

          await prisma.syncFileLog.update({
            where: { id: fileLog.id },
            data: {
              status: "failed",
              errorMessage: msg,
              processingMs,
            },
          });

          filesFailed++;
          console.error(`[Sync] Failed to process ${file.name}:`, msg);
        }
      }

      // Mark skipped files
      const skippedFiles = files.filter((f) => !filesToProcess.includes(f));
      for (const file of skippedFiles) {
        await prisma.syncFileLog.create({
          data: {
            syncJobId: job.id,
            fileName: file.name,
            filePath: file.path,
            fileSize: file.size,
            lastModified: file.lastModified,
            eTag: file.eTag,
            status: "skipped",
          },
        });
      }

      const finalStatus = filesFailed > 0 && filesProcessed > 0 ? "partial"
        : filesFailed > 0 ? "failed"
        : "completed";

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          filesProcessed: filesProcessed + skippedFiles.length,
          filesFailed,
          rowsImported: totalImported,
          rowsUpdated: totalUpdated,
          rowsRejected: totalRejected,
        },
      });

      return job.id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage: msg,
        },
      });
      throw err;
    }
  }

  private async filterChangedFiles(files: SharePointFile[]): Promise<SharePointFile[]> {
    const changed: SharePointFile[] = [];

    for (const file of files) {
      const cached = await prisma.fileSyncCache.findUnique({
        where: { filePath: file.path },
      });

      if (!cached) {
        changed.push(file); // New file
        continue;
      }

      // Check eTag change
      if (file.eTag && cached.eTag && file.eTag !== cached.eTag) {
        changed.push(file);
        continue;
      }

      // Check modification date
      if (file.lastModified > (cached.lastModified || new Date(0))) {
        changed.push(file);
        continue;
      }
    }

    return changed;
  }

  private async upsertKPIs(results: TransformResult[]): Promise<{ imported: number; updated: number }> {
    let imported = 0;
    let updated = 0;

    // Group results by kpiId
    const grouped = new Map<string, TransformResult[]>();
    for (const r of results) {
      const existing = grouped.get(r.kpiId) || [];
      existing.push(r);
      grouped.set(r.kpiId, existing);
    }

    for (const [kpiId, kpiResults] of grouped) {
      const data: Record<string, string> = {};
      let sourceFile = "";
      let sourceSheet = "";
      let sourceRow = 0;

      for (const r of kpiResults) {
        data[r.field] = String(r.value);
        sourceFile = r.sourceFile;
        sourceSheet = r.sourceSheet;
        sourceRow = r.sourceRow;
      }

      const existing = await prisma.syncedKPI.findUnique({ where: { id: kpiId } });

      if (existing) {
        await prisma.syncedKPI.update({
          where: { id: kpiId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.domain && { domain: data.domain }),
            ...(data.value && { value: data.value }),
            ...(data.unit && { unit: data.unit }),
            ...(data.period && { period: data.period }),
            ...(data.target && { target: data.target }),
            ...(data.variance && { variance: data.variance }),
            ...(data.varianceDirection && { varianceDirection: data.varianceDirection }),
            ...(data.gap && { gap: data.gap }),
            sourceFile,
            sourceSheet,
            sourceRow,
            syncedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.syncedKPI.create({
          data: {
            id: kpiId,
            name: data.name || kpiId,
            domain: data.domain || "financial",
            value: data.value || "0",
            unit: data.unit || "",
            period: data.period || "",
            target: data.target || null,
            variance: data.variance || null,
            varianceDirection: data.varianceDirection || null,
            gap: data.gap || null,
            sourceFile,
            sourceSheet,
            sourceRow,
          },
        });
        imported++;
      }
    }

    return { imported, updated };
  }
}
