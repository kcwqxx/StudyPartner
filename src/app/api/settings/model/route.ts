import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";

export async function GET() {
  try {
    const userId = await getMockUserId();
    let settings = await prisma.userModelSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.userModelSettings.create({
        data: { userId },
      });
    }

    // Never expose the full API key
    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey ? maskApiKey(settings.apiKey) : "",
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error("GET /api/settings/model error:", error);
    return NextResponse.json({ error: "Failed to fetch model settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getMockUserId();
    const body = await request.json();
    const { baseUrl, apiKey, chatModel, embeddingModel } = body;

    const currentSettings = await prisma.userModelSettings.findUnique({
      where: { userId },
    });

    // Only update apiKey if a new one is provided (not masked)
    let newApiKey = currentSettings?.apiKey || "";
    if (apiKey && !apiKey.includes("****")) {
      newApiKey = apiKey;
    }

    const settings = await prisma.userModelSettings.upsert({
      where: { userId },
      update: {
        ...(baseUrl !== undefined && { baseUrl }),
        ...(apiKey !== undefined && apiKey !== "****" && { apiKey: newApiKey }),
        ...(chatModel !== undefined && { chatModel }),
        ...(embeddingModel !== undefined && { embeddingModel }),
      },
      create: {
        userId,
        baseUrl: baseUrl || "https://api.openai.com/v1",
        apiKey: newApiKey,
        chatModel: chatModel || "gpt-4o-mini",
        embeddingModel: embeddingModel || "text-embedding-3-small",
      },
    });

    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey ? maskApiKey(settings.apiKey) : "",
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error("POST /api/settings/model error:", error);
    return NextResponse.json({ error: "Failed to update model settings" }, { status: 500 });
  }
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}
