"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";

interface DashboardData {
  projects: { id: string; title: string; subject: string | null; createdAt: string; _count: { documents: number } }[];
  todayTasks: { total: number; completed: number; items: any[] };
  stats: {
    totalUnits: number;
    masteredUnits: number;
    learningUnits: number;
    mistakesCount: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [projectsRes, tasksRes, mistakesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks/today"),
        fetch("/api/mistakes"),
      ]);

      const projects = await projectsRes.json();
      const todayTasks = await tasksRes.json();
      const mistakes = await mistakesRes.json();

      const allProgress = mistakes.mistakes || [];
      const totalUnits = allProgress.length;
      const masteredUnits = 0;
      const learningUnits = allProgress.filter((p: any) => p.status === "learning").length;
      const mistakesCount = (mistakes.failedAttempts || []).length;

      setData({
        projects,
        todayTasks,
        stats: {
          totalUnits,
          masteredUnits,
          learningUnits,
          mistakesCount,
        },
      });
    } catch (error) {
      console.error("获取仪表盘数据失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject(projectId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定要删除这个项目吗？此操作不可撤销，项目下所有文档和学习计划都将被删除。")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("删除项目失败:", error);
    }
  }

  async function handleDeletePlan(planId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定要删除这个学习计划吗？")) return;
    try {
      const res = await fetch(`/api/study-plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("删除学习计划失败:", error);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "今日任务",
      value: `${data?.todayTasks.completed || 0}/${data?.todayTasks.total || 0}`,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "学习中",
      value: data?.stats.learningUnits || 0,
      icon: BookOpen,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "已掌握",
      value: data?.stats.masteredUnits || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "待复习",
      value: data?.stats.mistakesCount || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground mt-1">
            欢迎回来！以下是您的学习概况。
          </p>
        </div>
        <Link href="/create-project">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建项目
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 今日任务 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>今日学习任务</span>
            <Link href="/study-plan">
              <Button variant="outline" size="sm">
                查看计划
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.todayTasks.items && data.todayTasks.items.length > 0 ? (
            <div className="space-y-3">
              {data.todayTasks.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        item.completed ? "bg-green-100" : "bg-blue-100"
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.recitationUnit.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.recitationUnit.document.title}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.completed ? "success" : "info"}>
                    {item.completed ? "已完成" : "待完成"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>今天没有安排任务。</p>
              <p className="text-sm mt-1">
                创建一个项目和学习计划来开始学习吧。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近项目 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>最近项目</span>
            <Link href="/create-project">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                新建
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.projects && data.projects.length > 0 ? (
            <div className="space-y-3">
              {data.projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <Link
                    href={`/paste-document?projectId=${project.id}`}
                    className="flex items-center justify-between flex-1"
                  >
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.subject || "无分类"} · {project._count.documents} 个文档
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-red-500 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>还没有项目。</p>
              <Link href="/create-project">
                <Button className="mt-3" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  创建您的第一个项目
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
