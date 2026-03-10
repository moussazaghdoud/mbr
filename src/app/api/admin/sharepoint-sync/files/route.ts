import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SharePointConnector } from "@/lib/sharepoint-sync/connector";
import { loadConnectorOptions } from "@/lib/sharepoint-sync/config-loader";

export async function GET() {
  try {
    const config = await prisma.syncConfig.findUnique({ where: { id: "default" } });
    const options = await loadConnectorOptions();
    const connector = new SharePointConnector(options);

    const files = await connector.listFiles(config?.filePattern || "*.xlsx");

    const enriched = await Promise.all(
      files.map(async (file) => {
        const cached = await prisma.fileSyncCache.findUnique({
          where: { filePath: file.path },
        });
        return {
          ...file,
          lastSyncedAt: cached?.lastSyncedAt || null,
          hasChanged: !cached || file.eTag !== cached.eTag ||
            file.lastModified > (cached.lastModified || new Date(0)),
        };
      })
    );

    return NextResponse.json({ files: enriched, total: enriched.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list files";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
