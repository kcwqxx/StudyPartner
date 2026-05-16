"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function StudyPlanPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("30");
  const [recitationMode, setRecitationMode] = useState("sequential");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, plansRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/study-plans"),
        ]);
        setProjects(await projectsRes.json());
        setPlans(await plansRes.json());
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, []);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("Please select a project");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          targetDate: targetDate || null,
          dailyMinutes: parseInt(dailyMinutes),
          recitationMode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create study plan");
      }

      const result = await res.json();
      // Refresh plans
      const plansRes = await fetch("/api/study-plans");
      setPlans(await plansRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const modeOptions = [
    { value: "sequential", label: "Sequential (one by one)" },
    { value: "random", label: "Random (shuffle daily)" },
    { value: "spaced", label: "Spaced Repetition" },
  ];

  if (fetching) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Study Plan</h1>
        <p className="text-muted-foreground mt-1">
          Create a study plan to schedule your recitation sessions.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Study Plan</CardTitle>
          <CardDescription>
            Select a project and set your study preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Project *</label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Target Date
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Daily Minutes
                </label>
                <Input
                  type="number"
                  min={5}
                  max={480}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mode</label>
                <Select
                  value={recitationMode}
                  onChange={(e) => setRecitationMode(e.target.value)}
                  options={modeOptions}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Study Plan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Plans */}
      <h2 className="text-xl font-semibold mb-4">Your Study Plans</h2>
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No study plans yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a plan above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const totalItems = plan.items?.length || 0;
            const completedItems = plan.items?.filter((i: any) => i.completed).length || 0;
            const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{plan.project?.title || "Project"}</CardTitle>
                      <CardDescription>
                        Created {formatDate(plan.createdAt)}
                        {plan.targetDate && ` · Target: ${formatDate(plan.targetDate)}`}
                      </CardDescription>
                    </div>
                    <Badge variant="info">{plan.recitationMode}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>
                        {completedItems}/{totalItems} units ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.items?.slice(0, 5).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded border text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {item.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          )}
                          <span>{item.recitationUnit?.title || "Unit"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.scheduledDate
                              ? formatDate(item.scheduledDate)
                              : "No date"}
                          </span>
                          {!item.completed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/recitation-chat?unitId=${item.recitationUnitId}`
                                )
                              }
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {plan.items?.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{plan.items.length - 5} more units
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
