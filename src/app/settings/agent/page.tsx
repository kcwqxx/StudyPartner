"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loader2, Save, Bot } from "lucide-react";

export default function AgentSettingsPage() {
  const [settings, setSettings] = useState({
    persona: "encouraging_tutor",
    strictness: "medium",
    hintLevel: "moderate",
    feedbackLength: "concise",
    language: "auto",
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
        });
      }
    } catch (error) {
      console.error("Failed to fetch agent settings:", error);
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
      console.error("Failed to save agent settings:", error);
    } finally {
      setSaving(false);
    }
  }

  const personaOptions = [
    { value: "encouraging_tutor", label: "Encouraging Tutor" },
    { value: "strict_professor", label: "Strict Professor" },
    { value: "friendly_coach", label: "Friendly Coach" },
    { value: "socratic_mentor", label: "Socratic Mentor" },
  ];

  const strictnessOptions = [
    { value: "low", label: "Low (Lenient)" },
    { value: "medium", label: "Medium (Balanced)" },
    { value: "high", label: "High (Strict)" },
  ];

  const hintOptions = [
    { value: "minimal", label: "Minimal Hints" },
    { value: "moderate", label: "Moderate Hints" },
    { value: "detailed", label: "Detailed Hints" },
  ];

  const lengthOptions = [
    { value: "concise", label: "Concise" },
    { value: "detailed", label: "Detailed" },
    { value: "comprehensive", label: "Comprehensive" },
  ];

  const languageOptions = [
    { value: "auto", label: "Auto (Match Student)" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
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
        <h1 className="text-3xl font-bold">Agent Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your AI Recitation Coach's personality and behavior.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Coach Personality
          </CardTitle>
          <CardDescription>
            Configure how your AI coach interacts with you during recitation sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-1 block">Persona</label>
            <Select
              value={settings.persona}
              onChange={(e) =>
                setSettings({ ...settings, persona: e.target.value })
              }
              options={personaOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              The overall personality and teaching style of your AI coach.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Strictness</label>
            <Select
              value={settings.strictness}
              onChange={(e) =>
                setSettings({ ...settings, strictness: e.target.value })
              }
              options={strictnessOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How strictly the coach evaluates your recitation responses.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Hint Level</label>
            <Select
              value={settings.hintLevel}
              onChange={(e) =>
                setSettings({ ...settings, hintLevel: e.target.value })
              }
              options={hintOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How much help the coach provides when you're stuck.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Feedback Length
            </label>
            <Select
              value={settings.feedbackLength}
              onChange={(e) =>
                setSettings({ ...settings, feedbackLength: e.target.value })
              }
              options={lengthOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How detailed the coach's feedback should be.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Language</label>
            <Select
              value={settings.language}
              onChange={(e) =>
                setSettings({ ...settings, language: e.target.value })
              }
              options={languageOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              The language the coach uses for feedback and instructions.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
