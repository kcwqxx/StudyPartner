import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function GET() {
  try {
    const userId = await getMockUserId();

    // Get units where the user has low scores or hasn't passed
    const mistakes = await prisma.userUnitProgress.findMany({
      where: {
        userId,
        OR: [
          { status: "learning" },
          { status: "not_started" },
          { status: "reviewing" },
        ],
      },
      include: {
        unit: {
          include: {
            document: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { lastScore: "asc" }],
    });

    // Also get recent failed attempts
    const failedAttempts = await prisma.recitationAttempt.findMany({
      where: {
        session: {
          userId,
        },
        passed: false,
      },
      include: {
        session: {
          include: {
            unit: {
              include: {
                document: {
                  select: { title: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      mistakes,
      failedAttempts,
    });
  } catch (error) {
    console.error("GET /api/mistakes error:", error);
    return NextResponse.json({ error: "Failed to fetch mistakes" }, { status: 500 });
  }
}
