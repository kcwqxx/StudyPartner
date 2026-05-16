import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const units = await prisma.recitationUnit.findMany({
      where: { documentId: id },
      include: {
        userUnitProgress: {
          take: 1,
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("GET /api/documents/[id]/units error:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { unitId, title, sourceText, keywords, recitationType, difficulty, estimatedMinutes } = body;

    const unit = await prisma.recitationUnit.findFirst({
      where: { id: unitId, documentId: id },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const updated = await prisma.recitationUnit.update({
      where: { id: unitId },
      data: {
        ...(title !== undefined && { title }),
        ...(sourceText !== undefined && { sourceText }),
        ...(keywords !== undefined && { keywords: JSON.stringify(keywords) }),
        ...(recitationType !== undefined && { recitationType }),
        ...(difficulty !== undefined && { difficulty }),
        ...(estimatedMinutes !== undefined && { estimatedMinutes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/documents/[id]/units error:", error);
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}
