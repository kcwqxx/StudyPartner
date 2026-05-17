import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getMockUserId();

    const plan = await prisma.studyPlan.findFirst({
      where: { id, userId },
    });

    if (!plan) {
      return NextResponse.json({ error: "学习计划未找到" }, { status: 404 });
    }

    await prisma.studyPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/study-plans/[id] error:", error);
    return NextResponse.json({ error: "删除学习计划失败" }, { status: 500 });
  }
}
