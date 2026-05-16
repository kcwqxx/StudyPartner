import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function GET() {
  try {
    const userId = await getMockUserId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const items = await prisma.studyPlanItem.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        studyPlan: {
          userId,
        },
      },
      include: {
        recitationUnit: {
          include: {
            document: {
              select: { title: true, projectId: true },
            },
          },
        },
        studyPlan: {
          select: { id: true, projectId: true },
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    const completedCount = items.filter((item: { completed: boolean }) => item.completed).length;

    return NextResponse.json({
      items,
      total: items.length,
      completed: completedCount,
    });
  } catch (error) {
    console.error("GET /api/tasks/today error:", error);
    return NextResponse.json({ error: "Failed to fetch today's tasks" }, { status: 500 });
  }
}
