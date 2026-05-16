"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Target,
} from "lucide-react";
import { getScoreBgColor } from "@/lib/utils";

interface Message {
  role: "coach" | "user" | "system";
  content: string;
  evaluation?: {
    score: number;
    passed: boolean;
    missingKeywords: string[];
    feedback: string;
    nextAction: string;
  };
}

function RecitationChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitIdParam = searchParams.get("unitId");

  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState(unitIdParam || "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch all units
    fetch("/api/projects")
      .then((r) => r.json())
      .then(async (projects) => {
        const allUnits: any[] = [];
        for (const p of projects) {
          const docsRes = await fetch(`/api/documents`, { method: "GET" } as any);
          // We'll just fetch units directly
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      loadUnit(selectedUnitId);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadUnit(unitId: string) {
    setLoading(true);
    try {
      // Get unit info from the document
      const res = await fetch(`/api/documents`);
      // We need to find the unit - let's try a different approach
      // For now, start a session directly
      const sessionRes = await fetch("/api/recitation-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId }),
      });

      if (sessionRes.ok) {
        const data = await sessionRes.json();
        setSessionId(data.session.id);
        setCurrentUnit(data.unit);
        setSessionStarted(true);

        const keywords = JSON.parse(data.unit.keywords || "[]");

        setMessages([
          {
            role: "coach",
            content: `📚 **Let's start recitation!**

I'll be your coach for this session. Here's what we're working on:

**Unit:** ${data.unit.title}
**Type:** ${data.unit.recitationType}
**Difficulty:** ${"★".repeat(data.unit.difficulty)}${"☆".repeat(5 - data.unit.difficulty)}

**Key concepts to cover:**
${keywords.map((k: string) => `- ${k}`).join("\n")}

**Source text for reference:**
> ${data.unit.sourceText.slice(0, 200)}${data.unit.sourceText.length > 200 ? "..." : ""}

Go ahead and recite what you remember! Take your time and try to cover all the key concepts. 🎯`,
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load unit:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!userInput.trim() || !sessionId || evaluating) return;

    const input = userInput.trim();
    setUserInput("");
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setEvaluating(true);

    try {
      const res = await fetch(`/api/recitation-sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input }),
      });

      if (!res.ok) throw new Error("Failed to evaluate");

      const data = await res.json();
      const evalData = data.evaluation;

      const coachMessage: Message = {
        role: "coach",
        content: "",
        evaluation: evalData,
      };

      // Build coach response based on evaluation
      let coachResponse = "";

      if (evalData.passed) {
        coachResponse += `✅ **Great job! You passed!** (Score: ${evalData.score}/100)\n\n`;
        if (evalData.score >= 80) {
          coachResponse += "Excellent work! You have a solid understanding of this material. 🌟\n\n";
        } else {
          coachResponse += "Good effort! You got the main points, but there's room for improvement.\n\n";
        }
      } else {
        coachResponse += `❌ **Not quite there yet.** (Score: ${evalData.score}/100)\n\n`;
        coachResponse += "Don't worry! Let's review what needs work.\n\n";
      }

      if (evalData.missingKeywords && evalData.missingKeywords.length > 0) {
        coachResponse += `**Missing or weak areas:**\n`;
        evalData.missingKeywords.forEach((kw: string) => {
          coachResponse += `- ${kw}\n`;
        });
        coachResponse += "\n";
      }

      coachResponse += `**Feedback:** ${evalData.feedback}\n\n`;

      if (evalData.nextAction === "next") {
        coachResponse += "🎉 You're ready to move on to the next unit!";
      } else if (evalData.nextAction === "repeat") {
        coachResponse += "🔄 Let's try again. Review the key concepts and give it another shot!";
      } else {
        coachResponse += "📖 Take some time to review the material, then try again.";
      }

      coachMessage.content = coachResponse;
      setMessages((prev) => [...prev, coachMessage]);
    } catch (error) {
      console.error("Evaluation error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Sorry, there was an error evaluating your response. Please try again.",
        },
      ]);
    } finally {
      setEvaluating(false);
    }
  }

  async function handleNextAction() {
    if (!currentUnit) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.evaluation?.nextAction === "next") {
      // Move to next unit - for now just show completion
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: "🎉 **Session Complete!**\n\nYou've finished this recitation unit. You can:\n- Go to your **Study Plan** to continue\n- Review **Mistakes** to see areas for improvement\n- Start a new recitation session",
        },
      ]);
      return;
    }

    if (lastMessage?.evaluation?.nextAction === "repeat") {
      // Reset for another attempt
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: "🔄 **Let's try again!**\n\nReview the key concepts and give it another attempt. I believe you can do it! 💪",
        },
      ]);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Recitation Coach</h1>
        <p className="text-muted-foreground mt-1">
          Your personal AI coach will guide you through recitation sessions.
        </p>
      </div>

      {!sessionStarted ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-primary opacity-70" />
            <h2 className="text-xl font-semibold mb-2">Ready to Start Reciting?</h2>
            <p className="text-muted-foreground mb-6">
              Select a unit from your study plan to begin a recitation session.
              Your AI coach will guide you through the process.
            </p>
            <div className="flex flex-col items-center gap-3">
              <Button onClick={() => router.push("/study-plan")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Go to Study Plan
              </Button>
              <p className="text-sm text-muted-foreground">
                Or click on any unit in your study plan to start reciting.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Preparing your session...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unit Info Bar */}
          {currentUnit && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{currentUnit.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentUnit.recitationType} · {currentUnit.estimatedMinutes} min
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    Difficulty: {"★".repeat(currentUnit.difficulty)}
                    {"☆".repeat(5 - currentUnit.difficulty)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Messages */}
          <Card className="min-h-[400px] max-h-[600px] overflow-y-auto">
            <CardContent className="p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.role === "system"
                        ? "bg-yellow-100 text-yellow-900"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "coach" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">
                          AI Coach
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Evaluation Results */}
                    {msg.evaluation && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Score:</span>
                          <Badge className={getScoreBgColor(msg.evaluation.score)}>
                            {msg.evaluation.score}/100
                          </Badge>
                          {msg.evaluation.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>

                        {msg.evaluation.missingKeywords.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">
                              Missing Keywords:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.evaluation.missingKeywords.map((kw, i) => (
                                <Badge key={i} variant="destructive" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          {msg.evaluation.nextAction === "next" && (
                            <Button
                              size="sm"
                              onClick={handleNextAction}
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Next Unit
                            </Button>
                          )}
                          {msg.evaluation.nextAction === "repeat" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleNextAction}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Try Again
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {evaluating && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm text-muted-foreground">
                        Evaluating your response...
                      </span>
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>
          </Card>

          {/* Input Area */}
          <div className="flex gap-3">
            <Textarea
              placeholder="Type your recitation here... Try to cover all the key concepts!"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={3}
              className="flex-1"
              disabled={evaluating}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!userInput.trim() || evaluating}
                className="h-full"
              >
                {evaluating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Press Enter to submit, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}

export default function RecitationChatPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-4xl mx-auto"><Loader2 className="h-6 w-6 animate-spin mx-auto mt-20" /></div>}>
      <RecitationChatContent />
    </Suspense>
  );
}
