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

  const difficultyOptions = [
    { value: "1", label: "1 - Very Easy" },
    { value: "2", label: "2 - Easy" },
    { value: "3", label: "3 - Medium" },
    { value: "4", label: "4 - Hard" },
    { value: "5", label: "5 - Very Hard" },
  ];

  const typeOptions = [
    { value: "free", label: "Free Recall" },
    { value: "qa", label: "Q&A" },
    { value: "fill-blank", label: "Fill in Blanks" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review Recitation Units</h1>
        <p className="text-muted-foreground mt-1">
          Review and edit the AI-generated recitation units before starting your study.
        </p>
      </div>

      {!selectedDocId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Select a document to review its recitation units.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              First create a project and paste a document to generate units.
            </p>
            <Button className="mt-4" onClick={() => router.push("/paste-document")}>
              Go to Paste Document
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading units...</p>
        </div>
      ) : units.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No units found for this document.</p>
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
              Generate Units
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {units.length} unit{units.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/study-plan?documentId=${selectedDocId}`)}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Create Study Plan
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
                          {unit.document?.title || "Document"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            ? "Not Started"
                            : progress.status === "learning"
                            ? "Learning"
                            : progress.status === "reviewing"
                            ? "Reviewing"
                            : "Mastered"}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(unit)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingUnit === unit.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium">Title</label>
                        <Input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Source Text</label>
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
                          Keywords (comma separated)
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
                          <label className="text-xs font-medium">Type</label>
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
                          <label className="text-xs font-medium">Difficulty</label>
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
                            Est. Minutes
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
                          Cancel
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
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {unit.estimatedMinutes} min
                        </span>
                        <span>
                          Difficulty: {"★".repeat(unit.difficulty)}
                          {"☆".repeat(5 - unit.difficulty)}
                        </span>
                        <Badge variant="outline">{unit.recitationType}</Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Source Text:
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
