import { prisma } from "@/lib/db";
import { SyncOrchestrator } from "./orchestrator";
import { loadConnectorOptions } from "./config-loader";

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

export async function startScheduler(): Promise<void> {
  if (intervalHandle) return;

  const config = await prisma.syncConfig.findUnique({ where: { id: "default" } });
  if (!config?.enabled) return;

  const intervalMs = (config.pollingIntervalMin || 30) * 60 * 1000;

  console.log(`[Scheduler] Starting with ${config.pollingIntervalMin}min interval`);

  intervalHandle = setInterval(async () => {
    if (isRunning) {
      console.log("[Scheduler] Previous sync still running, skipping");
      return;
    }

    try {
      isRunning = true;

      const currentConfig = await prisma.syncConfig.findUnique({ where: { id: "default" } });
      if (!currentConfig?.enabled) {
        stopScheduler();
        return;
      }

      const options = await loadConnectorOptions();
      const orchestrator = new SyncOrchestrator(options);
      await orchestrator.runSync("scheduler");
      console.log("[Scheduler] Sync completed");
    } catch (err) {
      console.error("[Scheduler] Sync failed:", err);
    } finally {
      isRunning = false;
    }
  }, intervalMs);
}

export function stopScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[Scheduler] Stopped");
  }
}

export function isSchedulerRunning(): boolean {
  return intervalHandle !== null;
}

export async function restartScheduler(): Promise<void> {
  stopScheduler();
  await startScheduler();
}
