import OpenAI from "openai";
import prisma from "./db";
import { MOCK_USER_ID } from "./mock-user";

export async function getLLMClient(userId: string = MOCK_USER_ID) {
  const settings = await prisma.userModelSettings.findUnique({
    where: { userId },
  });

  const baseURL = settings?.baseUrl || "https://api.openai.com/v1";
  const apiKey = settings?.apiKey || process.env.OPENAI_API_KEY || "sk-placeholder";

  return new OpenAI({
    baseURL,
    apiKey,
  });
}

export async function getChatModel(userId: string = MOCK_USER_ID): Promise<string> {
  const settings = await prisma.userModelSettings.findUnique({
    where: { userId },
  });
  return settings?.chatModel || "gpt-4o-mini";
}

export async function getEmbeddingModel(userId: string = MOCK_USER_ID): Promise<string> {
  const settings = await prisma.userModelSettings.findUnique({
    where: { userId },
  });
  return settings?.embeddingModel || "text-embedding-3-small";
}

export async function getAgentSystemPrompt(userId: string = MOCK_USER_ID): Promise<string> {
  const settings = await prisma.agentSettings.findUnique({
    where: { userId },
  });

  const persona = settings?.persona || "encouraging_tutor";
  const strictness = settings?.strictness || "medium";
  const hintLevel = settings?.hintLevel || "moderate";
  const feedbackLength = settings?.feedbackLength || "concise";
  const language = settings?.language || "auto";
  const customPersona = settings?.customPersona;

  const personaMap: Record<string, string> = {
    encouraging_tutor: "你是一位鼓励和支持学生的导师，激励学生做到最好。",
    strict_professor: "你是一位严格但公正的教授，要求学生精确和全面理解。",
    friendly_coach: "你是一位友好的学习教练，让学习变得有趣和吸引人。",
    socratic_mentor: "你是一位苏格拉底式导师，通过提问引导学生自己发现答案。",
  };

  const strictnessMap: Record<string, string> = {
    low: "在评分时宽容一些，接近的答案可以给部分分数。",
    medium: "评分时保持平衡，要求合理的准确性。",
    high: "严格评分，要求高精度和完整性。",
  };

  const hintMap: Record<string, string> = {
    minimal: "提供最少的提示，只在学生卡住时给出微妙的线索。",
    moderate: "提供适度的提示，给出有帮助的指引但不直接给出答案。",
    detailed: "提供详细的提示，将答案分解成更小的部分。",
  };

  const lengthMap: Record<string, string> = {
    concise: "反馈要简洁明了。",
    detailed: "提供详细的反馈，包含具体的改进建议。",
    comprehensive: "提供全面的反馈，涵盖回答的各个方面。",
  };

  const langInstruction = language !== "auto"
    ? `始终使用${language === "zh" ? "中文" : language === "en" ? "英文" : language}回复。`
    : "使用与学生输入相同的语言回复。";

  let personaInstruction = personaMap[persona] || personaMap.encouraging_tutor;

  // 如果有自定义教练风格，使用自定义的
  if (customPersona && customPersona.trim()) {
    personaInstruction = customPersona.trim();
  }

  return `你是AI背诵教练，用于学习伙伴应用。

${personaInstruction}

${strictnessMap[strictness] || strictnessMap.medium}

${hintMap[hintLevel] || hintMap.moderate}

${lengthMap[feedbackLength] || lengthMap.concise}

${langInstruction}

你的职责是：
1. 基于学习材料向学生展示背诵任务。
2. 评估学生的背诵回答的准确性、完整性和理解程度。
3. 提供建设性的反馈，帮助学生改进。
4. 跟踪学生已掌握的概念和需要复习的内容。
5. 根据学生的表现调整教学风格。

评估回答时考虑：
- 关键词覆盖度：学生是否提到了关键概念？
- 语义准确性：学生是否正确理解了概念？
- 逻辑完整性：学生是否提供了完整且连贯的回答？

始终以JSON格式回复，结构如下：
{
  "score": number (0-100),
  "passed": boolean,
  "missing_keywords": string[],
  "feedback": string,
  "next_action": "review" | "next" | "repeat"
}`;
}
