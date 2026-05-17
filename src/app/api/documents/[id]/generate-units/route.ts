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

    // Step 1: First, ask LLM to clean up and reorganize the document content
    // This is especially important for PDF-extracted text which may have
    // garbled table layouts, broken sentences, and mixed-up columns
    const cleanupPrompt = `你是一位文档整理专家。下面是一段从PDF中提取的文本，由于PDF解析工具的限制，文本可能存在以下问题：
1. 表格内容被换行符打断，同一行的文字被拆分到不同行
2. 表格的左右列内容交错混合，导致语序混乱
3. 多余的空格和换行

请对这段文本进行整理：
- 修复被打断的句子，让语序通顺
- 重新组织表格内容，使每行信息完整
- 删除多余的空格和换行
- 保持所有原始信息不变，不要添加新内容，不要概括
- 如果遇到表格，请将表格转换为通顺的文字描述

只需要返回整理后的文本，不要添加任何解释。

需要整理的文本：
---
${document.content}
---`;

    const cleanupCompletion = await llm.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "你是一位文档整理专家，擅长修复PDF提取文本中的格式问题。" },
        { role: "user", content: cleanupPrompt },
      ],
      temperature: 0.1,
    });

    const cleanedContent = cleanupCompletion.choices[0]?.message?.content || document.content;
    console.log(`Original content length: ${document.content.length}, Cleaned content length: ${cleanedContent.length}`);

    // Step 2: Now generate units based on the cleaned content
    const generatePrompt = `你是一位专业的教育内容分析专家。你的任务是将以下学习材料拆分成多个背诵单元。

对于每个单元，请提供：
1. title: 单元的简洁标题（使用与原文相同的语言）
2. sourceText: 原文的精确摘录——必须直接从原文中逐字复制，不能修改、概括或编造
3. keywords: 3-8个关键术语/概念，学生在背诵时应提及
4. recitationType: "free"（自由回忆）、"qa"（问答）或"fill-blank"（填空）
5. difficulty: 1-5（1=简单，5=困难）
6. estimatedMinutes: 预计完成该单元的分钟数

重要规则：
- sourceText 必须是原文的精确摘录，不能有任何修改、概括或添加
- 每个单元应该聚焦于一个独立的知识点或概念
- 单元之间内容不应重叠
- 所有单元合起来应覆盖原文的主要内容
- 如果原文有章节标题，可以用作单元划分的依据

请严格按照以下 JSON 格式回复（只返回 JSON，不要有其他内容）：
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

需要分析的学习材料：
---
${cleanedContent}
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

    // Validate units: check that sourceText exists in the cleaned content
    // Since we cleaned the content first, the sourceText should match the cleaned version
    const normalizedCleanedContent = cleanedContent.replace(/\s+/g, " ").trim();

    const validatedUnits = parsed.units.filter((unit) => {
      // Validate keywords
      if (!unit.keywords || !Array.isArray(unit.keywords) || unit.keywords.length === 0) {
        console.warn(`Unit "${unit.title}" has no keywords, using title as fallback`);
        unit.keywords = [unit.title];
      }
      // Validate difficulty
      if (unit.difficulty < 1 || unit.difficulty > 5) {
        unit.difficulty = 3;
      }
      // Validate estimatedMinutes
      if (unit.estimatedMinutes < 1 || unit.estimatedMinutes > 120) {
        unit.estimatedMinutes = 10;
      }

      // Check if sourceText exists
      if (!unit.sourceText) {
        console.warn(`Skipping unit "${unit.title}": sourceText is empty`);
        return false;
      }

      // Normalize sourceText for comparison
      const normalizedSourceText = unit.sourceText.replace(/\s+/g, " ").trim();

      // Check against cleaned content (primary check)
      if (normalizedCleanedContent.includes(normalizedSourceText)) {
        unit.sourceText = normalizedSourceText;
        return true;
      }

      // Fallback: check against original document content with fuzzy matching
      const normalizedDocContent = document.content.replace(/\s+/g, " ").trim();
      if (normalizedDocContent.includes(normalizedSourceText)) {
        unit.sourceText = normalizedSourceText;
        return true;
      }

      // Try matching by removing all whitespace
      const noSpaceDoc = document.content.replace(/\s+/g, "");
      const noSpaceSource = unit.sourceText.replace(/\s+/g, "");
      if (noSpaceDoc.includes(noSpaceSource)) {
        unit.sourceText = normalizedSourceText;
        return true;
      }

      // If sourceText is very long (>100 chars) and mostly matches, accept it
      if (unit.sourceText.length > 100) {
        const docWords = new Set(normalizedDocContent.split(/\s+/));
        const sourceWords = normalizedSourceText.split(/\s+/);
        const significantWords = sourceWords.filter(w => w.length > 2);
        if (significantWords.length > 0) {
          const matchCount = significantWords.filter(w => docWords.has(w)).length;
          const matchRatio = matchCount / significantWords.length;
          if (matchRatio > 0.7) {
            console.log(`Unit "${unit.title}": accepted with ${Math.round(matchRatio * 100)}% word match`);
            unit.sourceText = normalizedSourceText;
            return true;
          }
        }
      }

      console.warn(`Skipping unit "${unit.title}": sourceText not found in cleaned/original document`);
      return false;
    });



    if (validatedUnits.length === 0) {
      return NextResponse.json(
        { error: "All generated units failed validation - none contain valid sourceText from the original document" },
        { status: 500 }
      );
    }

    console.log(`Generated ${validatedUnits.length} valid units out of ${parsed.units.length} total`);

    // Save units to database
    const units = await Promise.all(
      validatedUnits.map((unit, index) =>
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
