import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSchedulerRunning } from "@/lib/sharepoint-sync/scheduler";

export async function GET() {
  try {
    const config = await prisma.syncConfig.findUnique({ where: { id: "default" } });

    const lastJob = await prisma.syncJob.findFirst({
      orderBy: { startedAt: "desc" },
      include: { fileLogs: { orderBy: { createdAt: "desc" } } },
    });

    const lastSuccessful = await prisma.syncJob.findFirst({
      where: { status: { in: ["completed", "partial"] } },
      orderBy: { completedAt: "desc" },
    });

    const totalJobs = await prisma.syncJob.count();
    const totalSyncedKPIs = await prisma.syncedKPI.count();

    return NextResponse.json({
      config: config || null,
      schedulerRunning: isSchedulerRunning(),
      lastJob: lastJob || null,
      lastSuccessfulSync: lastSuccessful?.completedAt || null,
      totalJobs,
      totalSyncedKPIs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
