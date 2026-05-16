import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function GET() {
  try {
    const userId = await getMockUserId();
    let settings = await prisma.agentSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.agentSettings.create({
        data: { userId },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings/agent error:", error);
    return NextResponse.json({ error: "Failed to fetch agent settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getMockUserId();
    const body = await request.json();
    const { persona, strictness, hintLevel, feedbackLength, language } = body;

    const settings = await prisma.agentSettings.upsert({
      where: { userId },
      update: {
        ...(persona !== undefined && { persona }),
        ...(strictness !== undefined && { strictness }),
        ...(hintLevel !== undefined && { hintLevel }),
        ...(feedbackLength !== undefined && { feedbackLength }),
        ...(language !== undefined && { language }),
      },
      create: {
        userId,
        persona: persona || "encouraging_tutor",
        strictness: strictness || "medium",
        hintLevel: hintLevel || "moderate",
        feedbackLength: feedbackLength || "concise",
        language: language || "auto",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("POST /api/settings/agent error:", error);
    return NextResponse.json({ error: "Failed to update agent settings" }, { status: 500 });
  }
}
