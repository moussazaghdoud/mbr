import { NextResponse } from "next/server";
import { chartData, costCenters, servicesBreakdown, calculatedMetrics, dimensions } from "@/data/extracted-data";

export async function GET() {
  return NextResponse.json({
    chartData,
    costCenters,
    servicesBreakdown,
    calculatedMetrics,
    dimensions,
  });
}
