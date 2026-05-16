import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";
import { getLLMClient, getChatModel, getAgentSystemPrompt } from "@/lib/llm";
import { LLMGenerateUnitsResponse } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getMockUserId();

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if units already exist
    const existingUnits = await prisma.recitationUnit.count({
      where: { documentId: id },
    });

    if (existingUnits > 0) {
      return NextResponse.json(
        { error: "Units already generated for this document" },
        { status: 400 }
      );
    }

    // Call LLM to generate units
    const llm = await getLLMClient(userId);
    const model = await getChatModel(userId);
    const systemPrompt = await getAgentSystemPrompt(userId);

    const generatePrompt = `You are an expert educational content analyzer. Your task is to break down the following study material into recitation units.

For each unit, provide:
1. title: A concise title for the unit
2. sourceText: The exact text excerpt for this unit
3. keywords: Array of 3-8 key terms/concepts the student should mention when reciting
4. recitationType: "free" (free recall), "qa" (question-answer), or "fill-blank" (fill in the blanks)
5. difficulty: 1-5 (1=easy, 5=hard)
6. estimatedMinutes: Estimated minutes to complete this unit

IMPORTANT: Respond ONLY with a valid JSON object in this exact format:
{
  "units": [
    {
      "title": "string",
      "sourceText": "string",
      "keywords": ["string"],
      "recitationType": "free" | "qa" | "fill-blank",
      "difficulty": number,
      "estimatedMinutes": number
    }
  ]
}

Study material to analyze:
---
${document.content}
---`;

    const completion = await llm.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: generatePrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const parsed: LLMGenerateUnitsResponse = JSON.parse(responseText);

    if (!parsed.units || !Array.isArray(parsed.units) || parsed.units.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate units from the document" },
        { status: 500 }
      );
    }

    // Save units to database
    const units = await Promise.all(
      parsed.units.map((unit, index) =>
        prisma.recitationUnit.create({
          data: {
            title: unit.title,
            sourceText: unit.sourceText,
            keywords: JSON.stringify(unit.keywords),
            recitationType: unit.recitationType || "free",
            difficulty: unit.difficulty || 1,
            estimatedMinutes: unit.estimatedMinutes || 5,
            order: index + 1,
            documentId: id,
          },
        })
      )
    );

    // Create progress records for each unit
    await Promise.all(
      units.map((unit) =>
        prisma.userUnitProgress.create({
          data: {
            userId,
            unitId: unit.id,
            status: "not_started",
          },
        })
      )
    );

    return NextResponse.json({ units }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/[id]/generate-units error:", error);
    return NextResponse.json(
      { error: "Failed to generate units" },
      { status: 500 }
    );
  }
}
