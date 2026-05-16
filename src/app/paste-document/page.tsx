"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";

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

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !projectId) {
      setError("Title, content, and project are required");
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
        throw new Error(data.error || "Failed to create document");
      }

      const doc = await res.json();
      setSuccess("Document created successfully!");

      // Auto-generate units
      setGenerating(true);
      const genRes = await fetch(`/api/documents/${doc.id}/generate-units`, {
        method: "POST",
      });

      if (!genRes.ok) {
        const genData = await genRes.json();
        if (genData.error !== "Units already generated for this document") {
          throw new Error(genData.error || "Failed to generate units");
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

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Paste Study Material</h1>
        <p className="text-muted-foreground mt-1">
          Paste your learning material and let AI break it into recitation units.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Content</CardTitle>
          <CardDescription>
            Select a project and paste your study material below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Project *
              </label>
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.title,
                }))}
                placeholder="Select a project..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Document Title *
              </label>
              <Input
                placeholder="e.g., Chapter 5: Cell Division Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Study Content *
              </label>
              <Textarea
                placeholder="Paste your study material here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste textbook excerpts, lecture notes, or any study material.
                The AI will analyze and split it into recitation units.
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
                Cancel
              </Button>
              <Button type="submit" disabled={loading || generating}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Units...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Save & Generate Units
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
