import React from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

type StageStatus = "pending" | "running" | "completed" | "failed";

interface Stage {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: StageStatus;
}

interface PipelineVisualizerProps {
  stages: Stage[];
  className?: string;
}

const statusConfig: Record<StageStatus, { bg: string; border: string; icon: React.ReactNode }> = {
  pending: {
    bg: "bg-slate-800",
    border: "border-slate-600",
    icon: <Clock className="w-5 h-5 text-slate-400" />,
  },
  running: {
    bg: "bg-slate-800",
    border: "border-cyan-500",
    icon: <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />,
  },
  completed: {
    bg: "bg-slate-800",
    border: "border-green-500",
    icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
  },
  failed: {
    bg: "bg-slate-800",
    border: "border-red-500",
    icon: <AlertCircle className="w-5 h-5 text-red-400" />,
  },
};

export function PipelineVisualizer({ stages, className = "" }: PipelineVisualizerProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {stages.map((stage, index) => {
        const config = statusConfig[stage.status];
        const isLast = index === stages.length - 1;

        return (
          <React.Fragment key={stage.id}>
            <div
              className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border ${config.bg} ${config.border} transition-all duration-300 flex-1`}
            >
              <div className="flex items-center gap-2">
                {config.icon}
                <span className="text-xs font-medium text-slate-300">{stage.label}</span>
              </div>
              <div className="text-xs text-slate-400 capitalize">{stage.status}</div>
            </div>

            {!isLast && (
              <div className="flex items-center px-2">
                <div className="w-6 h-0.5 bg-gradient-to-r from-slate-700 to-slate-600"></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
