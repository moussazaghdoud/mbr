import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const jobs = await prisma.syncJob.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        fileLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const total = await prisma.syncJob.count();

    return NextResponse.json({ jobs, total, limit, offset });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load logs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
