"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Brain, Eye, EyeOff } from "lucide-react";

export default function ModelSettingsPage() {
  const [settings, setSettings] = useState({
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    chatModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings/model");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          baseUrl: data.baseUrl || "https://api.openai.com/v1",
          apiKey: data.apiKey || "",
          chatModel: data.chatModel || "gpt-4o-mini",
          embeddingModel: data.embeddingModel || "text-embedding-3-small",
        });
      }
    } catch (error) {
      console.error("获取模型设置失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          baseUrl: data.baseUrl || settings.baseUrl,
          apiKey: data.apiKey || settings.apiKey,
          chatModel: data.chatModel || settings.chatModel,
          embeddingModel: data.embeddingModel || settings.embeddingModel,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("保存模型设置失败:", error);
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="text-3xl font-bold">模型设置</h1>
        <p className="text-muted-foreground mt-1">
          配置您的 OpenAI 兼容 API 连接。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            API 配置
          </CardTitle>
          <CardDescription>
            设置 LLM 提供商。支持任何 OpenAI 兼容的 API 端点。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-1 block">Base URL</label>
            <Input
              value={settings.baseUrl}
              onChange={(e) =>
                setSettings({ ...settings, baseUrl: e.target.value })
              }
              placeholder="https://api.openai.com/v1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              API 提供商的基础 URL。默认为 OpenAI。
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">API Key</label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings({ ...settings, apiKey: e.target.value })
                }
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              您的 API 密钥安全存储，不会暴露给前端。
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              对话模型
            </label>
            <Input
              value={settings.chatModel}
              onChange={(e) =>
                setSettings({ ...settings, chatModel: e.target.value })
              }
              placeholder="gpt-4o-mini"
            />
            <p className="text-xs text-muted-foreground mt-1">
              用于生成单元和评估背诵的模型。
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              嵌入模型
            </label>
            <Input
              value={settings.embeddingModel}
              onChange={(e) =>
                setSettings({ ...settings, embeddingModel: e.target.value })
              }
              placeholder="text-embedding-3-small"
            />
            <p className="text-xs text-muted-foreground mt-1">
              用于生成向量嵌入的模型（用于未来的向量搜索）。
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
