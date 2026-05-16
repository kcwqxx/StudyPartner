"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderPlus,
  FileText,
  ListChecks,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Settings,
  Bot,
  Brain,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create-project", label: "New Project", icon: FolderPlus },
  { href: "/paste-document", label: "Paste Document", icon: FileText },
  { href: "/review-units", label: "Review Units", icon: ListChecks },
  { href: "/study-plan", label: "Study Plan", icon: Calendar },
  { href: "/recitation-chat", label: "Recitation", icon: MessageSquare },
  { href: "/mistakes", label: "Mistakes", icon: AlertTriangle },
  { href: "/settings/agent", label: "Agent Settings", icon: Bot },
  { href: "/settings/model", label: "Model Settings", icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">AI Recitation Coach</span>
        </Link>
      </div>
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
