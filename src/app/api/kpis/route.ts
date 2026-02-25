import { NextResponse } from "next/server";
import { kpis } from "@/data/extracted-data";

// In-memory store (in production, this would be a database)
let kpiStore = [...kpis];

export async function GET() {
  return NextResponse.json({ kpis: kpiStore });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, value, target } = body;

  const idx = kpiStore.findIndex((k) => k.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "KPI not found" }, { status: 404 });
  }

  if (value !== undefined) kpiStore[idx].value = value;
  if (target !== undefined) kpiStore[idx].target = target;

  return NextResponse.json({ kpi: kpiStore[idx] });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "reset") {
    kpiStore = [...kpis];
    return NextResponse.json({ kpis: kpiStore, message: "Reset to defaults" });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
