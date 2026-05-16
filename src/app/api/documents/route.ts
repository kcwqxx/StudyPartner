import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function POST(request: NextRequest) {
  try {
    const userId = await getMockUserId();
    const body = await request.json();
    const { title, content, projectId, sourceType } = body;

    if (!title || !content || !projectId) {
      return NextResponse.json(
        { error: "Title, content, and projectId are required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        title,
        content,
        sourceType: sourceType || "paste",
        projectId,
        userId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
