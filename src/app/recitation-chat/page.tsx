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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [partnerName, setPartnerName] = useState("AI 背诵教练");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgentSettings();
  }, []);

  useEffect(() => {
    if (selectedUnitId) {
      loadUnit(selectedUnitId);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchAgentSettings() {
    try {
      const res = await fetch("/api/settings/agent");
      if (res.ok) {
        const data = await res.json();
        if (data.partnerName) {
          setPartnerName(data.partnerName);
        }
      }
    } catch (error) {
      console.error("获取教练设置失败:", error);
    }
  }

  async function loadUnit(unitId: string) {
    setLoading(true);
    try {
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
            content: `📚 **开始背诵！**

我是${partnerName}，今天由我来担任您的背诵搭子。以下是我们今天的学习内容：

**单元：** ${data.unit.title}
**类型：** ${data.unit.recitationType}
**难度：** ${"★".repeat(data.unit.difficulty)}${"☆".repeat(5 - data.unit.difficulty)}

**需要掌握的关键概念：**
${keywords.map((k: string) => `- ${k}`).join("\n")}

**原文参考：**
> ${data.unit.sourceText.slice(0, 200)}${data.unit.sourceText.length > 200 ? "..." : ""}

现在开始背诵您记住的内容！尽量覆盖所有关键概念。🎯`,
          },
        ]);
      }
    } catch (error) {
      console.error("加载单元失败:", error);
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

      if (!res.ok) throw new Error("评估失败");

      const data = await res.json();
      const evalData = data.evaluation;

      // 直接使用 LLM 根据人设生成的完整个性化反馈
      // 不再用硬编码模板覆盖，这样自定义人设的风格才能完整展现
      const coachMessage: Message = {
        role: "coach",
        content: evalData.feedback,
        evaluation: evalData,
      };
      setMessages((prev) => [...prev, coachMessage]);
    } catch (error) {
      console.error("评估错误:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "抱歉，评估您的回答时出错了。请再试一次。",
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
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: "🎉 **会话完成！**\n\n您已经完成了这个背诵单元。您可以：\n- 前往**学习计划**继续学习\n- 查看**错题本**了解需要改进的地方\n- 开始新的背诵",
        },
      ]);
      return;
    }

    if (lastMessage?.evaluation?.nextAction === "repeat") {
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: "🔄 **再来一次！**\n\n复习重点概念，再试一次。我相信您能做到！💪",
        },
      ]);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">背诵搭子</h1>
        <p className="text-muted-foreground mt-1">
          您的个人 AI 背诵搭子 {partnerName} 将引导您完成背诵练习。
        </p>
      </div>

      {!sessionStarted ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-primary opacity-70" />
            <h2 className="text-xl font-semibold mb-2">准备开始背诵了吗？</h2>
            <p className="text-muted-foreground mb-6">
              从学习计划中选择一个单元开始背诵。{partnerName} 将全程引导您。
            </p>
            <div className="flex flex-col items-center gap-3">
              <Button onClick={() => router.push("/study-plan")}>
                <BookOpen className="h-4 w-4 mr-2" />
                前往学习计划
              </Button>
              <p className="text-sm text-muted-foreground">
                或者点击学习计划中的任何单元开始背诵。
              </p>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">正在准备会话...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 单元信息栏 */}
          {currentUnit && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{currentUnit.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentUnit.recitationType} · {currentUnit.estimatedMinutes} 分钟
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    难度：{"★".repeat(currentUnit.difficulty)}
                    {"☆".repeat(5 - currentUnit.difficulty)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 聊天消息区域 */}
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
                          {partnerName}
                        </span>
                      </div>
                    )}
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* 评估结果 */}
                    {msg.evaluation && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">得分：</span>
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
                              遗漏的关键词：
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
                              下一个单元
                            </Button>
                          )}
                          {msg.evaluation.nextAction === "repeat" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleNextAction}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              再试一次
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
                        {partnerName} 正在评估您的回答...
                      </span>
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>
          </Card>

          {/* 输入区域 */}
          <div className="flex gap-3">
            <Textarea
              placeholder="在此输入您的背诵内容... 尽量覆盖所有关键概念！"
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
            按 Enter 提交，Shift+Enter 换行
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
