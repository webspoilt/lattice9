import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CorrelationGraph3D } from "@/components/CorrelationGraph3D";
import {
  Activity, Fingerprint, Shield, ChevronRight,
  AlertTriangle, Server, Database, Clock,
  GitBranch, Atom, Brain, Siren, Dices,
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

  const evolutionQuery = trpc.exposure.getEvolution.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "evolution" },
  );

  const entropyQuery = trpc.exposure.getEntropy.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "entropy" },
  );

  const causalQuery = trpc.exposure.getCausalAnalysis.useQuery(
    { engagementId, mode: "root_cause" },
    { enabled: !!engagementId && activeSubTab === "causal" },
  );

  const blastQuery = trpc.exposure.getBlastRadius.useQuery(
    { engagementId, mode: "all" },
    { enabled: !!engagementId && activeSubTab === "blast" },
  );

  const [cfScenario, setCfScenario] = useState<string>("comprehensive");
  const [cfResult, setCfResult] = useState<any>(null);
  const simulateCf = trpc.exposure.simulateCounterfactual.useMutation();

  const totalRuns = useRunsCount(engagementId);

  const findings = findingsQuery.data || [];
  const prioritized = prioritizedQuery.data || [];
  const exploitChains = exploitChainsQuery.data?.exploit_chains || [];
  const snapshots = temporalHistoryQuery.data?.snapshots || [];
  const drifts = temporalHistoryQuery.data?.drifts || [];
  const evolution = evolutionQuery.data || null;
  const entropy = entropyQuery.data || null;
  const causal = causalQuery.data || null;
  const blast = blastQuery.data || null;

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
          { id: "evolution", label: "EVOLUTION", icon: GitBranch },
          { id: "counterfactual", label: "COUNTERFACTUAL", icon: Dices },
          { id: "entropy", label: "ENTROPY", icon: Brain },
          { id: "causal", label: "CAUSAL", icon: Atom },
          { id: "blast", label: "BLAST", icon: Siren },
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

          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* GRAPH VIEW */}
        {activeSubTab === "graph" && (
          <div className="h-full flex">
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

            <div className="flex-1 relative">
              <CorrelationGraph3D engagementId={engagementId} />
            </div>
          </div>
        )}

        {/* FINDING QUEUE */}
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
                      <span className="text-zinc-600">{s.entityCount}n / {s.relationshipCount}e</span>
                      <span className="text-zinc-700">{new Date(s.capturedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
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

        {/* EVOLUTION — Temporal Graph Memory */}
        {activeSubTab === "evolution" && (
          <div className="h-full overflow-y-auto p-4">
            {evolutionQuery.isLoading && <div className="text-zinc-600 text-[10px] font-mono">Loading evolution metrics...</div>}
            {evolution && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
                    Infrastructure Evolution
                  </h4>
                  <div className="space-y-1">
                    {evolution.infrastructure_evolution?.metrics?.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                        <span className="text-zinc-300">{m.entity_type || m.label}</span>
                        <span className="text-indigo-400 font-bold">{m.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
                    Surface Entropy
                  </h4>
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[10px] font-mono">
                    <div className="flex justify-between mb-2">
                      <span className="text-zinc-600">Attack Surface Entropy:</span>
                      <span className="text-amber-400 font-bold">{(evolution.surface_entropy?.attack_surface_entropy || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-zinc-600">Exposure Surface:</span>
                      <span className="text-zinc-300">{evolution.surface_entropy?.exposure_surface || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Trust Drift:</span>
                      <span className="text-cyan-400 font-bold">{(evolution.trust_drift?.drift_score || 0).toFixed(4)}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
                    Credential Spread
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                      <div className="text-zinc-700 uppercase tracking-widest">Spread Score</div>
                      <div className="text-amber-400 font-bold text-sm">{(evolution.credential_spread?.spread_score || 0).toFixed(3)}</div>
                    </div>
                    <div className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                      <div className="text-zinc-700 uppercase tracking-widest">Affected Services</div>
                      <div className="text-zinc-300 font-bold text-sm">{evolution.credential_spread?.affected_services || 0}</div>
                    </div>
                    <div className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                      <div className="text-zinc-700 uppercase tracking-widest">Reuse Ratio</div>
                      <div className="text-red-400 font-bold text-sm">{(evolution.credential_spread?.reuse_ratio || 0).toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COUNTERFACTUAL — What-If Simulation */}
        {activeSubTab === "counterfactual" && (
          <div className="h-full overflow-y-auto p-4">
            <div className="flex items-center gap-4 mb-4">
              <select
                value={cfScenario}
                onChange={e => setCfScenario(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-zinc-300 px-2 py-1.5"
              >
                <option value="comprehensive">Full Scenario Sweep</option>
                <option value="credential_compromise">Credential Compromise</option>
                <option value="edge_removal">Edge Removal</option>
                <option value="defense_addition">Defense Addition</option>
              </select>
              <button
                onClick={async () => {
                  const result = await simulateCf.mutateAsync({
                    engagementId,
                    scenario: cfScenario as any,
                  });
                  setCfResult(result);
                }}
                disabled={simulateCf.isPending}
                className="text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all disabled:opacity-40"
              >
                {simulateCf.isPending ? "SIMULATING..." : "RUN SIMULATION"}
              </button>
            </div>
            {cfResult && (
              <div className="grid grid-cols-1 gap-2">
                {cfResult.scenarios?.map((s: any, i: number) => (
                  <div key={i} className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-400 font-bold uppercase tracking-widest">{s.name || s.scenario}</span>
                      <span className={s.risk_delta > 0 ? "text-red-400" : "text-emerald-400"}>
                        ΔRisk: {s.risk_delta !== undefined ? (s.risk_delta >= 0 ? "+" : "") + (s.risk_delta * 100).toFixed(1) + "%" : "—"}
                      </span>
                    </div>
                    {s.paths_affected !== undefined && (
                      <div className="text-zinc-600">Paths affected: {s.paths_affected}</div>
                    )}
                    {s.description && <div className="text-zinc-700 mt-1">{s.description}</div>}
                  </div>
                ))}
                {!cfResult.scenarios && (
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                    <pre className="text-zinc-400 whitespace-pre-wrap">{JSON.stringify(cfResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ENTROPY — Attack Path Entropy Collapse */}
        {activeSubTab === "entropy" && (
          <div className="h-full overflow-y-auto p-4">
            {entropyQuery.isLoading && <div className="text-zinc-600 text-[10px] font-mono">Computing entropy collapse...</div>}
            {entropy && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                    <div className="text-zinc-700 uppercase tracking-widest mb-1">Path Entropy</div>
                    <div className="text-cyan-400 font-bold text-lg">{(entropy.path_entropy?.entropy || 0).toFixed(4)}</div>
                    <div className="text-zinc-700 text-[8px] mt-1">Max: {(entropy.path_entropy?.max_entropy || 0).toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                    <div className="text-zinc-700 uppercase tracking-widest mb-1">Privilege Inevitability</div>
                    <div className="text-red-400 font-bold text-lg">{(entropy.privilege_inevitability?.inevitability_score || 0).toFixed(3)}</div>
                    <div className="text-zinc-700 text-[8px] mt-1">Targets: {entropy.privilege_inevitability?.high_value_targets || 0}</div>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                    <div className="text-zinc-700 uppercase tracking-widest mb-1">Graph Ambiguity</div>
                    <div className="text-amber-400 font-bold text-lg">{(entropy.graph_ambiguity?.normalized_ambiguity || 0).toFixed(4)}</div>
                    <div className="text-zinc-700 text-[8px] mt-1">Paths: {entropy.graph_ambiguity?.total_paths || 0}</div>
                  </div>
                </div>
                {entropy.collapse_recommendations?.collapsible_paths?.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">
                      Collapse Recommendations ({entropy.collapse_recommendations.collapsible_paths.length})
                    </h4>
                    <div className="space-y-1">
                      {entropy.collapse_recommendations.collapsible_paths.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                          <span className="text-zinc-400">{p.path_id}</span>
                          <span className="text-zinc-600">Entropy: {p.entropy.toFixed(3)}</span>
                          <span className="text-amber-500">{p.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CAUSAL — Causal Inference Engine */}
        {activeSubTab === "causal" && (
          <div className="h-full overflow-y-auto p-4">
            {causalQuery.isLoading && <div className="text-zinc-600 text-[10px] font-mono">Running causal inference...</div>}
            {causal && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                    <div className="text-zinc-700 uppercase tracking-widest mb-1">Paths Analyzed</div>
                    <div className="text-zinc-300 font-bold text-lg">{causal.total_paths_analyzed || 0}</div>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                    <div className="text-zinc-700 uppercase tracking-widest mb-1">Root Causes</div>
                    <div className="text-red-400 font-bold text-lg">{causal.root_causes?.length || 0}</div>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
                    <div className="text-zinc-700 uppercase tracking-widest mb-1">Interventions</div>
                    <div className="text-emerald-400 font-bold text-lg">{causal.interventions?.length || 0}</div>
                  </div>
                </div>
                {causal.root_causes?.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">
                      Root Causes
                    </h4>
                    <div className="space-y-1">
                      {causal.root_causes.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-700">{i + 1}.</span>
                            <span className="text-zinc-300">{r.name}</span>
                            <span className="text-zinc-700 text-[7px] uppercase">({r.type})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-indigo-400">Coverage: {(r.path_coverage * 100).toFixed(0)}%</span>
                            <span className="text-zinc-600">Freq: {r.path_frequency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {causal.interventions?.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">
                      Highest-Impact Interventions
                    </h4>
                    <div className="space-y-1">
                      {causal.interventions.map((inv: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                          <span className="text-zinc-400">{inv.edge}</span>
                          <span className="text-emerald-500">Affects {inv.affected_paths} paths</span>
                          <span className="text-zinc-600">Impact: {(inv.impact_score * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BLAST — Topological Blast Radius v2 */}
        {activeSubTab === "blast" && (
          <div className="h-full overflow-y-auto p-4">
            {blastQuery.isLoading && <div className="text-zinc-600 text-[10px] font-mono">Computing blast radius...</div>}
            {blast && (
              <div className="space-y-4">
                <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
                  Critical Nodes — Blast Radius Ranking
                </h4>
                <table className="w-full text-[9px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-zinc-700 uppercase tracking-widest text-[8px]">
                      <th className="text-left px-2 py-2 font-medium">Rank</th>
                      <th className="text-left px-2 py-2 font-medium">Node</th>
                      <th className="text-left px-2 py-2 font-medium">Type</th>
                      <th className="text-right px-2 py-2 font-medium">Blast Score</th>
                      <th className="text-right px-2 py-2 font-medium">Downstream</th>
                      <th className="text-right px-2 py-2 font-medium">Cred Cascade</th>
                      <th className="text-right px-2 py-2 font-medium">Priv Chains</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(blast.ranked_nodes || []).map((n: any, i: number) => (
                      <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                        <td className="px-2 py-2 text-zinc-700">{i + 1}</td>
                        <td className="px-2 py-2 text-zinc-300 font-bold">{n.node?.name || n.node?.id}</td>
                        <td className="px-2 py-2 text-zinc-600">{n.node?.type || "—"}</td>
                        <td className="px-2 py-2 text-right">
                          <span className={`font-bold ${n.blast_score > 0.7 ? "text-red-400" : n.blast_score > 0.4 ? "text-amber-400" : "text-zinc-400"}`}>
                            {(n.blast_score * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right text-zinc-400">{n.downstream_count}</td>
                        <td className="px-2 py-2 text-right text-zinc-400">{n.credential_cascade_count}</td>
                        <td className="px-2 py-2 text-right text-zinc-400">{n.privilege_chains}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!blast.ranked_nodes || blast.ranked_nodes.length === 0) && (
                  <div className="text-zinc-700 text-[10px] font-mono text-center py-8">
                    No blast radius data available
                  </div>
                )}
              </div>
            )}
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
