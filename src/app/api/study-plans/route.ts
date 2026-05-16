import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function POST(request: NextRequest) {
  try {
    const userId = await getMockUserId();
    const body = await request.json();
    const { projectId, targetDate, dailyMinutes, recitationMode } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Get all units for this project's documents
    const documents = await prisma.document.findMany({
      where: { projectId },
      select: { id: true },
    });

    const documentIds = documents.map((d: { id: string }) => d.id);

    const units = await prisma.recitationUnit.findMany({
      where: { documentId: { in: documentIds } },
      orderBy: { order: "asc" },
    });

    if (units.length === 0) {
      return NextResponse.json(
        { error: "No recitation units found for this project. Generate units first." },
        { status: 400 }
      );
    }

    // Create study plan
    const plan = await prisma.studyPlan.create({
      data: {
        projectId,
        userId,
        targetDate: targetDate ? new Date(targetDate) : null,
        dailyMinutes: dailyMinutes || 30,
        recitationMode: recitationMode || "sequential",
      },
    });

    // Create study plan items
    const target = targetDate ? new Date(targetDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const daysAvailable = Math.max(1, Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const unitsPerDay = Math.max(1, Math.ceil(units.length / daysAvailable));

    const items = [];
    for (let i = 0; i < units.length; i++) {
      const dayOffset = Math.floor(i / unitsPerDay);
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

      items.push(
        prisma.studyPlanItem.create({
          data: {
            studyPlanId: plan.id,
            recitationUnitId: units[i].id,
            scheduledDate,
          },
        })
      );
    }

    const createdItems = await Promise.all(items);

    return NextResponse.json(
      { plan, items: createdItems },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/study-plans error:", error);
    return NextResponse.json({ error: "Failed to create study plan" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await getMockUserId();
    const plans = await prisma.studyPlan.findMany({
      where: { userId },
      include: {
        project: true,
        items: {
          include: {
            recitationUnit: true,
          },
          orderBy: { scheduledDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/study-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch study plans" }, { status: 500 });
  }
}
