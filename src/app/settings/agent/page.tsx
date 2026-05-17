"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Loader2, Save, Bot, User } from "lucide-react";

export default function AgentSettingsPage() {
  const [settings, setSettings] = useState({
    persona: "encouraging_tutor",
    strictness: "medium",
    hintLevel: "moderate",
    feedbackLength: "concise",
    language: "auto",
    customPersona: "",
    partnerName: "AI 背诵教练",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings/agent");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          persona: data.persona || "encouraging_tutor",
          strictness: data.strictness || "medium",
          hintLevel: data.hintLevel || "moderate",
          feedbackLength: data.feedbackLength || "concise",
          language: data.language || "auto",
          customPersona: data.customPersona || "",
          partnerName: data.partnerName || "AI 背诵教练",
        });
      }
    } catch (error) {
      console.error("获取教练设置失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("保存教练设置失败:", error);
    } finally {
      setSaving(false);
    }
  }

  const personaOptions = [
    { value: "encouraging_tutor", label: "鼓励型导师" },
    { value: "strict_professor", label: "严格型教授" },
    { value: "friendly_coach", label: "友好型教练" },
    { value: "socratic_mentor", label: "苏格拉底式导师" },
    { value: "custom", label: "自定义风格" },
  ];

  const strictnessOptions = [
    { value: "low", label: "宽松（宽容评分）" },
    { value: "medium", label: "适中（平衡）" },
    { value: "high", label: "严格（高要求）" },
  ];

  const hintOptions = [
    { value: "minimal", label: "最少提示" },
    { value: "moderate", label: "适中提示" },
    { value: "detailed", label: "详细提示" },
  ];

  const lengthOptions = [
    { value: "concise", label: "简洁" },
    { value: "detailed", label: "详细" },
    { value: "comprehensive", label: "全面" },
  ];

  const languageOptions = [
    { value: "auto", label: "自动（匹配学生语言）" },
    { value: "en", label: "英文" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日语" },
    { value: "ko", label: "韩语" },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">教练风格设置</h1>
        <p className="text-muted-foreground mt-1">
          自定义您的 AI 背诵教练的个性和行为。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            教练个性
          </CardTitle>
          <CardDescription>
            配置 AI 教练在背诵练习中与您互动的方式。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-1 block">个性风格</label>
            <Select
              value={settings.persona}
              onChange={(e) =>
                setSettings({ ...settings, persona: e.target.value })
              }
              options={personaOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              教练的整体个性和教学风格。
            </p>
          </div>

          {/* 自定义教练风格 - 仅在选择"自定义风格"时显示 */}
          {settings.persona === "custom" && (
            <div>
              <label className="text-sm font-medium mb-1 block">自定义教练风格</label>
              <Textarea
                placeholder={`例如：你是一位严格的军事教官，要求准确率在95%以上才能通过。用简洁有力的语言给出评价，偶尔鼓励但保持高标准。`}
                value={settings.customPersona}
                onChange={(e) =>
                  setSettings({ ...settings, customPersona: e.target.value })
                }
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                您可以自由编写教练的个性和行为描述。格式不限，AI 会按照您的指令行事。
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">严格程度</label>
            <Select
              value={settings.strictness}
              onChange={(e) =>
                setSettings({ ...settings, strictness: e.target.value })
              }
              options={strictnessOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              教练评估您的背诵回答时的严格程度。
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">提示级别</label>
            <Select
              value={settings.hintLevel}
              onChange={(e) =>
                setSettings({ ...settings, hintLevel: e.target.value })
              }
              options={hintOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              当您卡住时，教练提供多少帮助。
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              反馈长度
            </label>
            <Select
              value={settings.feedbackLength}
              onChange={(e) =>
                setSettings({ ...settings, feedbackLength: e.target.value })
              }
              options={lengthOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              教练反馈的详细程度。
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">语言</label>
            <Select
              value={settings.language}
              onChange={(e) =>
                setSettings({ ...settings, language: e.target.value })
              }
              options={languageOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              教练使用的语言。
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : saved ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                已保存！
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 背诵搭子名字设置卡片 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            背诵搭子
          </CardTitle>
          <CardDescription>
            为您的 AI 背诵搭子取一个名字，它将出现在背诵聊天中。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">搭子名字</label>
            <Input
              placeholder="输入您想要的搭子名字..."
              value={settings.partnerName}
              onChange={(e) =>
                setSettings({ ...settings, partnerName: e.target.value })
              }
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              这个名字将显示在背诵聊天界面中，作为您的 AI 背诵搭子的称呼。
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : saved ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                已保存！
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
