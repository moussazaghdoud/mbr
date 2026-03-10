import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  try {
    let config = await prisma.syncConfig.findUnique({ where: { id: "default" } });
    if (!config) {
      config = await prisma.syncConfig.create({ data: { id: "default" } });
    }

    return NextResponse.json({
      siteUrl: config.siteUrl,
      driveId: config.driveId,
      folderPath: config.folderPath,
      filePattern: config.filePattern,
      pollingIntervalMin: config.pollingIntervalMin,
      enabled: config.enabled,
      connectionStatus: config.connectionStatus,
      lastTestedAt: config.lastTestedAt,
      username: decrypt(config.username),
      hasPassword: !!config.password,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      siteUrl: body.siteUrl ?? "",
      driveId: body.driveId ?? "",
      folderPath: body.folderPath ?? "/",
      filePattern: body.filePattern ?? "*.xlsx",
      pollingIntervalMin: body.pollingIntervalMin ?? 30,
      enabled: body.enabled ?? false,
    };

    if (body.username !== undefined && body.username !== "") {
      updateData.username = encrypt(body.username);
    }
    if (body.password && body.password !== "••••••••") {
      updateData.password = encrypt(body.password);
    }

    const config = await prisma.syncConfig.upsert({
      where: { id: "default" },
      create: { id: "default", ...updateData } as Parameters<typeof prisma.syncConfig.create>[0]["data"],
      update: updateData,
    });

    return NextResponse.json({
      siteUrl: config.siteUrl,
      driveId: config.driveId,
      folderPath: config.folderPath,
      filePattern: config.filePattern,
      pollingIntervalMin: config.pollingIntervalMin,
      enabled: config.enabled,
      connectionStatus: config.connectionStatus,
      lastTestedAt: config.lastTestedAt,
      username: decrypt(config.username),
      hasPassword: !!config.password,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
