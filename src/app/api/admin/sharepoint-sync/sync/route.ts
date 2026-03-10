import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SyncOrchestrator } from "@/lib/sharepoint-sync/orchestrator";
import { loadConnectorOptions } from "@/lib/sharepoint-sync/config-loader";

export async function POST() {
  try {
    const running = await prisma.syncJob.findFirst({
      where: { status: "running" },
      orderBy: { startedAt: "desc" },
    });

    if (running) {
      return NextResponse.json(
        { error: "A sync is already in progress", jobId: running.id },
        { status: 409 }
      );
    }

    const options = await loadConnectorOptions();
    const orchestrator = new SyncOrchestrator(options);
    const jobId = await orchestrator.runSync("manual");

    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      include: { fileLogs: true },
    });

    return NextResponse.json({ job });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
