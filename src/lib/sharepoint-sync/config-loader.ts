import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import type { ConnectorOptions } from "./connector";

export async function loadConnectorOptions(): Promise<ConnectorOptions> {
  const config = await prisma.syncConfig.findUnique({ where: { id: "default" } });
  if (!config) {
    throw new Error("SharePoint sync not configured. Go to Admin > SP Sync > Configuration.");
  }

  const username = decrypt(config.username);
  const password = decrypt(config.password);

  if (!config.siteUrl || !username || !password) {
    throw new Error("SharePoint URL, username, and password must be configured in Admin > SP Sync > Configuration.");
  }

  return {
    siteUrl: config.siteUrl,
    folderPath: config.folderPath,
    credentials: { username, password },
  };
}
