import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CorrelationGraph3D } from "@/components/CorrelationGraph3D";
import {
  Activity, Fingerprint, Shield, ChevronRight,
  AlertTriangle, Server, Database, Clock,
} from "lucide-react";

interface IntelligencePanelProps {
  engagementId: string;
}

export function IntelligencePanel({ engagementId }: IntelligencePanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("graph");
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);

  const findingsQuery = trpc.exposure.getFindings.useQuery(
    { engagementId },
    { enabled: !!engagementId },
  );

  const prioritizedQuery = trpc.exposure.getPrioritizedFindings.useQuery(
    { engagementId },
    { enabled: !!engagementId },
  );

  const exploitChainsQuery = trpc.exposure.getExploitChains.useQuery(
    { engagementId },
    { enabled: !!engagementId },
  );

  const temporalHistoryQuery = trpc.exposure.getTemporalHistory.useQuery(
    { engagementId },
    { enabled: !!engagementId },
  );

  const totalRuns = useRunsCount(engagementId);

  const findings = findingsQuery.data || [];
  const prioritized = prioritizedQuery.data || [];
  const exploitChains = exploitChainsQuery.data?.exploit_chains || [];
  const snapshots = temporalHistoryQuery.data?.snapshots || [];
  const drifts = temporalHistoryQuery.data?.drifts || [];

  const severityWeights = { critical: 1.0, high: 0.8, medium: 0.5, low: 0.3, info: 0.1 };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Compact status bar */}
      <div className="h-8 shrink-0 border-b border-white/[0.04] flex items-center gap-6 px-4 text-[9px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-zinc-700 uppercase tracking-widest">Findings:</span>
          <span className="text-zinc-300 font-bold">{findings.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-700 uppercase tracking-widest">Critical:</span>
          <span className="text-red-400 font-bold">{findings.filter(f => f.severity === "critical").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-700 uppercase tracking-widest">Exploit Chains:</span>
          <span className="text-zinc-300 font-bold">{exploitChains.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-700 uppercase tracking-widest">Snapshots:</span>
          <span className="text-zinc-300 font-bold">{snapshots.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-700 uppercase tracking-widest">Drift Events:</span>
          <span className="text-amber-500 font-bold">{drifts.length}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-zinc-700 uppercase tracking-widest">Runs:</span>
          <span className="text-zinc-300 font-bold">{totalRuns}</span>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="h-7 shrink-0 border-b border-white/[0.04] flex items-center px-4 gap-6">
        {[
          { id: "graph", label: "CORRELATION_GRAPH", icon: Activity },
          { id: "findingQueue", label: "FINDING_QUEUE", icon: Shield },
          { id: "exploitChains", label: "EXPLOIT_CHAINS", icon: AlertTriangle },
          { id: "timeline", label: "TEMPORAL", icon: Clock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`text-[9px] font-mono font-bold uppercase tracking-[0.15em] h-full border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? "text-indigo-400 border-indigo-500"
                : "text-zinc-700 border-transparent hover:text-zinc-400"
            }`}
          >
            <tab.icon className="w-2.5 h-2.5" />
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[8px] font-mono text-zinc-800">
            TOPO: {findings.length}n {findings.length * 2}e
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* GRAPH VIEW */}
        {activeSubTab === "graph" && (
          <div className="h-full flex">
            {/* Finding queue — left sidebar in graph view */}
            <div className="w-72 shrink-0 border-r border-white/[0.04] overflow-y-auto">
              <div className="p-3 space-y-1">
                {prioritized.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFinding(f.id === selectedFinding ? null : f.id)}
                    className={`w-full text-left p-2 text-[9px] font-mono border-l-2 transition-all ${
                      selectedFinding === f.id
                        ? "border-indigo-500 bg-white/[0.03]"
                        : "border-transparent hover:border-zinc-700 hover:bg-white/[0.01]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <SeverityBadge severity={f.severity as any} />
                      <span className="text-zinc-700 text-[8px]">{(f as any).priorityScore !== undefined ? `${(Number((f as any).priorityScore) * 100).toFixed(0)}%` : ""}</span>
                    </div>
                    <div className="text-zinc-300 font-bold leading-tight truncate mb-1">
                      {f.title}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-700 text-[7px] uppercase tracking-widest">
                      <span>CWE: {f.cwe || "N/A"}</span>
                      <span>|</span>
                      <span>CONF: {f.confidence}</span>
                      <span>|</span>
                      <span className={f.validationState === "validated" ? "text-emerald-500" : f.validationState === "contradicted" ? "text-red-500" : "text-zinc-600"}>
                        {f.validationState}
                      </span>
                    </div>
                    <div className="mt-1 h-px bg-white/[0.04]" />
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Graph */}
            <div className="flex-1 relative">
              <CorrelationGraph3D engagementId={engagementId} />
            </div>
          </div>
        )}

        {/* FINDING QUEUE (dense table view) */}
        {activeSubTab === "findingQueue" && (
          <div className="h-full overflow-y-auto">
            <table className="w-full text-[10px] font-mono border-collapse">
              <thead className="sticky top-0 bg-[#0a0a0b] z-10">
                <tr className="border-b border-white/[0.04] text-zinc-700 uppercase tracking-widest text-[8px]">
                  <th className="text-left px-3 py-2 font-medium w-8">#</th>
                  <th className="text-left px-3 py-2 font-medium">Severity</th>
                  <th className="text-left px-3 py-2 font-medium">Title</th>
                  <th className="text-right px-3 py-2 font-medium">Confidence</th>
                  <th className="text-right px-3 py-2 font-medium">Priority</th>
                  <th className="text-left px-3 py-2 font-medium">CWE</th>
                  <th className="text-left px-3 py-2 font-medium">Source</th>
                  <th className="text-left px-3 py-2 font-medium">State</th>
                </tr>
              </thead>
              <tbody>
                {prioritized.map((f, i) => (
                  <tr
                    key={f.id}
                    className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedFinding(f.id === selectedFinding ? null : f.id)}
                  >
                    <td className="px-3 py-2 text-zinc-700">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-3 py-2"><SeverityBadge severity={f.severity as any} /></td>
                    <td className="px-3 py-2 text-zinc-300 font-bold truncate max-w-[300px]">{f.title}</td>
                    <td className="px-3 py-2 text-right text-zinc-400">{f.confidence}</td>
                    <td className="px-3 py-2 text-right">
                      {(Number((f as any).priorityScore) || 0) > 0.7 ? (
                        <span className="text-red-400 font-bold">{(Number((f as any).priorityScore) * 100).toFixed(0)}%</span>
                      ) : (
                        <span className="text-zinc-500">{(Number((f as any).priorityScore) * 100).toFixed(0)}%</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-600">{f.cwe || "—"}</td>
                    <td className="px-3 py-2 text-zinc-600">{f.sourceTool || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${
                        f.validationState === "validated" ? "text-emerald-500" :
                        f.validationState === "candidate" ? "text-indigo-400" :
                        f.validationState === "contradicted" ? "text-red-500" : "text-zinc-700"
                      }`}>
                        {f.validationState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EXPLOIT CHAINS */}
        {activeSubTab === "exploitChains" && (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-2">
              {exploitChains.length === 0 && (
                <div className="text-zinc-700 text-[10px] font-mono uppercase tracking-widest p-8 text-center">
                  No exploit chains synthesized. Initiate intelligence capture.
                </div>
              )}
              {exploitChains.map((chain: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/[0.04] text-[10px] font-mono">
                  <div className="w-5 h-5 border border-zinc-700 flex items-center justify-center shrink-0 text-[8px] text-zinc-500">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-amber-400 font-bold">{chain.credential || "?"}</span>
                    <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
                    <span className="text-cyan-400">{chain.service || "?"}</span>
                    <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
                    <span className="text-red-400">{chain.vulnerability || "?"}</span>
                    <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
                    <span className="text-orange-400 truncate">{chain.finding || "?"}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <SeverityBadge severity={(chain.severity || "medium") as any} />
                    <span className="text-zinc-600">Feasibility: {chain.feasibility !== undefined ? (chain.feasibility * 100).toFixed(0) : "—"}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEMPORAL TIMELINE */}
        {activeSubTab === "timeline" && (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Snapshots */}
              <div>
                <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
                  Graph Snapshots ({snapshots.length})
                </h4>
                <div className="space-y-1">
                  {snapshots.length === 0 && (
                    <div className="text-zinc-700 text-[10px] font-mono italic">No snapshots captured yet</div>
                  )}
                  {snapshots.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                      <span className="text-zinc-400">{s.graphVersion}</span>
                      <span className="text-zinc-700">{s.snapshotType}</span>
                      <span className="text-zinc-600">
                        {s.entityCount}n / {s.relationshipCount}e
                      </span>
                      <span className="text-zinc-700">{new Date(s.capturedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drift Events */}
              <div>
                <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
                  Drift Events ({drifts.length})
                </h4>
                <div className="space-y-1">
                  {drifts.length === 0 && (
                    <div className="text-zinc-700 text-[10px] font-mono italic">No drift events detected</div>
                  )}
                  {drifts.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                      <span className="text-amber-500 font-bold">{d.diffType}</span>
                      <span className="text-zinc-400">Drift: {(Number(d.driftScore) * 100).toFixed(0)}%</span>
                      <span className="text-zinc-600 truncate max-w-[200px]">{d.explanation}</span>
                      <span className="text-zinc-700">{new Date(d.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useRunsCount(engagementId: string): number {
  const q = trpc.collection.getRuns.useQuery(
    { engagementId },
    { enabled: !!engagementId, refetchInterval: 10000 },
  );
  return q.data?.length || 0;
}
