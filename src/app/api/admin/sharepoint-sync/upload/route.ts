import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ExcelParser } from "@/lib/sharepoint-sync/parser";
import { DataTransformer } from "@/lib/sharepoint-sync/transformer";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Create sync job
    const job = await prisma.syncJob.create({
      data: { triggeredBy: "upload", status: "running", totalFiles: files.length },
    });

    const parser = new ExcelParser();
    const transformer = new DataTransformer();
    await transformer.loadMappings();

    let totalImported = 0;
    let totalUpdated = 0;
    let totalRejected = 0;
    let filesFailed = 0;
    let filesProcessed = 0;

    for (const file of files) {
      const startMs = Date.now();
      const fileLog = await prisma.syncFileLog.create({
        data: {
          syncJobId: job.id,
          fileName: file.name,
          filePath: `upload://${file.name}`,
          fileSize: file.size,
          status: "processing",
        },
      });

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await parser.parse(buffer, file.name, `upload://${file.name}`);

        if (parsed.errors.length > 0 && parsed.sheets.length === 0) {
          throw new Error(parsed.errors.join("; "));
        }

        let fileImported = 0;
        let fileRejected = 0;
        const allResults: { kpiId: string; field: string; value: string | number; sourceFile: string; sourceSheet: string; sourceRow: number }[] = [];

        for (const sheet of parsed.sheets) {
          const { results, errors } = transformer.transform(sheet, file.name);
          allResults.push(...results);
          fileRejected += errors.length;
        }

        // Upsert KPIs
        let imported = 0;
        let updated = 0;
        const grouped = new Map<string, typeof allResults>();
        for (const r of allResults) {
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

        fileImported = imported + updated;
        totalImported += imported;
        totalUpdated += updated;
        totalRejected += fileRejected;
        filesProcessed++;

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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await prisma.syncFileLog.update({
          where: { id: fileLog.id },
          data: { status: "failed", errorMessage: msg, processingMs: Date.now() - startMs },
        });
        filesFailed++;
      }
    }

    const finalStatus = filesFailed > 0 && filesProcessed > 0 ? "partial"
      : filesFailed > 0 ? "failed"
      : "completed";

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        filesProcessed,
        filesFailed,
        rowsImported: totalImported,
        rowsUpdated: totalUpdated,
        rowsRejected: totalRejected,
      },
    });

    const result = await prisma.syncJob.findUnique({
      where: { id: job.id },
      include: { fileLogs: true },
    });

    return NextResponse.json({ job: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
