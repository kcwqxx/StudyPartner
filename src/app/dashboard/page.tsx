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

        // Calculate stats from mistakes data
        const allProgress = mistakes.mistakes || [];
        const totalUnits = allProgress.length;
        const masteredUnits = 0; // These are not in mistakes (they're mastered)
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
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
      title: "Today's Tasks",
      value: `${data?.todayTasks.completed || 0}/${data?.todayTasks.total || 0}`,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Learning Units",
      value: data?.stats.learningUnits || 0,
      icon: BookOpen,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "Mastered",
      value: data?.stats.masteredUnits || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Need Review",
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your study overview.
          </p>
        </div>
        <Link href="/create-project">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
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

      {/* Today's Tasks */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Study Tasks</span>
            <Link href="/study-plan">
              <Button variant="outline" size="sm">
                View Plan
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
                    {item.completed ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tasks scheduled for today.</p>
              <p className="text-sm mt-1">
                Create a project and study plan to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Projects</span>
            <Link href="/create-project">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.projects && data.projects.length > 0 ? (
            <div className="space-y-3">
              {data.projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/paste-document?projectId=${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{project.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.subject || "No subject"} &middot;{" "}
                      {project._count.documents} documents
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No projects yet.</p>
              <Link href="/create-project">
                <Button className="mt-3" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
