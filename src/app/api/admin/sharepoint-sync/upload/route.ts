import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ExcelParser } from "@/lib/sharepoint-sync/parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const job = await prisma.syncJob.create({
      data: { triggeredBy: "upload", status: "running", totalFiles: files.length },
    });

    const parser = new ExcelParser();
    let filesProcessed = 0;
    let filesFailed = 0;
    let totalSheets = 0;
    let totalRows = 0;

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

        let fileRows = 0;

        for (const sheet of parsed.sheets) {
          // Store raw sheet data in DB
          await prisma.uploadedSheet.upsert({
            where: {
              fileName_sheetName: { fileName: file.name, sheetName: sheet.sheetName },
            },
            update: {
              headers: JSON.stringify(sheet.headers),
              rows: JSON.stringify(sheet.rows),
              rowCount: sheet.rows.length,
              uploadedAt: new Date(),
            },
            create: {
              fileName: file.name,
              sheetName: sheet.sheetName,
              headers: JSON.stringify(sheet.headers),
              rows: JSON.stringify(sheet.rows),
              rowCount: sheet.rows.length,
            },
          });

          fileRows += sheet.rows.length;
          totalSheets++;
        }

        totalRows += fileRows;
        filesProcessed++;

        await prisma.syncFileLog.update({
          where: { id: fileLog.id },
          data: {
            status: "completed",
            rowsFound: fileRows,
            rowsImported: fileRows,
            rowsRejected: 0,
            processingMs: Date.now() - startMs,
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
        rowsImported: totalRows,
        rowsUpdated: 0,
        rowsRejected: 0,
      },
    });

    const result = await prisma.syncJob.findUnique({
      where: { id: job.id },
      include: { fileLogs: true },
    });

    return NextResponse.json({ job: result, totalSheets, totalRows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
