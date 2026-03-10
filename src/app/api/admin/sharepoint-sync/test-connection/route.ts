import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SharePointConnector } from "@/lib/sharepoint-sync/connector";
import { loadConnectorOptions } from "@/lib/sharepoint-sync/config-loader";

export async function POST() {
  try {
    const options = await loadConnectorOptions();
    const connector = new SharePointConnector(options);
    const result = await connector.testConnection();

    await prisma.syncConfig.update({
      where: { id: "default" },
      data: {
        connectionStatus: result.success ? "ok" : "error",
        lastTestedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection test failed";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
