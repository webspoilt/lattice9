import React from "react";

type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const severityConfig: Record<Severity, { bg: string; text: string; icon: string }> = {
  Critical: {
    bg: "bg-red-950",
    text: "text-red-100",
    icon: "⚠️",
  },
  High: {
    bg: "bg-orange-950",
    text: "text-orange-100",
    icon: "🔴",
  },
  Medium: {
    bg: "bg-blue-950",
    text: "text-blue-100",
    icon: "🟡",
  },
  Low: {
    bg: "bg-green-950",
    text: "text-green-100",
    icon: "🟢",
  },
  Info: {
    bg: "bg-slate-800",
    text: "text-slate-100",
    icon: "ℹ️",
  },
};

export function SeverityBadge({ severity, className = "" }: SeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.Info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-opacity-50 ${config.bg} ${config.text} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{severity}</span>
    </span>
  );
}
