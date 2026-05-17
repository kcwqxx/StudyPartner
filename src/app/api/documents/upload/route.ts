import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMockUserId } from "@/lib/mock-user";
import { writeFile, unlink } from "node:fs/promises";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";

/**
 * 使用系统 pdftotext 命令提取 PDF 文本
 * pdftotext 是 poppler-utils 的一部分，比纯 JS 库快 10-20 倍
 */
async function parsePDFWithPdftotext(buffer: Uint8Array): Promise<string> {
  const tmpFile = path.join(tmpdir(), `upload_${crypto.randomUUID()}.pdf`);
  const tmpOutput = tmpFile.replace(/\.pdf$/i, ".txt");

  try {
    await writeFile(tmpFile, buffer);

    execSync(`pdftotext -layout -nopgbrk "${tmpFile}" "${tmpOutput}"`, {
      timeout: 60_000, // 大文件最多等 60 秒
    });

    const { readFile } = await import("node:fs/promises");
    return await readFile(tmpOutput, "utf-8");
  } finally {
    // 清理临时文件
    unlink(tmpFile).catch(() => {});
    unlink(tmpOutput).catch(() => {});
  }
}

// DOCX 解析函数
async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getMockUserId();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const title = formData.get("title") as string | null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "请提供文件和项目" },
        { status: 400 }
      );
    }

    const fileName = title || file.name.replace(/\.[^/.]+$/, "");
    const fileType = file.name.split(".").pop()?.toLowerCase() || "";

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();

    // 解析文件内容
    let content = "";
    try {
      if (fileType === "pdf") {
        // 使用 pdftotext 解析 PDF（速度快，支持大文件）
        content = await parsePDFWithPdftotext(new Uint8Array(arrayBuffer));
      } else if (fileType === "docx") {
        content = await parseDOCX(Buffer.from(arrayBuffer));
      } else if (fileType === "txt") {
        content = new TextDecoder("utf-8").decode(arrayBuffer);
      } else {
        return NextResponse.json(
          { error: "不支持的文件格式，请上传 PDF、DOCX 或 TXT 文件" },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error("File parse error:", parseError);
      return NextResponse.json(
        { error: "文件解析失败，请确保文件格式正确" },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: "无法从文件中提取文本内容" },
        { status: 400 }
      );
    }

    // 创建文档
    const document = await prisma.document.create({
      data: {
        title: fileName,
        content: content.trim(),
        sourceType: "upload",
        projectId,
        userId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: "上传文档失败" }, { status: 500 });
  }
}
