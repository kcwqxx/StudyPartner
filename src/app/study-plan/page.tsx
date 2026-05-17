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
  Trash2,
} from "lucide-react";
import { formatDate, getModeLabel } from "@/lib/utils";

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
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
        const plansData = await plansRes.json();
        setPlans(Array.isArray(plansData) ? plansData : []);
      } catch (error) {
        console.error("获取数据失败:", error);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, []);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("请选择一个项目");
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
        throw new Error(data.error || "创建学习计划失败");
      }

      const result = await res.json();
      const plansRes = await fetch("/api/study-plans");
      setPlans(await plansRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!confirm("确定要删除这个学习计划吗？")) return;
    try {
      const res = await fetch(`/api/study-plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== planId));
      }
    } catch (error) {
      console.error("删除学习计划失败:", error);
    }
  }

  const modeOptions = [
    { value: "sequential", label: "顺序学习（逐个进行）" },
    { value: "random", label: "随机模式（每天打乱）" },
    { value: "spaced", label: "间隔重复" },
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
        <h1 className="text-3xl font-bold">学习计划</h1>
        <p className="text-muted-foreground mt-1">
          创建学习计划来安排您的背诵任务。
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>创建新学习计划</CardTitle>
          <CardDescription>
            选择一个项目并设置您的学习偏好。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">项目 *</label>
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.title,
                }))}
                placeholder="选择一个项目..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  目标日期
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  每天学习分钟数
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
                <label className="text-sm font-medium mb-1 block">模式</label>
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
                  创建计划中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成学习计划
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 已有计划 */}
      <h2 className="text-xl font-semibold mb-4">您的学习计划</h2>
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">还没有学习计划。</p>
            <p className="text-sm text-muted-foreground mt-1">
              在上方创建一个计划来开始学习。
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
                      <CardTitle>{plan.project?.title || "项目"}</CardTitle>
                      <CardDescription>
                        创建于 {formatDate(plan.createdAt)}
                        {plan.targetDate && ` · 目标：${formatDate(plan.targetDate)}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{getModeLabel(plan.recitationMode)}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>学习进度</span>
                      <span>
                        {completedItems}/{totalItems} 单元（{progress}%）
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
                          <span>{item.recitationUnit?.title || "单元"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.scheduledDate
                              ? formatDate(item.scheduledDate)
                              : "无日期"}
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
                        还有 {plan.items.length - 5} 个单元
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
