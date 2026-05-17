"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Save,
  Sparkles,
  Loader2,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";


function ReviewUnitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

  const [units, setUnits] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState(documentId || "");
  const [loading, setLoading] = useState(false);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [regeneratingUnitId, setRegeneratingUnitId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all documents with units
    fetch("/api/projects")
      .then((r) => r.json())
      .then(async (projects) => {
        const allDocs: any[] = [];
        for (const p of projects) {
          const res = await fetch(`/api/documents`, { method: "GET" } as any);
          // We'll just use a different approach - fetch units directly
        }
      })
      .catch(console.error);
  }, []);


  useEffect(() => {
    if (selectedDocId) {
      fetchUnits(selectedDocId);
    }
  }, [selectedDocId]);

  async function fetchUnits(docId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/units`);
      if (res.ok) {
        const data = await res.json();
        setUnits(data);
      }
    } catch (error) {
      console.error("Failed to fetch units:", error);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(unit: any) {
    setEditingUnit(unit.id);
    setEditForm({
      title: unit.title,
      sourceText: unit.sourceText,
      keywords: JSON.parse(unit.keywords || "[]").join(", "),
      recitationType: unit.recitationType,
      difficulty: unit.difficulty,
      estimatedMinutes: unit.estimatedMinutes,
    });
  }

  async function saveEdit(unitId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${selectedDocId}/units`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          title: editForm.title,
          sourceText: editForm.sourceText,
          keywords: editForm.keywords.split(",").map((k: string) => k.trim()),
          recitationType: editForm.recitationType,
          difficulty: parseInt(editForm.difficulty),
          estimatedMinutes: parseInt(editForm.estimatedMinutes),
        }),
      });

      if (res.ok) {
        setEditingUnit(null);
        fetchUnits(selectedDocId);
      }
    } catch (error) {
      console.error("Failed to save unit:", error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteUnit(unitId: string) {
    setDeletingUnitId(unitId);
    try {
      const res = await fetch(`/api/documents/${selectedDocId}/units`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId }),
      });

      if (res.ok) {
        setConfirmDeleteId(null);
        fetchUnits(selectedDocId);
      }
    } catch (error) {
      console.error("Failed to delete unit:", error);
    } finally {
      setDeletingUnitId(null);
    }
  }

  async function regenerateUnit(unitId: string) {
    setRegeneratingUnitId(unitId);
    try {
      // First delete the old unit
      await fetch(`/api/documents/${selectedDocId}/units`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId }),
      });

      // Then regenerate all units (the API will skip existing ones)
      // We need to delete all units and regenerate
      const res = await fetch(`/api/documents/${selectedDocId}/generate-units`, {
        method: "POST",
      });

      if (res.ok) {
        fetchUnits(selectedDocId);
      } else {
        const data = await res.json();
        if (data.error === "Units already generated for this document") {
          // If units already exist, we need a different approach
          // Delete all units and regenerate
          for (const u of units) {
            await fetch(`/api/documents/${selectedDocId}/units`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ unitId: u.id }),
            });
          }
          const retryRes = await fetch(`/api/documents/${selectedDocId}/generate-units`, {
            method: "POST",
          });
          if (retryRes.ok) {
            fetchUnits(selectedDocId);
          }
        }
      }
    } catch (error) {
      console.error("Failed to regenerate unit:", error);
    } finally {
      setRegeneratingUnitId(null);
    }
  }


  const difficultyOptions = [
    { value: "1", label: "1 - 非常简单" },
    { value: "2", label: "2 - 简单" },
    { value: "3", label: "3 - 中等" },
    { value: "4", label: "4 - 困难" },
    { value: "5", label: "5 - 非常困难" },
  ];

  const typeOptions = [
    { value: "free", label: "自由回忆" },
    { value: "qa", label: "问答" },
    { value: "fill-blank", label: "填空" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">复习背诵单元</h1>
        <p className="text-muted-foreground mt-1">
          在开始学习前，查看和编辑 AI 生成的背诵单元。
        </p>
      </div>

      {!selectedDocId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              请选择一个文档来查看其背诵单元。
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              请先创建项目并粘贴文档以生成单元。
            </p>
            <Button className="mt-4" onClick={() => router.push("/paste-document")}>
              前往粘贴文档
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">正在加载单元...</p>
        </div>
      ) : units.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">该文档没有找到背诵单元。</p>
            <Button
              className="mt-4"
              onClick={async () => {
                setLoading(true);
                try {
                  await fetch(`/api/documents/${selectedDocId}/generate-units`, {
                    method: "POST",
                  });
                  fetchUnits(selectedDocId);
                } catch (error) {
                  console.error(error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              生成单元
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共找到 {units.length} 个单元
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/study-plan?documentId=${selectedDocId}`)}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                创建学习计划
              </Button>
            </div>
          </div>

          {units.map((unit, index) => {
            const keywords = JSON.parse(unit.keywords || "[]");
            const progress = unit.userUnitProgress?.[0];

            return (
              <Card key={unit.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{unit.title}</CardTitle>
                        <CardDescription>
                          {unit.document?.title || "文档"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {progress && (
                        <Badge
                          variant={
                            progress.status === "mastered"
                              ? "success"
                              : progress.status === "learning"
                              ? "warning"
                              : "info"
                          }
                        >
                          {progress.status === "not_started"
                            ? "未开始"
                            : progress.status === "learning"
                            ? "学习中"
                            : progress.status === "reviewing"
                            ? "复习中"
                            : "已掌握"}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(unit)}
                        title="编辑"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(unit.id)}
                        disabled={deletingUnitId === unit.id}
                        title="删除"
                      >
                        {deletingUnitId === unit.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>

                  </div>
                </CardHeader>
                <CardContent>
                  {editingUnit === unit.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium">标题</label>
                        <Input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">源文本</label>
                        <Textarea
                          value={editForm.sourceText}
                          onChange={(e) =>
                            setEditForm({ ...editForm, sourceText: e.target.value })
                          }
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          关键词（逗号分隔）
                        </label>
                        <Input
                          value={editForm.keywords}
                          onChange={(e) =>
                            setEditForm({ ...editForm, keywords: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium">类型</label>
                          <Select
                            value={editForm.recitationType}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                recitationType: e.target.value,
                              })
                            }
                            options={typeOptions}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">难度</label>
                          <Select
                            value={editForm.difficulty?.toString()}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                difficulty: e.target.value,
                              })
                            }
                            options={difficultyOptions}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">
                            预计分钟
                          </label>
                          <Input
                            type="number"
                            value={editForm.estimatedMinutes}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                estimatedMinutes: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUnit(null)}
                        >
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(unit.id)}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          保存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {unit.estimatedMinutes} 分钟
                        </span>
                        <span>
                          难度：{"★".repeat(unit.difficulty)}
                          {"☆".repeat(5 - unit.difficulty)}
                        </span>
                        <Badge variant="outline">
                          {typeOptions.find((t) => t.value === unit.recitationType)?.label || unit.recitationType}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          源文本：
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {unit.sourceText}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {keywords.map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {kw}
                          </Badge>
                        ))}
                      </div>

                      {/* 删除确认 */}
                      {confirmDeleteId === unit.id && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400 flex-1">
                            确定要删除这个单元吗？
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            取消
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteUnit(unit.id)}
                            disabled={deletingUnitId === unit.id}
                          >
                            {deletingUnitId === unit.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : null}
                            确认删除
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReviewUnitsPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-4xl mx-auto"><Loader2 className="h-6 w-6 animate-spin mx-auto mt-20" /></div>}>
      <ReviewUnitsContent />
    </Suspense>
  );
}
