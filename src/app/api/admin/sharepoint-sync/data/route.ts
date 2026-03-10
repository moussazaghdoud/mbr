import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Return all synced KPI data (for frontend to merge with localStorage)
export async function GET() {
  try {
    const syncedKPIs = await prisma.syncedKPI.findMany({
      orderBy: { updatedAt: "desc" },
    });

    // Transform to match the frontend KPI format
    const kpis = syncedKPIs.map((k) => ({
      id: k.id,
      name: k.name,
      domain: k.domain,
      value: parseNumeric(k.value),
      unit: k.unit,
      period: k.period,
      target: k.target ? parseNumeric(k.target) : undefined,
      targetUnit: k.targetUnit || undefined,
      variance: k.variance || undefined,
      varianceDirection: k.varianceDirection || undefined,
      gap: k.gap || undefined,
      editable: true,
      _synced: true,
      _syncedAt: k.syncedAt,
      _sourceFile: k.sourceFile,
    }));

    return NextResponse.json({ kpis, total: kpis.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load synced data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseNumeric(value: string): number | string {
  const num = parseFloat(value);
  return isNaN(num) ? value : num;
}
