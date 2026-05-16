"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  RefreshCw,
  ArrowRight,
  XCircle,
  Clock,
} from "lucide-react";
import { formatDateTime, getScoreBgColor } from "@/lib/utils";

export default function MistakesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMistakes();
  }, []);

  async function fetchMistakes() {
    setLoading(true);
    try {
      const res = await fetch("/api/mistakes");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch mistakes:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const mistakes = data?.mistakes || [];
  const failedAttempts = data?.failedAttempts || [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mistakes & Review</h1>
        <p className="text-muted-foreground mt-1">
          Review units that need more practice and see your past mistakes.
        </p>
      </div>

      {/* Units Needing Review */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Units Needing Review</span>
            <Badge variant="warning">{mistakes.length} units</Badge>
          </CardTitle>
          <CardDescription>
            Units that you haven't mastered yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mistakes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No units need review. Great job!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mistakes.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        item.status === "learning"
                          ? "bg-red-100"
                          : item.status === "reviewing"
                          ? "bg-yellow-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {item.status === "learning" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.unit?.title || "Unknown Unit"}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.unit?.document?.title || "No document"}
                        {item.lastScore !== null && ` · Last score: ${item.lastScore}/100`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === "learning"
                          ? "destructive"
                          : item.status === "reviewing"
                          ? "warning"
                          : "info"
                      }
                    >
                      {item.status === "not_started"
                        ? "Not Started"
                        : item.status === "learning"
                        ? "Learning"
                        : "Reviewing"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/recitation-chat?unitId=${item.unitId}`)
                      }
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Failed Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Failed Attempts</span>
            <Badge variant="destructive">{failedAttempts.length} attempts</Badge>
          </CardTitle>
          <CardDescription>
            Your most recent recitation attempts that didn't pass.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failedAttempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No failed attempts. Keep up the good work!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedAttempts.map((attempt: any) => {
                const missingKeywords = JSON.parse(
                  attempt.missingKeywords || "[]"
                );
                return (
                  <Card key={attempt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {attempt.session?.unit?.title || "Unit"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(attempt.createdAt)}
                          </p>
                        </div>
                        <Badge className={getScoreBgColor(attempt.score)}>
                          {attempt.score}/100
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Your answer:
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {attempt.userInput}
                        </p>
                      </div>

                      {missingKeywords.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Missing keywords:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {missingKeywords.map((kw: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {attempt.feedback && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Feedback:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {attempt.feedback}
                          </p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/recitation-chat?unitId=${attempt.session?.unitId}`
                          )
                        }
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
