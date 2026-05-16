import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";
import { getLLMClient, getChatModel, getAgentSystemPrompt } from "@/lib/llm";
import { LLMRecitationResponse } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const userId = await getMockUserId();
    const body = await request.json();
    const { userInput } = body;

    if (!userInput) {
      return NextResponse.json({ error: "User input is required" }, { status: 400 });
    }

    const session = await prisma.recitationSession.findUnique({
      where: { id: sessionId },
      include: { unit: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Call LLM to evaluate the recitation
    const llm = await getLLMClient(userId);
    const model = await getChatModel(userId);
    const systemPrompt = await getAgentSystemPrompt(userId);

    const keywords = JSON.parse(session.unit.keywords || "[]") as string[];

    const evaluationPrompt = `You are evaluating a student's recitation. Here is the source material and the student's response.

Source text to recite:
"""
${session.unit.sourceText}
"""

Key concepts that should be covered:
${keywords.map((k: string) => `- ${k}`).join("\n")}

Student's recitation:
"""
${userInput}
"""

Evaluate the student's response based on:
1. Keyword coverage: Did they mention the key concepts?
2. Semantic accuracy: Did they understand the concepts correctly?
3. Logical completeness: Did they provide a complete and coherent answer?

Respond with a JSON object in this exact format:
{
  "score": number (0-100),
  "passed": boolean (true if score >= 60),
  "missing_keywords": string[] (list of keywords that were missed or poorly explained),
  "feedback": string (constructive feedback for the student),
  "next_action": "review" | "next" | "repeat"
}`;

    const completion = await llm.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: evaluationPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const evaluation: LLMRecitationResponse = JSON.parse(responseText);

    // Save the attempt
    const attempt = await prisma.recitationAttempt.create({
      data: {
        sessionId,
        userInput,
        score: evaluation.score || 0,
        passed: evaluation.passed || false,
        missingKeywords: JSON.stringify(evaluation.missing_keywords || []),
        feedback: evaluation.feedback || "",
        nextAction: evaluation.next_action || "review",
      },
    });

    // Update user unit progress
    const progress = await prisma.userUnitProgress.findUnique({
      where: {
        userId_unitId: {
          userId,
          unitId: session.unitId,
        },
      },
    });

    if (progress) {
      const newAttemptsCount = progress.attemptsCount + 1;
      const newBestScore = Math.max(progress.bestScore || 0, evaluation.score);
      const newStatus = evaluation.passed
        ? evaluation.score >= 80
          ? "mastered"
          : "reviewing"
        : "learning";

      await prisma.userUnitProgress.update({
        where: { id: progress.id },
        data: {
          masteryLevel: evaluation.score,
          attemptsCount: newAttemptsCount,
          lastScore: evaluation.score,
          bestScore: newBestScore,
          status: newStatus,
          nextReviewAt: evaluation.passed
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    // If passed, mark study plan item as completed
    if (evaluation.passed) {
      await prisma.studyPlanItem.updateMany({
        where: {
          recitationUnitId: session.unitId,
          completed: false,
        },
        data: { completed: true },
      });
    }

    return NextResponse.json({
      attempt,
      evaluation: {
        score: evaluation.score,
        passed: evaluation.passed,
        missingKeywords: evaluation.missing_keywords,
        feedback: evaluation.feedback,
        nextAction: evaluation.next_action,
      },
    });
  } catch (error) {
    console.error("POST /api/recitation-sessions/[id]/attempts error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate recitation" },
      { status: 500 }
    );
  }
}
