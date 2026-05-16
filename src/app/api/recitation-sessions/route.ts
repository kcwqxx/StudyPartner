import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function POST(request: NextRequest) {
  try {
    const userId = await getMockUserId();
    const body = await request.json();
    const { unitId } = body;

    if (!unitId) {
      return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    const unit = await prisma.recitationUnit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const session = await prisma.recitationSession.create({
      data: {
        userId,
        unitId,
        status: "in_progress",
      },
    });

    return NextResponse.json({ session, unit }, { status: 201 });
  } catch (error) {
    console.error("POST /api/recitation-sessions error:", error);
    return NextResponse.json(
      { error: "Failed to create recitation session" },
      { status: 500 }
    );
  }
}
