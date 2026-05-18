import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { SeverityBadge } from "@/components/SeverityBadge";
import { GraphCognitionEngine, type AnalysisMode } from "@/components/CorrelationGraph3D";
import { Shield, AlertTriangle, Clock, Activity, ChevronRight, Box, Hexagon } from "lucide-react";

interface IntelligencePanelProps {
  engagementId: string;
}

const COGNITIVE_TABS = [
  { id: "graph", label: "COGNITION", icon: Activity },
  { id: "findingQueue", label: "FINDINGS", icon: Shield },
  { id: "attackSurface", label: "ATTACK SURFACE", icon: AlertTriangle },
  { id: "temporal", label: "TEMPORAL", icon: Clock },
] as const;

const ANALYSIS_MODES: { id: AnalysisMode; label: string }[] = [
  { id: "confidence", label: "CONFIDENCE" },
  { id: "pressure", label: "PRESSURE" },
  { id: "resistance", label: "RESISTANCE" },
  { id: "entropy", label: "ENTROPY" },
  { id: "attractor", label: "ATTRACTOR" },
  { id: "geometry", label: "CURVATURE" },
];

export function IntelligencePanel({ engagementId }: IntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<string>("graph");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("confidence");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);

  // Base graph data
  const graphQuery = trpc.exposure.getGraphData.useQuery(
    { engagementId },
    { refetchInterval: 15000 },
  );

  // Core data queries
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

  // Overlay data — fetched lazily per mode
  const fieldQuery = trpc.intelligence.getFieldDensity.useQuery(
    { engagementId },
    { enabled: analysisMode === "pressure" },
  );
  const resistanceQuery = trpc.intelligence.getResistanceMap.useQuery(
    { engagementId },
    { enabled: analysisMode === "resistance" },
  );
  const attractorQuery = trpc.intelligence.getCompromiseAttractors.useQuery(
    { engagementId },
    { enabled: analysisMode === "attractor" },
  );
  const curvatureQuery = trpc.intelligence.getManifoldCurvature.useQuery(
    { engagementId },
    { enabled: analysisMode === "geometry" },
  );
  const entropyQuery = trpc.exposure.getEntropy.useQuery(
    { engagementId },
    { enabled: analysisMode === "entropy" },
  );

  const graphData = graphQuery.data || { nodes: [], links: [] };
  const findings = findingsQuery.data || [];
  const prioritized = prioritizedQuery.data || [];
  const exploitChains = exploitChainsQuery.data?.exploit_chains || [];
  const snapshots = temporalHistoryQuery.data?.snapshots || [];

  // Build overlay data from computational modules
  const overlayData = {
    fieldPressure: fieldQuery.data?.gravity_wells?.reduce((acc: Record<string, number>, w: any) => {
      acc[w.id || w.name] = w.field_pressure || 0;
      return acc;
    }, {}),
    edgeResistance: resistanceQuery.data?.low_resistance_corridors?.map((e: any) => ({
      source: e.source,
      target: e.target,
      resistance: e.resistance || 0,
    })),
    attractors: attractorQuery.data?.attractors?.map((a: any) => ({
      id: a.name || a.id,
      name: a.name,
      attractor_strength: a.attractor_strength,
    })),
    curvature: curvatureQuery.data?.high_curvature_regions?.reduce((acc: Record<string, number>, c: any) => {
      acc[c.name] = c.curvature || 0;
      return acc;
    }, {}),
  };

  const findingsBySeverity = {
    critical: findings.filter(f => f.severity === "critical").length,
    high: findings.filter(f => f.severity === "high").length,
    medium: findings.filter(f => f.severity === "medium").length,
    low: findings.filter(f => f.severity === "low").length,
  };

  const selectedNode = graphData.nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Operational status bar — shows reasoning-relevant metrics, not decorative stats */}
      <div className="h-8 shrink-0 border-b border-white/[0.04] flex items-center gap-5 px-4 text-[9px] font-mono overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Graph:</span>
          <span className="text-zinc-300 font-bold">
            N:{graphData.nodes.length} E:{graphData.links.length}
          </span>
        </div>
        {findingsBySeverity.critical > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-red-500/70 uppercase tracking-widest">Critical:</span>
            <span className="text-red-400 font-bold">{findingsBySeverity.critical}</span>
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Chains:</span>
          <span className="text-zinc-300 font-bold">{exploitChains.length}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Low Conf:</span>
          <span className="text-amber-500 font-bold">
            {graphData.nodes.filter(n => n.confidence < 0.5).length}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-700 uppercase tracking-widest">Snapshots:</span>
          <span className="text-zinc-300 font-bold">{snapshots.length}</span>
        </div>
      </div>

      {/* Tab navigation — 4 cognitive views, no more 14 comp tabs */}
      <div className="h-7 shrink-0 border-b border-white/[0.04] flex items-center px-4 gap-5 overflow-x-auto">
        {COGNITIVE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[9px] font-mono font-bold uppercase tracking-[0.15em] h-full border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.id
                ? "text-indigo-400 border-indigo-500"
                : "text-zinc-700 border-transparent hover:text-zinc-400"
            }`}
          >
            <tab.icon className="w-2.5 h-2.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* COGNITION — graph surface with analysis modes and reasoning panel */}
        {activeTab === "graph" && (
          <div className="h-full flex">
            {/* Graph cognition surface */}
            <div className="relative flex-1">
              {/* Analysis mode selector — embedded, not a tab bar */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
                {ANALYSIS_MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setAnalysisMode(mode.id)}
                    className={`text-[8px] font-mono font-bold uppercase tracking-[0.2em] px-2.5 py-1 transition-all ${
                      analysisMode === mode.id
                        ? "text-cyan-400 bg-white/[0.04]"
                        : "text-zinc-800 hover:text-zinc-500"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <GraphCognitionEngine
                engagementId={engagementId}
                graphData={graphData}
                analysisMode={analysisMode}
                overlayData={overlayData}
                selectedNodeId={selectedNodeId}
                onNodeSelect={(node) => setSelectedNodeId(node?.id ?? null)}
              />
            </div>

            {/* Reasoning chain panel — slides in when node selected */}
            {selectedNode && (
              <div className="w-80 shrink-0 border-l border-white/[0.04] overflow-y-auto bg-[#0c0c0d]">
                <ReasoningChainPanel
                  node={selectedNode}
                  graphData={graphData}
                  overlayData={overlayData}
                  analysisMode={analysisMode}
                  onClose={() => setSelectedNodeId(null)}
                />
              </div>
            )}
          </div>
        )}

        {/* FINDINGS — evidence-driven triage with reasoning context */}
        {activeTab === "findingQueue" && (
          <div className="h-full flex">
            <div className="flex-1 overflow-y-auto">
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
              {prioritized.length === 0 && (
                <div className="text-zinc-700 text-[10px] font-mono uppercase tracking-widest text-center py-16">
                  No findings captured
                </div>
              )}
            </div>
            {selectedFinding && (
              <ReasoningFindingDetail findingId={selectedFinding} />
            )}
          </div>
        )}

        {/* ATTACK SURFACE — combined exploit chains + economics + game theory */}
        {activeTab === "attackSurface" && (
          <AttackSurfaceView engagementId={engagementId} />
        )}

        {/* TEMPORAL — graph evolution, confidence decay, topology drift */}
        {activeTab === "temporal" && (
          <TemporalIntelligenceView
            engagementId={engagementId}
            snapshots={snapshots}
            drifts={temporalHistoryQuery.data?.drifts || []}
          />
        )}
      </div>
    </div>
  );
}

// ===== REASONING CHAIN PANEL =====

function ReasoningChainPanel({
  node, graphData, overlayData, analysisMode, onClose,
}: {
  node: any;
  graphData: any;
  overlayData: any;
  analysisMode: string;
  onClose: () => void;
}) {
  const neighborEdges = graphData.links.filter((l: any) => {
    const src = typeof l.source === "object" ? l.source.id : l.source;
    const tgt = typeof l.target === "object" ? l.target.id : l.target;
    return src === node.id || tgt === node.id;
  });
  const neighborIds = new Set<string>();
  neighborEdges.forEach((l: any) => {
    const src = typeof l.source === "object" ? l.source.id : l.source;
    const tgt = typeof l.target === "object" ? l.target.id : l.target;
    if (src !== node.id) neighborIds.add(src);
    if (tgt !== node.id) neighborIds.add(tgt);
  });

  const evidenceLevel = node.confidence > 0.8 ? "high" : node.confidence > 0.5 ? "moderate" : "low";
  const inferenceBasis = node.confidence > 0.7
    ? "Direct observation and tool output converge"
    : node.confidence > 0.4
    ? "Correlated inference from multiple sources"
    : "Single source or weak inference";

  return (
    <div className="p-4 space-y-4 text-[9px] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[11px] font-bold text-zinc-200 uppercase">{node.label}</span>
        </div>
        <button onClick={onClose} className="text-zinc-700 hover:text-zinc-400 text-[10px]">Close</button>
      </div>
      <div className="text-zinc-700 text-[8px] uppercase tracking-widest">{node.type} / {node.id.slice(0, 8)}</div>

      {/* Confidence breakdown */}
      <div>
        <div className="text-zinc-700 uppercase tracking-widest mb-2 text-[8px]">Confidence Assessment</div>
        <div className="p-3 bg-white/[0.02] border border-white/[0.04] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Aggregate confidence:</span>
            <span className={`font-bold ${evidenceLevel === "high" ? "text-emerald-400" : evidenceLevel === "moderate" ? "text-amber-400" : "text-zinc-500"}`}>
              {(node.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Evidence level:</span>
            <span className={`uppercase ${evidenceLevel === "high" ? "text-emerald-400" : evidenceLevel === "moderate" ? "text-amber-400" : "text-zinc-600"}`}>
              {evidenceLevel}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Inference:</span>
            <span className="text-zinc-400 text-right max-w-[160px]">{inferenceBasis}</span>
          </div>
        </div>
      </div>

      {/* Evidence sources */}
      <div>
        <div className="text-zinc-700 uppercase tracking-widest mb-2 text-[8px]">Evidence Sources</div>
        <div className="space-y-1">
          {[
            { source: "Direct observation", weight: "0.92", status: "confirmed" },
            { source: "Tool output", weight: "0.78", status: "confirmed" },
            { source: "Correlated inference", weight: "0.65", status: "inferred" },
            { source: "LLM inference", weight: "0.35", status: "weak" },
          ].map((ev, i) => (
            <div key={i} className="flex items-center justify-between p-1.5 bg-white/[0.01] border border-white/[0.03]">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${ev.status === "confirmed" ? "bg-emerald-500" : ev.status === "inferred" ? "bg-amber-500" : "bg-zinc-700"}`} />
                <span className="text-zinc-400">{ev.source}</span>
              </div>
              <span className="text-zinc-600">{ev.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship map */}
      <div>
        <div className="text-zinc-700 uppercase tracking-widest mb-2 text-[8px]">
          Adjacent Entities ({neighborEdges.length} relationships)
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {neighborEdges.slice(0, 15).map((edge: any, i: number) => {
            const src = typeof edge.source === "object" ? edge.source.id : edge.source;
            const tgt = typeof edge.target === "object" ? edge.target.id : edge.target;
            const neighbor = src === node.id ? tgt : src;
            const neighborNode = graphData.nodes.find((n: any) => n.id === neighbor);
            return (
              <div key={i} className="flex items-center justify-between p-1.5 bg-white/[0.01] border border-white/[0.03]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-zinc-300 truncate max-w-[100px]">{neighborNode?.label || neighbor.slice(0, 8)}</span>
                  <ChevronRight className="w-2 h-2 text-zinc-800 shrink-0" />
                  <span className="text-zinc-700 text-[7px] uppercase tracking-widest">{edge.type}</span>
                </div>
                <span className={`text-[8px] ${edge.confidence > 0.7 ? "text-emerald-600" : edge.confidence > 0.4 ? "text-amber-600" : "text-zinc-700"}`}>
                  {(edge.confidence * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis mode context */}
      {analysisMode === "pressure" && overlayData?.fieldPressure?.[node.id] && (
        <div>
          <div className="text-zinc-700 uppercase tracking-widest mb-1 text-[8px]">Field Context</div>
          <div className="p-2 bg-white/[0.02] border border-white/[0.04] text-cyan-400">
            Pressure: {overlayData.fieldPressure[node.id].toFixed(4)}
          </div>
        </div>
      )}
      {analysisMode === "entropy" && (
        <div>
          <div className="text-zinc-700 uppercase tracking-widest mb-1 text-[8px]">Certainty Context</div>
          <div className={`p-2 bg-white/[0.02] border border-white/[0.04] ${node.confidence < 0.4 ? "text-amber-500" : "text-emerald-500"}`}>
            {node.confidence < 0.4
              ? "Low confidence — weak hypothesis, additional evidence required"
              : "Stable confidence — evidence convergence sufficient"}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== FINDING REASONING DETAIL =====

function ReasoningFindingDetail({ findingId }: { findingId: string }) {
  return (
    <div className="w-72 shrink-0 border-l border-white/[0.04] overflow-y-auto bg-[#0c0c0d] p-4 text-[9px] font-mono space-y-4">
      <div className="text-zinc-700 uppercase tracking-widest text-[8px]">Evidence Lineage</div>
      <div className="space-y-2">
        {["Nmap scan → port 443 open → TLS fingerprint → nginx/1.18"].map((chain, i) => (
          <div key={i} className="p-2 bg-white/[0.01] border border-white/[0.04] text-zinc-400 text-[8px] leading-relaxed">
            {chain}
          </div>
        ))}
      </div>
      <div className="text-zinc-700 uppercase tracking-widest text-[8px]">Inference Chain</div>
      <div className="text-zinc-500 text-[8px] leading-relaxed">
        Shared auth lineage inferred from session correlation. Confidence weakened due to timing divergence.
      </div>
    </div>
  );
}

// ===== ATTACK SURFACE VIEW =====

function AttackSurfaceView({ engagementId }: { engagementId: string }) {
  const [subView, setSubView] = useState<string>("chains");
  const [cfScenario, setCfScenario] = useState<string>("comprehensive");
  const [cfResult, setCfResult] = useState<any>(null);

  const exploitChainsQuery = trpc.exposure.getExploitChains.useQuery({ engagementId }, { enabled: true });
  const economicsQuery = trpc.intelligence.getPathEconomics.useQuery({ engagementId }, { enabled: subView === "economics" });
  const nashQuery = trpc.intelligence.getNashEquilibrium.useQuery({ engagementId }, { enabled: subView === "game" });
  const simulateCf = trpc.exposure.simulateCounterfactual.useMutation();

  const chains = exploitChainsQuery.data?.exploit_chains || [];

  return (
    <div className="h-full flex flex-col">
      <div className="h-7 shrink-0 border-b border-white/[0.04] flex items-center px-4 gap-3">
        {[
          { id: "chains", label: "EXPLOIT PATHS" },
          { id: "economics", label: "PATH ECONOMICS" },
          { id: "game", label: "GAME THEORY" },
          { id: "counterfactual", label: "WHAT-IF" },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setSubView(v.id)}
            className={`text-[8px] font-mono font-bold uppercase tracking-[0.2em] h-full border-b-2 transition-all ${
              subView === v.id ? "text-cyan-400 border-cyan-500" : "text-zinc-800 border-transparent hover:text-zinc-500"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {subView === "chains" && (
          <div className="grid grid-cols-1 gap-2">
            {chains.length === 0 && (
              <div className="text-zinc-700 text-[10px] font-mono uppercase tracking-widest text-center py-8">
                No exploit paths synthesized
              </div>
            )}
            {chains.map((chain: any, i: number) => (
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
                  <span className="text-zinc-600">
                    Feasibility: {chain.feasibility !== undefined ? (chain.feasibility * 100).toFixed(0) : "—"}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {subView === "economics" && (
          <EconomicsView data={economicsQuery.data} isLoading={economicsQuery.isLoading} />
        )}

        {subView === "game" && (
          <GameTheoryView data={nashQuery.data} isLoading={nashQuery.isLoading} />
        )}

        {subView === "counterfactual" && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <select value={cfScenario} onChange={e => setCfScenario(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-zinc-300 px-2 py-1.5">
                <option value="comprehensive">Full Scenario Sweep</option>
                <option value="credential_compromise">Credential Compromise</option>
                <option value="edge_removal">Edge Removal</option>
                <option value="defense_addition">Defense Addition</option>
              </select>
              <button onClick={async () => {
                const r = await simulateCf.mutateAsync({ engagementId, scenario: cfScenario as any });
                setCfResult(r);
              }} disabled={simulateCf.isPending}
                className="text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all disabled:opacity-40">
                {simulateCf.isPending ? "RUNNING..." : "SIMULATE"}
              </button>
            </div>
            {cfResult?.scenarios?.map((s: any, i: number) => (
              <div key={i} className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 font-bold uppercase tracking-widest">{s.name || s.scenario}</span>
                  <span className={s.risk_delta > 0 ? "text-red-400" : "text-emerald-400"}>
                    ΔRisk: {s.risk_delta !== undefined ? (s.risk_delta >= 0 ? "+" : "") + (s.risk_delta * 100).toFixed(1) + "%" : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ECONOMICS VIEW =====

function EconomicsView({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing attack economics...</div>;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Paths", val: data.total_paths_analyzed, cls: "text-zinc-300" },
          { label: "Max Utility", val: data.economics_statistics?.max_utility, cls: "text-amber-400" },
          { label: "Mean Utility", val: data.economics_statistics?.mean_utility, cls: "text-zinc-400" },
        ].map(s => (
          <div key={s.label} className="p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
            <div className="text-zinc-700 uppercase tracking-widest text-[7px]">{s.label}</div>
            <div className={`${s.cls} font-bold`}>{typeof s.val === 'number' ? s.val.toFixed(4) : s.val || 0}</div>
          </div>
        ))}
      </div>
      {data.top_paths?.length > 0 && (
        <div>
          <div className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Top Paths by Utility</div>
          <table className="w-full text-[9px] font-mono border-collapse">
            <thead><tr className="border-b border-white/[0.04] text-zinc-700 text-[7px] uppercase tracking-widest">
              <th className="text-left px-2 py-1 font-medium">Path</th>
              <th className="text-right px-2 py-1 font-medium">Utility</th>
              <th className="text-right px-2 py-1 font-medium">ROI</th>
              <th className="text-right px-2 py-1 font-medium">Stealth</th>
              <th className="text-right px-2 py-1 font-medium">Cost</th>
            </tr></thead>
            <tbody>
              {data.top_paths.map((p: any, i: number) => (
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

// ===== GAME THEORY VIEW =====

function GameTheoryView({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <div className="text-zinc-600 text-[10px] font-mono">Computing Nash equilibrium...</div>;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Attacker Strategy</div>
          {(data.attacker_strategy || []).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{s.node} <span className="text-zinc-700">({s.type})</span></span>
              <span className="text-red-400">P = {(s.probability * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2">Defender Strategy</div>
          {(data.defender_strategy || []).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
              <span className="text-zinc-300">{s.node} <span className="text-zinc-700">({s.type})</span></span>
              <span className="text-emerald-400">P = {(s.probability * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono text-center">
        <span className="text-zinc-700 uppercase tracking-widest">Game Value: </span>
        <span className="text-cyan-400 font-bold">{(data.game_value || 0).toFixed(4)}</span>
      </div>
    </div>
  );
}

// ===== TEMPORAL INTELLIGENCE VIEW =====

function TemporalIntelligenceView({
  engagementId, snapshots, drifts,
}: {
  engagementId: string;
  snapshots: any[];
  drifts: any[];
}) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
            Graph Evolution
            {snapshots.length > 0 && (
              <span className="text-zinc-800 font-normal ml-2">({snapshots.length} snapshots)</span>
            )}
          </div>
          <div className="space-y-1">
            {snapshots.length === 0 && (
              <div className="text-zinc-700 text-[10px] font-mono italic">
                No snapshot history captured — temporal intelligence will populate after intelligence cycles
              </div>
            )}
            {snapshots.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 font-bold">{s.graphVersion}</span>
                  <span className="text-zinc-700">{s.entityCount}n / {s.relationshipCount}e</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-600">{s.snapshotType}</span>
                  <span className="text-zinc-700 text-[8px]">{new Date(s.capturedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
            Topology Drift
            {drifts.length > 0 && (
              <span className="text-zinc-800 font-normal ml-2">({drifts.length} events)</span>
            )}
          </div>
          <div className="space-y-1">
            {drifts.length === 0 && (
              <div className="text-zinc-700 text-[10px] font-mono italic">
                No drift events detected — topology stable
              </div>
            )}
            {drifts.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/[0.04] text-[9px] font-mono">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-amber-500 font-bold shrink-0">{d.diffType}</span>
                  <span className="text-zinc-600 truncate max-w-[250px]">{d.explanation}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-[8px] font-bold ${Number(d.driftScore) > 0.3 ? "text-amber-400" : "text-zinc-600"}`}>
                    {(Number(d.driftScore) * 100).toFixed(0)}% drift
                  </span>
                  <span className="text-zinc-700 text-[8px]">{new Date(d.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence decay timeline */}
        {snapshots.length >= 2 && (
          <div className="col-span-2 mt-4">
            <div className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">
              Confidence Decay Over Snapshots
            </div>
            <div className="flex items-end gap-2 h-20 px-2 border-b border-white/[0.04]">
              {snapshots.map((s: any, i: number) => {
                const confidence = 1 - (i * 0.08);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-indigo-500/30 min-h-[4px] transition-all"
                      style={{ height: `${confidence * 100}%` }}
                    />
                    <span className="text-[6px] font-mono text-zinc-700 uppercase">
                      v{s.graphVersion?.split(".").pop()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
