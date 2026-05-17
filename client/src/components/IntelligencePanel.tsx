import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CorrelationGraph3D } from "@/components/CorrelationGraph3D";
import {
  Activity, Fingerprint, Shield, ChevronRight,
  AlertTriangle, Server, Database, Clock,
  GitBranch, Atom, Brain, Siren, Dices,
  Waves, Grip, Network, Gamepad2, Coins,
  Box, Hexagon, Orbit, Compass,
} from "lucide-react";

interface IntelligencePanelProps {
  engagementId: string;
}

const CORE_TABS = [
  { id: "graph", label: "GRAPH", icon: Activity },
  { id: "findingQueue", label: "FINDINGS", icon: Shield },
  { id: "exploitChains", label: "CHAINS", icon: AlertTriangle },
  { id: "timeline", label: "TEMPORAL", icon: Clock },
];

const COMP_TABS = [
  { id: "evolution", label: "EVOLVE", icon: GitBranch },
  { id: "counterfactual", label: "WHAT-IF", icon: Dices },
  { id: "entropy", label: "ENTROPY", icon: Brain },
  { id: "causal", label: "CAUSAL", icon: Atom },
  { id: "blast", label: "BLAST", icon: Siren },
  { id: "field", label: "FIELD", icon: Waves },
  { id: "resistance", label: "RESIST", icon: Grip },
  { id: "wave", label: "WAVE", icon: Network },
  { id: "game", label: "GAME", icon: Gamepad2 },
  { id: "economics", label: "ECON", icon: Coins },
  { id: "tda", label: "TDA", icon: Hexagon },
  { id: "gnn", label: "GNN", icon: Box },
  { id: "attractor", label: "ATTRACT", icon: Orbit },
  { id: "geometry", label: "METRIC", icon: Compass },
];

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

  // Computational intelligence queries
  const fieldQuery = trpc.intelligence.getFieldDensity.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "field" },
  );
  const resistanceQuery = trpc.intelligence.getResistanceMap.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "resistance" },
  );
  const waveVelocityQuery = trpc.intelligence.getPropagationVelocity.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "wave" },
  );
  const nashQuery = trpc.intelligence.getNashEquilibrium.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "game" },
  );
  const economicsQuery = trpc.intelligence.getPathEconomics.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "economics" },
  );
  const homologyQuery = trpc.intelligence.getPersistentHomology.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "tda" },
  );
  const embeddingsQuery = trpc.intelligence.getNodeEmbeddings.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "gnn" },
  );
  const attractorQuery = trpc.intelligence.getCompromiseAttractors.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "attractor" },
  );
  const curvatureQuery = trpc.intelligence.getManifoldCurvature.useQuery(
    { engagementId },
    { enabled: !!engagementId && activeSubTab === "geometry" },
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

  const isCompTab = COMP_TABS.some(t => t.id === activeSubTab);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Compact status bar */}
      <div className="h-8 shrink-0 border-b border-white/[0.04] flex items-center gap-6 px-4 text-[9px] font-mono overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Findings:</span>
          <span className="text-zinc-300 font-bold">{findings.length}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Critical:</span>
          <span className="text-red-400 font-bold">{findings.filter(f => f.severity === "critical").length}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Chains:</span>
          <span className="text-zinc-300 font-bold">{exploitChains.length}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Snapshots:</span>
          <span className="text-zinc-300 font-bold">{snapshots.length}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Drift:</span>
          <span className="text-amber-500 font-bold">{drifts.length}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Runs:</span>
          <span className="text-zinc-300 font-bold">{totalRuns}</span>
        </div>
      </div>

      {/* Core sub-tab navigation */}
      <div className="h-7 shrink-0 border-b border-white/[0.04] flex items-center px-4 gap-4 overflow-x-auto">
        {CORE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`text-[9px] font-mono font-bold uppercase tracking-[0.15em] h-full border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeSubTab === tab.id
                ? "text-indigo-400 border-indigo-500"
                : "text-zinc-700 border-transparent hover:text-zinc-400"
            }`}
          >
            <tab.icon className="w-2.5 h-2.5" />
            {tab.label}
          </button>
        ))}
        <div className="h-4 w-px bg-white/[0.06] mx-1 shrink-0" />
        {COMP_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`text-[8px] font-mono font-bold uppercase tracking-[0.15em] h-full border-b-2 transition-all flex items-center gap-1 shrink-0 ${
              activeSubTab === tab.id
                ? "text-cyan-400 border-cyan-500"
                : "text-zinc-800 border-transparent hover:text-zinc-500"
            }`}
          >
            <tab.icon className="w-2 h-2" />
            {tab.label}
          </button>
        ))}
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
                    <div className="text-zinc-300 font-bold leading-tight truncate mb-1">{f.title}</div>
                    <div className="flex items-center gap-2 text-zinc-700 text-[7px] uppercase tracking-widest">
                      <span>CWE: {f.cwe || "N/A"}</span>
                      <span>|</span>
                      <span>CONF: {f.confidence}</span>
                      <span>|</span>
                      <span className={f.validationState === "validated" ? "text-emerald-500" : f.validationState === "contradicted" ? "text-red-500" : "text-zinc-600"}>{f.validationState}</span>
                    </div>
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
                  <tr key={f.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedFinding(f.id === selectedFinding ? null : f.id)}>
                    <td className="px-3 py-2 text-zinc-700">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-3 py-2"><SeverityBadge severity={f.severity as any} /></td>
                    <td className="px-3 py-2 text-zinc-300 font-bold truncate max-w-[300px]">{f.title}</td>
                    <td className="px-3 py-2 text-right text-zinc-400">{f.confidence}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={(Number((f as any).priorityScore) || 0) > 0.7 ? "text-red-400 font-bold" : "text-zinc-500"}>
                        {(Number((f as any).priorityScore) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">{f.cwe || "—"}</td>
                    <td className="px-3 py-2 text-zinc-600">{f.sourceTool || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${f.validationState === "validated" ? "text-emerald-500" : f.validationState === "candidate" ? "text-indigo-400" : f.validationState === "contradicted" ? "text-red-500" : "text-zinc-700"}`}>
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
                <div className="text-zinc-700 text-[10px] font-mono uppercase tracking-widest p-8 text-center">No exploit chains synthesized.</div>
              )}
              {exploitChains.map((chain: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/[0.04] text-[10px] font-mono">
                  <div className="w-5 h-5 border border-zinc-700 flex items-center justify-center shrink-0 text-[8px] text-zinc-500">{String(i + 1).padStart(2, "0")}</div>
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
                <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Graph Snapshots ({snapshots.length})</h4>
                <div className="space-y-1">
                  {snapshots.length === 0 && <div className="text-zinc-700 text-[10px] font-mono italic">No snapshots captured</div>}
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
                <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Drift Events ({drifts.length})</h4>
                <div className="space-y-1">
                  {drifts.length === 0 && <div className="text-zinc-700 text-[10px] font-mono italic">No drift events detected</div>}
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

        {/* Computational tab content — unified dense display */}
        {isCompTab && (
          <div className="h-full overflow-y-auto p-4">
            <div className="text-[7px] font-mono text-cyan-800 uppercase tracking-[0.3em] mb-4">
              Computational Intelligence Module: {COMP_TABS.find(t => t.id === activeSubTab)?.label || activeSubTab.toUpperCase()}
            </div>
            {activeSubTab === "evolution" && renderEvolution(evolutionQuery)}
            {activeSubTab === "counterfactual" && renderCounterfactual(engagementId, cfScenario, setCfScenario, cfResult, setCfResult, simulateCf)}
            {activeSubTab === "entropy" && renderEntropy(entropyQuery)}
            {activeSubTab === "causal" && renderCausal(causalQuery)}
            {activeSubTab === "blast" && renderBlast(blastQuery)}
            {activeSubTab === "field" && renderFieldTheory(fieldQuery)}
            {activeSubTab === "resistance" && renderResistance(resistanceQuery)}
            {activeSubTab === "wave" && renderWavePropagation(waveVelocityQuery)}
            {activeSubTab === "game" && renderGameTheory(nashQuery)}
            {activeSubTab === "economics" && renderEconomics(economicsQuery)}
            {activeSubTab === "tda" && renderTopologicalDA(homologyQuery)}
            {activeSubTab === "gnn" && renderGNN(embeddingsQuery)}
            {activeSubTab === "attractor" && renderAttractorTheory(attractorQuery)}
            {activeSubTab === "geometry" && renderGeometry(curvatureQuery)}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Computational Module Renderers =====

function renderEvolution(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing evolution metrics...</div>;
  if (!d) return null;
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Infrastructure Evolution</h4>
        <div className="space-y-1">
          {d.infrastructure_evolution?.metrics?.map((m: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{m.entity_type || m.label}</span>
              <span className="text-indigo-400 font-bold">{m.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Surface Entropy</h4>
        <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[10px] font-mono">
          <div className="flex justify-between mb-2"><span className="text-zinc-600">Entropy:</span><span className="text-amber-400 font-bold">{(d.surface_entropy?.attack_surface_entropy || 0).toFixed(4)}</span></div>
          <div className="flex justify-between mb-2"><span className="text-zinc-600">Surface:</span><span className="text-zinc-300">{d.surface_entropy?.exposure_surface || 0}</span></div>
          <div className="flex justify-between"><span className="text-zinc-600">Trust Drift:</span><span className="text-cyan-400 font-bold">{(d.trust_drift?.drift_score || 0).toFixed(4)}</span></div>
        </div>
      </div>
      <div className="col-span-2">
        <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Credential Spread</h4>
        <div className="grid grid-cols-3 gap-2">
          {[{label:"Spread",value:d.credential_spread?.spread_score,cls:"text-amber-400"},{label:"Services",value:d.credential_spread?.affected_services,cls:"text-zinc-300"},{label:"Reuse Ratio",value:d.credential_spread?.reuse_ratio,cls:"text-red-400"}].map(s => (
            <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
              <div className="text-zinc-700 uppercase tracking-widest">{s.label}</div>
              <div className={`${s.cls} font-bold text-sm`}>{typeof s.value === 'number' ? s.value.toFixed(3) : s.value || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderCounterfactual(engagementId: string, cfScenario: string, setCfScenario: any, cfResult: any, setCfResult: any, simulateCf: any) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <select value={cfScenario} onChange={e => setCfScenario(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-zinc-300 px-2 py-1.5">
          <option value="comprehensive">Full Scenario Sweep</option>
          <option value="credential_compromise">Credential Compromise</option>
          <option value="edge_removal">Edge Removal</option>
          <option value="defense_addition">Defense Addition</option>
        </select>
        <button onClick={async () => { const r = await simulateCf.mutateAsync({engagementId, scenario: cfScenario as any}); setCfResult(r); }}
          disabled={simulateCf.isPending}
          className="text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all disabled:opacity-40">
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
              {s.paths_affected !== undefined && <div className="text-zinc-600">Paths affected: {s.paths_affected}</div>}
            </div>
          ))}
          {!cfResult.scenarios && <pre className="text-zinc-400 text-[9px] font-mono">{JSON.stringify(cfResult, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

function renderEntropy(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing entropy collapse...</div>;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[{label:"Path Entropy",val:d.path_entropy?.entropy,cls:"text-cyan-400",sub:`Max: ${(d.path_entropy?.max_entropy || 0).toFixed(2)}`},
          {label:"Privilege Inevitability",val:d.privilege_inevitability?.inevitability_score,cls:"text-red-400",sub:`Targets: ${d.privilege_inevitability?.high_value_targets || 0}`},
          {label:"Graph Ambiguity",val:d.graph_ambiguity?.normalized_ambiguity,cls:"text-amber-400",sub:`Paths: ${d.graph_ambiguity?.total_paths || 0}`}].map(s => (
          <div key={s.label} className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`${s.cls} font-bold text-lg`}>{typeof s.val === 'number' ? s.val.toFixed(4) : s.val || 0}</div>
            <div className="text-zinc-700 text-[8px] mt-1">{s.sub}</div>
          </div>
        ))}
      </div>
      {d.collapse_recommendations?.collapsible_paths?.length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Collapse Recommendations ({d.collapse_recommendations.collapsible_paths.length})</h4>
          <div className="space-y-1">
            {d.collapse_recommendations.collapsible_paths.map((p: any, i: number) => (
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
  );
}

function renderCausal(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Running causal inference...</div>;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[{label:"Paths Analyzed",val:d.total_paths_analyzed,cls:"text-zinc-300"},{label:"Root Causes",val:d.root_causes?.length,cls:"text-red-400"},{label:"Interventions",val:d.interventions?.length,cls:"text-emerald-400"}].map(s => (
          <div key={s.label} className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`${s.cls} font-bold text-lg`}>{s.val || 0}</div>
          </div>
        ))}
      </div>
      {d.root_causes?.length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Root Causes</h4>
          <div className="space-y-1">
            {d.root_causes.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                <span className="text-zinc-300">{r.name} <span className="text-zinc-700 text-[7px] uppercase">({r.type})</span></span>
                <div className="flex items-center gap-3">
                  <span className="text-indigo-400">Coverage: {(r.path_coverage * 100).toFixed(0)}%</span>
                  <span className="text-zinc-600">Freq: {r.path_frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {d.interventions?.length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Interventions</h4>
          {d.interventions.map((inv: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-400">{inv.edge}</span>
              <span className="text-emerald-500">Affects {inv.affected_paths} paths</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderBlast(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing blast radius...</div>;
  if (!d) return null;
  const nodes = d.ranked_nodes || [];
  return (
    <div>
      <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Critical Nodes — Blast Radius Ranking</h4>
      <table className="w-full text-[9px] font-mono border-collapse">
        <thead>
          <tr className="border-b border-white/[0.04] text-zinc-700 uppercase tracking-widest text-[8px]">
            <th className="text-left px-2 py-2 font-medium">#</th>
            <th className="text-left px-2 py-2 font-medium">Node</th>
            <th className="text-left px-2 py-2 font-medium">Type</th>
            <th className="text-right px-2 py-2 font-medium">Blast</th>
            <th className="text-right px-2 py-2 font-medium">Down</th>
            <th className="text-right px-2 py-2 font-medium">Cred</th>
            <th className="text-right px-2 py-2 font-medium">Priv</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((n: any, i: number) => (
            <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
              <td className="px-2 py-2 text-zinc-700">{i + 1}</td>
              <td className="px-2 py-2 text-zinc-300 font-bold">{n.node?.name || n.node?.id}</td>
              <td className="px-2 py-2 text-zinc-600">{n.node?.type || "—"}</td>
              <td className={`px-2 py-2 text-right font-bold ${n.blast_score > 0.7 ? "text-red-400" : n.blast_score > 0.4 ? "text-amber-400" : "text-zinc-400"}`}>
                {(n.blast_score * 100).toFixed(1)}%
              </td>
              <td className="px-2 py-2 text-right text-zinc-400">{n.downstream_count}</td>
              <td className="px-2 py-2 text-right text-zinc-400">{n.credential_cascade_count}</td>
              <td className="px-2 py-2 text-right text-zinc-400">{n.privilege_chains}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {nodes.length === 0 && <div className="text-zinc-700 text-[10px] font-mono text-center py-8">No blast radius data</div>}
    </div>
  );
}

function renderFieldTheory(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing field density...</div>;
  if (!d) return null;
  const wells = d.gravity_wells || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[{label:"Max Pressure",val:d.field_statistics?.max,cls:"text-amber-400"},{label:"Mean Pressure",val:d.field_statistics?.mean,cls:"text-zinc-300"},{label:"Std Dev",val:d.field_statistics?.std,cls:"text-zinc-500"},{label:"Gravity Wells",val:d.gravity_well_count,cls:"text-red-400"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{typeof s.val === 'number' ? s.val.toFixed(4) : s.val || 0}</div>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Gravity Wells (High-Pressure Zones)</h4>
        {wells.map((w: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
            <span className="text-zinc-300">{w.name} <span className="text-zinc-700 text-[7px]">({w.entity_type})</span></span>
            <span className="text-amber-400">Φ = {w.field_pressure.toFixed(4)}</span>
          </div>
        ))}
        {wells.length === 0 && <div className="text-zinc-700 text-[10px] font-mono">No gravity wells detected</div>}
      </div>
      <div>
        <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Field Parameters</h4>
        <div className="flex gap-4 text-[8px] font-mono text-zinc-700">
          <span>α={d.parameters?.alpha}</span>
          <span>β={d.parameters?.beta}</span>
          <span>damping={d.parameters?.damping}</span>
          <span>threshold={d.parameters?.pressure_threshold}</span>
        </div>
      </div>
    </div>
  );
}

function renderResistance(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing resistance map...</div>;
  if (!d) return null;
  const stats = d.statistics || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[{label:"Mean Resistance",val:stats.mean_resistance,cls:"text-amber-400"},{label:"Min Resistance",val:stats.min_resistance,cls:"text-emerald-400"},{label:"Max Resistance",val:stats.max_resistance,cls:"text-red-400"},{label:"Total Edges",val:stats.total_edges,cls:"text-zinc-300"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{typeof s.val === 'number' ? s.val.toFixed(4) : s.val || 0}</div>
          </div>
        ))}
      </div>
      {d.low_resistance_corridors?.length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Low-Resistance Corridors (Stealth Routes)</h4>
          {d.low_resistance_corridors.slice(0, 10).map((e: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{e.source} → {e.target}</span>
              <span className="text-emerald-400">R = {e.resistance.toFixed(3)}</span>
              <span className="text-zinc-700">{e.rel_type}</span>
            </div>
          ))}
        </div>
      )}
      {d.high_resistance_barriers?.length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">High-Resistance Barriers</h4>
          {d.high_resistance_barriers.slice(0, 10).map((e: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{e.source} → {e.target}</span>
              <span className="text-red-400">R = {e.resistance.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderWavePropagation(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing wave propagation...</div>;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[{label:"Velocity",val:d.average_velocity,cls:"text-cyan-400"},{label:"Avg Infection",val:d.average_velocity ? `${(d.source_velocities || []).reduce((a: number, v: any) => a + v.infection_percentage, 0) / Math.max((d.source_velocities || []).length, 1)}%` : "—",cls:"text-amber-400"},
          {label:"Fastest",val:d.fastest_propagation?.source,cls:"text-red-400"},{label:"Slowest",val:d.slowest_propagation?.source,cls:"text-emerald-400"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px] mb-1">{s.label}</div>
            <div className={`${s.cls} font-bold truncate`}>{s.val !== undefined && s.val !== null ? typeof s.val === 'number' ? s.val.toFixed(4) : s.val : "—"}</div>
          </div>
        ))}
      </div>
      {(d.source_velocities || []).length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Source-Specific Velocities</h4>
          {d.source_velocities.map((v: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{v.source}</span>
              <span className="text-zinc-400">Vel: {v.velocity.toFixed(4)}</span>
              <span className="text-zinc-500">Infected: {v.infection_percentage}%</span>
              <span className="text-zinc-600">Contain: {v.containment.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderGameTheory(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing Nash equilibrium...</div>;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Attacker Strategy (Mixed Nash)</h4>
          {(d.attacker_strategy || []).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{s.node} <span className="text-zinc-700">({s.type})</span></span>
              <span className="text-red-400">P = {(s.probability * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Defender Strategy (Mixed Nash)</h4>
          {(d.defender_strategy || []).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{s.node} <span className="text-zinc-700">({s.type})</span></span>
              <span className="text-emerald-400">P = {(s.probability * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
        <span className="text-zinc-700 uppercase tracking-widest">Game Value: </span>
        <span className="text-cyan-400 font-bold">{(d.game_value || 0).toFixed(4)}</span>
      </div>
    </div>
  );
}

function renderEconomics(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing attack economics...</div>;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[{label:"Paths Analyzed",val:d.total_paths_analyzed,cls:"text-zinc-300"},{label:"Max Utility",val:d.economics_statistics?.max_utility,cls:"text-amber-400"},{label:"Mean Utility",val:d.economics_statistics?.mean_utility,cls:"text-zinc-400"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{typeof s.val === 'number' ? s.val.toFixed(4) : s.val || 0}</div>
          </div>
        ))}
      </div>
      {(d.top_paths || []).length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Top Paths by Utility</h4>
          <table className="w-full text-[9px] font-mono border-collapse">
            <thead><tr className="border-b border-white/[0.04] text-zinc-700 text-[7px] uppercase tracking-widest">
              <th className="text-left px-2 py-1 font-medium">Path</th>
              <th className="text-right px-2 py-1 font-medium">Utility</th>
              <th className="text-right px-2 py-1 font-medium">ROI</th>
              <th className="text-right px-2 py-1 font-medium">Stealth</th>
              <th className="text-right px-2 py-1 font-medium">Cost</th>
            </tr></thead>
            <tbody>
              {d.top_paths.map((p: any, i: number) => (
                <tr key={i} className="border-b border-white/[0.02]">
                  <td className="px-2 py-1.5 text-zinc-300 truncate max-w-[200px]">{p.title}</td>
                  <td className="px-2 py-1.5 text-right text-amber-400 font-bold">{p.utility.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right text-cyan-400">{p.roi.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right text-emerald-400">{p.stealth_rating.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right text-zinc-500">{p.total_operational_cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderTopologicalDA(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing persistent homology...</div>;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[{label:"H0 Components",val:d.h0_features?.initial_components,cls:"text-zinc-300"},{label:"H1 Cycles",val:d.h1_features?.total_cycles,cls:"text-cyan-400"},{label:"Final Components",val:d.h0_features?.final_components,cls:"text-amber-400"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{s.val || 0}</div>
          </div>
        ))}
      </div>
      {d.h1_features?.cycles?.length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Cycles (1-Homology)</h4>
          {d.h1_features.cycles.map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-400">Cycle of {c.cycle_length} nodes</span>
              <span className="text-cyan-400">Birth: {c.birth.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      {d.h1_features?.total_cycles === 0 && <div className="text-zinc-700 text-[10px] font-mono italic">No topological cycles detected — graph is tree-like</div>}
    </div>
  );
}

function renderGNN(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing graph embeddings...</div>;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[{label:"Nodes Embedded",val:d.total_nodes_embedded,cls:"text-zinc-300"},{label:"Embedding Dim.",val:d.embedding_dimension,cls:"text-cyan-400"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{s.val || 0}</div>
          </div>
        ))}
      </div>
      {(d.high_similarity_pairs || []).length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">High-Similarity Node Pairs</h4>
          {d.high_similarity_pairs.slice(0, 15).map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{p.node_a} <span className="text-zinc-700">({p.node_a_type})</span> ↔ {p.node_b} <span className="text-zinc-700">({p.node_b_type})</span></span>
              <span className="text-amber-400">sim = {p.similarity.toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderAttractorTheory(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing attractors...</div>;
  if (!d) return null;
  const attrs = d.attractors || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[{label:"Total Attractors",val:d.total_attractors,cls:"text-red-400"},{label:"Total Nodes",val:d.total_nodes,cls:"text-zinc-300"},{label:"Concentration",val:d.attractor_concentration,cls:"text-amber-400"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{typeof s.val === 'number' ? s.val.toFixed(4) : s.val || 0}</div>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Compromise Attractors</h4>
        {attrs.map((a: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
            <span className="text-zinc-300">{a.name} <span className="text-zinc-700">({a.type})</span></span>
            <div className="flex items-center gap-3">
              <span className="text-red-400 font-bold">A = {a.attractor_strength.toFixed(4)}</span>
              <span className="text-zinc-700">trust={a.trust_inflow.toFixed(2)} priv={a.privilege_density.toFixed(2)} cent={a.centrality.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {attrs.length === 0 && <div className="text-zinc-700 text-[10px] font-mono">No attractors detected</div>}
      </div>
    </div>
  );
}

function renderGeometry(q: any) {
  const d = q.data;
  if (q.isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing curvature...</div>;
  if (!d) return null;
  const highCurve = d.high_curvature_regions || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[{label:"Mean Curvature",val:d.curvature_statistics?.mean,cls:"text-cyan-400"},{label:"Max Curvature",val:d.curvature_statistics?.max,cls:"text-red-400"},{label:"Nodes",val:d.curvature_statistics?.total_nodes,cls:"text-zinc-300"}].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{typeof s.val === 'number' ? s.val.toFixed(4) : s.val || 0}</div>
          </div>
        ))}
      </div>
      {highCurve.length > 0 && (
        <div>
          <h4 className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">High-Curvature Regions (Boundary Zones)</h4>
          {highCurve.map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{c.name} <span className="text-zinc-700">({c.type})</span></span>
              <span className="text-amber-400">κ = {c.curvature.toFixed(4)}</span>
              <span className="text-zinc-700">neighbors: {c.neighbor_count}</span>
            </div>
          ))}
        </div>
      )}
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
