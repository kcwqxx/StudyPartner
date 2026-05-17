import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "无";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "无";
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-800",
    learning: "bg-blue-100 text-blue-800",
    reviewing: "bg-yellow-100 text-yellow-800",
    mastered: "bg-green-100 text-green-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    not_started: "未开始",
    learning: "学习中",
    reviewing: "复习中",
    mastered: "已掌握",
  };
  return map[status] || "未知";
}

export function getModeLabel(mode: string): string {
  const map: Record<string, string> = {
    sequential: "顺序学习",
    random: "随机打乱",
    spaced: "间隔重复",
  };
  return map[mode] || mode;
}
