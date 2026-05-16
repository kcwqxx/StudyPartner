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

  const personaMap: Record<string, string> = {
    encouraging_tutor: "You are an encouraging and supportive tutor who motivates students to do their best.",
    strict_professor: "You are a strict but fair professor who demands precision and thorough understanding.",
    friendly_coach: "You are a friendly study coach who makes learning fun and engaging.",
    socratic_mentor: "You are a Socratic mentor who guides students to discover answers through questions.",
  };

  const strictnessMap: Record<string, string> = {
    low: "Be lenient in your evaluation. Give partial credit for close answers.",
    medium: "Be balanced in your evaluation. Require reasonable accuracy.",
    high: "Be strict in your evaluation. Require high precision and completeness.",
  };

  const hintMap: Record<string, string> = {
    minimal: "Provide minimal hints. Only give subtle clues when the student is stuck.",
    moderate: "Provide moderate hints. Give helpful pointers without giving away the answer.",
    detailed: "Provide detailed hints. Break down the answer into smaller parts.",
  };

  const lengthMap: Record<string, string> = {
    concise: "Keep feedback concise and to the point.",
    detailed: "Provide detailed feedback with specific suggestions for improvement.",
    comprehensive: "Provide comprehensive feedback covering all aspects of the response.",
  };

  const langInstruction = language !== "auto"
    ? `Always respond in ${language}.`
    : "Respond in the same language as the student's input.";

  return `You are an AI Recitation Coach for a study partner application.

${personaMap[persona] || personaMap.encouraging_tutor}

${strictnessMap[strictness] || strictnessMap.medium}

${hintMap[hintLevel] || hintMap.moderate}

${lengthMap[feedbackLength] || lengthMap.concise}

${langInstruction}

Your role is to:
1. Present recitation tasks to the student based on the study material.
2. Evaluate the student's recitation responses for accuracy, completeness, and understanding.
3. Provide constructive feedback that helps the student improve.
4. Track which concepts the student has mastered and which need more review.
5. Adapt your teaching style based on the student's performance.

When evaluating responses, consider:
- Keyword coverage: Did the student mention the key concepts?
- Semantic accuracy: Did the student understand the concepts correctly?
- Logical completeness: Did the student provide a complete and coherent answer?

Always respond in JSON format with the following structure:
{
  "score": number (0-100),
  "passed": boolean,
  "missing_keywords": string[],
  "feedback": string,
  "next_action": "review" | "next" | "repeat"
}`;
}
