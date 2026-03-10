import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Return all uploaded sheets grouped by file
export async function GET() {
  try {
    const sheets = await prisma.uploadedSheet.findMany({
      orderBy: [{ fileName: "asc" }, { sheetName: "asc" }],
    });

    // Group by fileName
    const grouped: Record<string, {
      fileName: string;
      sheets: { sheetName: string; headers: string[]; rows: Record<string, unknown>[]; rowCount: number }[];
    }> = {};

    for (const s of sheets) {
      if (!grouped[s.fileName]) {
        grouped[s.fileName] = { fileName: s.fileName, sheets: [] };
      }
      grouped[s.fileName].sheets.push({
        sheetName: s.sheetName,
        headers: JSON.parse(s.headers),
        rows: JSON.parse(s.rows),
        rowCount: s.rowCount,
      });
    }

    const files = Object.values(grouped);

    return NextResponse.json({ files, totalFiles: files.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load sheets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
