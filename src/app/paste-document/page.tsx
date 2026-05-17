"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Sparkles, Upload, FileText } from "lucide-react";

function PasteDocumentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState(projectIdParam || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) throw new Error("获取项目列表失败");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error("Unexpected projects response:", data);
          setProjects([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        setProjects([]);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !projectId) {
      setError("标题、内容和项目都是必填项");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          projectId,
          sourceType: "paste",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建文档失败");
      }

      const doc = await res.json();
      setSuccess("文档创建成功！");

      // 自动生成学习单元
      setGenerating(true);
      const genRes = await fetch(`/api/documents/${doc.id}/generate-units`, {
        method: "POST",
      });

      if (!genRes.ok) {
        const genData = await genRes.json();
        if (genData.error !== "Units already generated for this document") {
          throw new Error(genData.error || "生成学习单元失败");
        }
      }

      setGenerating(false);
      router.push(`/review-units?documentId=${doc.id}`);
    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !projectId) {
      setError(projectId ? "请选择文件" : "请先选择项目");
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError("文件大小不能超过 50MB");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      if (title) formData.append("title", title);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "上传文件失败");
      }

      const doc = await res.json();
      setSuccess(`文件"${doc.title}"上传成功！`);

      // 自动生成学习单元
      setGenerating(true);
      const genRes = await fetch(`/api/documents/${doc.id}/generate-units`, {
        method: "POST",
      });

      if (!genRes.ok) {
        const genData = await genRes.json();
        if (genData.error !== "Units already generated for this document") {
          throw new Error(genData.error || "生成学习单元失败");
        }
      }

      setGenerating(false);
      router.push(`/review-units?documentId=${doc.id}`);
    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">添加学习材料</h1>
        <p className="text-muted-foreground mt-1">
          粘贴文本或上传 PDF/DOCX/TXT 文件，AI 将自动划分学习单元。
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>上传文件</CardTitle>
          <CardDescription>
            支持 PDF、DOCX 和 TXT 格式，AI 将自动提取文字内容。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                所属项目 *
              </label>
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.title,
                }))}
                placeholder="选择项目..."
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                文档标题（可选）
              </label>
              <Input
                placeholder="不填则使用文件名"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {uploading ? "上传中..." : "点击选择文件"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF、DOCX 或 TXT（最大 50MB）
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading || generating}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>粘贴文本内容</CardTitle>
          <CardDescription>
            或者直接粘贴学习材料文本，AI 将自动分析并划分学习单元。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                文档标题 *
              </label>
              <Input
                placeholder="例如：第五章：细胞分裂笔记"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                学习内容 *
              </label>
              <Textarea
                placeholder="在此粘贴您的学习材料..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                粘贴教材摘录、课堂笔记或任何学习材料，
                AI 将分析并自动划分为背诵单元。
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading || generating || uploading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    正在生成学习单元...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    保存并生成学习单元
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PasteDocumentPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-3xl mx-auto"><Loader2 className="h-6 w-6 animate-spin mx-auto mt-20" /></div>}>
      <PasteDocumentForm />
    </Suspense>
  );
}
