import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const mappings = await prisma.columnMapping.findMany({
      orderBy: { profileName: "asc" },
    });
    return NextResponse.json({ mappings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load mappings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "bulk-save" && Array.isArray(body.mappings)) {
      // Delete existing and replace
      const profileName = body.profileName || "default";
      await prisma.columnMapping.deleteMany({ where: { profileName } });

      const created = await Promise.all(
        body.mappings.map((m: Record<string, unknown>) =>
          prisma.columnMapping.create({
            data: {
              profileName,
              excelColumn: String(m.excelColumn || ""),
              kpiId: String(m.kpiId || ""),
              kpiField: String(m.kpiField || "value"),
              transform: String(m.transform || "none"),
              defaultValue: m.defaultValue ? String(m.defaultValue) : null,
              required: Boolean(m.required),
            },
          })
        )
      );

      return NextResponse.json({ mappings: created, count: created.length });
    }

    // Single mapping creation
    const mapping = await prisma.columnMapping.create({
      data: {
        profileName: String(body.profileName || "default"),
        excelColumn: String(body.excelColumn || ""),
        kpiId: String(body.kpiId || ""),
        kpiField: String(body.kpiField || "value"),
        transform: String(body.transform || "none"),
        defaultValue: body.defaultValue ? String(body.defaultValue) : null,
        required: Boolean(body.required),
      },
    });

    return NextResponse.json({ mapping });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save mapping";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.columnMapping.delete({ where: { id } });
    } else {
      const profileName = searchParams.get("profileName") || "default";
      await prisma.columnMapping.deleteMany({ where: { profileName } });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete mapping";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
