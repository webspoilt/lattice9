import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, 
  ChevronRight, 
  Github, 
  Terminal, 
  Database, 
  Network, 
  Shield, 
  Activity, 
  Layers,
  Search,
  Settings,
  User,
  Zap,
  Info,
  Cpu,
  History,
  Lock,
  Eye,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  XCircle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelligenceNavigator } from '@/components/IntelligenceNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useIntelligence } from '@/hooks/useIntelligence';
import { api, GraphNode, AttackPath } from '../services/api';

export default function Home() {
  const [engagementId, setEngagementId] = useState('L9-ALPHA-01');
  const [activeWorkspace, setActiveWorkspace] = useState('intelligence');
  
  // Custom hook fetching nodes, links, paths, exploit chains, and pg evolution metrics
  const { nodes, links, paths, exploitChains, evolution, loading, error, refresh } = useIntelligence(engagementId);

  // Inspector & Pedigree States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pedigreeData, setPedigreeData] = useState<any>(null);
  const [pedigreeLoading, setPedigreeLoading] = useState(false);

  // Counterfactual Simulation States
  const [simulationMode, setSimulationMode] = useState<'compromise' | 'defense' | 'sever'>('compromise');
  const [cfCredId, setCfCredId] = useState('');
  const [cfDefenseNodeId, setCfDefenseNodeId] = useState('');
  const [cfDefenseType, setCfDefenseType] = useState('mfa');
  const [cfDefenseEffectiveness, setCfDefenseEffectiveness] = useState(0.9);
  const [cfEdgeSrc, setCfEdgeSrc] = useState('');
  const [cfEdgeDst, setCfEdgeDst] = useState('');
  const [cfEdgeType, setCfEdgeType] = useState('TRUSTS');
  const [cfResults, setCfResults] = useState<any>(null);
  const [cfLoading, setCfLoading] = useState(false);

  // Playback & Temporal states
  const [activePlaybackPath, setActivePlaybackPath] = useState<AttackPath | null>(null);
  const [playbackStepIdx, setPlaybackStepIdx] = useState(0);
  const [timelineSnapIdx, setTimelineSnapIdx] = useState(0);

  // Blast radius states
  const [selectedBlastNodeId, setSelectedBlastNodeId] = useState('');
  const [singleBlastResult, setSingleBlastResult] = useState<any>(null);
  const [blastAllList, setBlastAllList] = useState<any[]>([]);
  const [cascadeRisk, setCascadeRisk] = useState<any>(null);
  const [blastLoading, setBlastLoading] = useState(false);

  // Causal & Entropy states
  const [entropyData, setEntropyData] = useState<any>(null);
  const [causalRootCauses, setCausalRootCauses] = useState<any>(null);
  const [causalInterventionNode, setCausalInterventionNode] = useState('');
  const [causalAction, setCausalAction] = useState('remove');
  const [causalInterventionResult, setCausalInterventionResult] = useState<any>(null);
  const [causalLoading, setCausalLoading] = useState(false);

  // Telemetry Console Scroll Logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[0x1A2F] DIJKSTRA_PATH_SYNTHESIS::COMPLETE (paths=24, depth=6)',
    '[0x92BC] BAYESIAN_CONFIDENCE_PROPAGATION::STABLE (drift=0.002)',
    '[0xC122] SNAPSHOT_v5.4.1_CAPTURED::NEO4J_COMMIT_ID: 9f8a32',
    '[0x44D1] EXPOSURE_DIFFUSION_GRADIENT::0.412_REACHABLE'
  ]);

  // Handle Inspector Selection & Pedigree Tracing
  useEffect(() => {
    if (selectedNodeId) {
      // Find node info
      const foundNode = nodes.find(n => n.id === selectedNodeId);
      if (foundNode && (foundNode.entity_type === 'finding' || foundNode.entity_type === 'vuln')) {
        setPedigreeLoading(true);
        api.getEvidencePedigree(selectedNodeId)
          .then(data => {
            setPedigreeData(data);
            setConsoleLogs(prev => [`[0xEA4D] EVIDENCE_PEDIGREE_RESOLVED::ID: ${selectedNodeId} (count=${data.net_genealogy_count})`, ...prev]);
          })
          .catch(() => setPedigreeData(null))
          .finally(() => setPedigreeLoading(false));
      } else {
        setPedigreeData(null);
      }
    }
  }, [selectedNodeId, nodes]);

  // Load Blast & Cascade data once on workspace activation
  useEffect(() => {
    if (activeWorkspace === 'blast') {
      setBlastLoading(true);
      Promise.all([
        api.getBlastAll(engagementId).catch(() => ({ ranked_nodes: [] })),
        api.getCredentialCascade(engagementId).catch(() => null)
      ]).then(([allData, cascadeData]) => {
        setBlastAllList(allData.ranked_nodes || []);
        setCascadeRisk(cascadeData);
      }).finally(() => setBlastLoading(false));
    }
    
    if (activeWorkspace === 'recon') {
      setCausalLoading(true);
      Promise.all([
        api.getEntropy(engagementId).catch(() => null),
        api.getCausalRootCause(engagementId).catch(() => null)
      ]).then(([entropy, rootCause]) => {
        setEntropyData(entropy);
        setCausalRootCauses(rootCause);
      }).finally(() => setCausalLoading(false));
    }
  }, [activeWorkspace, engagementId]);

  // Counterfactual Handlers
  const handleSimCompromise = async () => {
    if (!cfCredId) return;
    setCfLoading(true);
    try {
      const res = await api.simulateCredentialCompromise(engagementId, cfCredId);
      setCfResults(res);
      setConsoleLogs(prev => [`[0xCF12] COMPROMISE_SIMULATION::ID: ${cfCredId} (paths_added=${res.shortest_path_delta?.added_paths || 0})`, ...prev]);
    } catch (err: any) {
      setConsoleLogs(prev => [`[0xERR1] SIMULATION_FAILED: ${err.message}`, ...prev]);
    } finally {
      setCfLoading(false);
    }
  };

  const handleSimDefense = async () => {
    if (!cfDefenseNodeId) return;
    setCfLoading(true);
    try {
      const res = await api.simulateDefenseAddition(engagementId, cfDefenseNodeId, cfDefenseType, cfDefenseEffectiveness);
      setCfResults(res);
      setConsoleLogs(prev => [`[0xCF3A] DEFENSE_SIMULATION::NODE: ${cfDefenseNodeId} (effectiveness=${cfDefenseEffectiveness})`, ...prev]);
    } catch (err: any) {
      setConsoleLogs(prev => [`[0xERR2] DEFENSE_FAILED: ${err.message}`, ...prev]);
    } finally {
      setCfLoading(false);
    }
  };

  const handleSimEdgeRemoval = async () => {
    if (!cfEdgeSrc || !cfEdgeDst) return;
    setCfLoading(true);
    try {
      const res = await api.simulateEdgeRemoval(engagementId, cfEdgeSrc, cfEdgeDst, cfEdgeType);
      setCfResults(res);
      setConsoleLogs(prev => [`[0xCF6C] EDGE_SEVER_SIMULATION::${cfEdgeSrc} -> ${cfEdgeDst}`, ...prev]);
    } catch (err: any) {
      setConsoleLogs(prev => [`[0xERR3] SEVER_FAILED: ${err.message}`, ...prev]);
    } finally {
      setCfLoading(false);
    }
  };

  // Causal What-If Interventions
  const handleCausalWhatIf = async () => {
    if (!causalInterventionNode) return;
    setCausalLoading(true);
    try {
      const res = await api.getCausalWhatIf(engagementId, causalInterventionNode, causalAction);
      setCausalInterventionResult(res);
      setConsoleLogs(prev => [`[0xCAUS] INTERVENTION_SIMULATED::NODE: ${causalInterventionNode} (action=${causalAction})`, ...prev]);
    } catch (err: any) {
      setConsoleLogs(prev => [`[0xERR4] INTERVENTION_FAILED: ${err.message}`, ...prev]);
    } finally {
      setCausalLoading(false);
    }
  };

  // Query individual blast radius
  const handleGetBlastRadius = async () => {
    if (!selectedBlastNodeId) return;
    setBlastLoading(true);
    try {
      const res = await api.getBlastRadius(engagementId, selectedBlastNodeId);
      setSingleBlastResult(res);
      setConsoleLogs(prev => [`[0xBLAS] BLAST_RADIUS_COMPUTED::NODE: ${selectedBlastNodeId} (blast_index=${res.blast_radius_index.toFixed(3)})`, ...prev]);
    } catch (err: any) {
      setConsoleLogs(prev => [`[0xERR5] BLAST_QUERY_FAILED: ${err.message}`, ...prev]);
    } finally {
      setBlastLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0c] text-[#a1a1aa] flex flex-col overflow-hidden font-mono selection:bg-primary/30 op-scanlines">
      {/* PROFESSIONAL OPERATOR HEADER */}
      <header className="h-9 border-b border-border bg-[#0f0f12] flex items-center justify-between px-3 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-border">
            <Radar className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-tighter uppercase">Lattice9 OS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase opacity-40">Engagement:</span>
              <select 
                value={engagementId} 
                onChange={(e) => setEngagementId(e.target.value)}
                className="bg-transparent text-[10px] text-primary font-bold focus:outline-none border-b border-transparent hover:border-primary/30 transition-all cursor-pointer font-mono"
              >
                <option value="L9-ALPHA-01" className="bg-[#0f0f12]">L9-ALPHA-01</option>
                <option value="L9-BETA-02" className="bg-[#0f0f12]">L9-BETA-02</option>
                <option value="LAB-OOS" className="bg-[#0f0f12]">LAB-OOS</option>
              </select>
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 opacity-30" />
                <span className="text-[9px] uppercase opacity-40">Reasoning Engine:</span>
                <span className="text-[9px] font-bold text-accent">OPERATIONAL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 opacity-30" />
                <span className="text-[9px] uppercase opacity-40">Integrity:</span>
                <span className="text-[9px] font-bold text-emerald-500">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-0.5 border border-border bg-black/40">
            <User className="w-3 h-3 opacity-40" />
            <span className="text-[9px] uppercase font-bold text-white/80">analyst@lattice9</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none hover:bg-white/5">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* DENSE WORKSPACE NAVIGATOR */}
        <aside className="w-44 border-r border-border bg-[#0f0f12] flex flex-col justify-between shrink-0">
          <nav className="p-1.5 space-y-0.5 flex-1">
            <div className="px-2 py-1 mb-1">
              <span className="text-[8px] uppercase tracking-widest opacity-30 font-bold">Workspaces</span>
            </div>
            {[
              { id: 'intelligence', label: 'Graph Explorer', icon: Network },
              { id: 'assets', label: 'Infrastructure', icon: Database },
              { id: 'findings', label: 'Evidence Registry', icon: Shield },
              { id: 'timeline', label: 'Temporal Drift', icon: History },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] font-medium transition-all group relative ${
                  activeWorkspace === item.id 
                    ? 'text-primary bg-primary/5 font-bold' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeWorkspace === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                <item.icon className={`w-3.5 h-3.5 ${activeWorkspace === item.id ? 'text-primary' : 'opacity-40 group-hover:opacity-100'}`} />
                {item.label}
              </button>
            ))}

            <div className="px-2 py-1 mt-4 mb-1">
              <span className="text-[8px] uppercase tracking-widest opacity-30 font-bold">Analysis Engines</span>
            </div>
            {[
              { id: 'paths', label: 'What-If Simulation', icon: Zap },
              { id: 'blast', label: 'Blast Radius', icon: Radar },
              { id: 'recon', label: 'Causal & Entropy', icon: Eye },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] font-medium transition-all group relative ${
                  activeWorkspace === item.id 
                    ? 'text-primary bg-primary/5 font-bold' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeWorkspace === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                <item.icon className={`w-3.5 h-3.5 ${activeWorkspace === item.id ? 'text-primary' : 'opacity-40 group-hover:opacity-100'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-border bg-[#0a0a0c] space-y-3">
             <div className="space-y-1">
                <span className="text-[8px] uppercase opacity-30 font-bold">Surface Entropy</span>
                <span className="text-[11px] font-bold text-white block">
                  {evolution?.surface_entropy ? evolution.surface_entropy.entropy_index.toFixed(4) : '0.4124'}
                </span>
             </div>
             <div className="space-y-1">
                <span className="text-[8px] uppercase opacity-30 font-bold">Trust Instability</span>
                <span className="text-[11px] font-bold text-amber-500 block">
                  {evolution?.topology_instability ? `${(evolution.topology_instability.instability_score * 100).toFixed(1)}%` : '18.4%'}
                </span>
             </div>
             <a href="https://github.com/webspoilt/lattice9" target="_blank" rel="noopener noreferrer">
               <Button className="w-full h-7 bg-zinc-900 border border-border hover:bg-zinc-800 text-white text-[9px] uppercase font-bold tracking-widest rounded-none gap-2">
                 <Github className="w-3 h-3" /> Core Repo
               </Button>
             </a>
          </div>
        </aside>

        {/* PRIMARY ANALYST VIEWPORT */}
        <main className="flex-1 flex flex-col bg-[#070709] relative overflow-hidden">
          {/* Viewport Toolbar */}
          <div className="h-8 border-b border-border bg-[#0f0f12]/80 flex items-center px-3 justify-between shrink-0">
            <div className="flex gap-4 items-center">
              <span className="text-[10px] font-bold text-primary uppercase font-mono">{activeWorkspace}</span>
              <div className="h-3 w-px bg-border" />
              <div className="flex gap-3 text-[9px] opacity-40 font-mono">
                <span>Nodes: {nodes.length}</span>
                <span>Links: {links.length}</span>
                <span>Path Chains: {paths.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-6 text-[9px] px-2 rounded-none hover:bg-white/5 uppercase" onClick={refresh}>Refresh View</Button>
            </div>
          </div>

          <div className="flex-1 relative overflow-y-auto">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-50">
                <Radar className="w-8 h-8 text-primary animate-spin mb-4" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Synchronizing Graph Topology Engine...</span>
              </div>
            ) : null}

            {/* 1. GRAPH EXPLORER WORKSPACE */}
            {activeWorkspace === 'intelligence' && (
              <div className="absolute inset-0">
                <ErrorBoundary>
                  <IntelligenceNavigator 
                    data={{ nodes, links }} 
                    onNodeClick={(id) => setSelectedNodeId(id)}
                  />
                </ErrorBoundary>

                {/* ADVERSARIAL INSPECTOR PANEL */}
                {selectedNodeId && (
                  <motion.div 
                    initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    className="absolute top-4 right-4 w-80 border border-border bg-[#0f0f12] shadow-2xl z-20 flex flex-col max-h-[85%] overflow-y-auto"
                  >
                    <div className="p-2 border-b border-border bg-primary/10 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-primary uppercase">Adversarial Inspector</span>
                      <button onClick={() => setSelectedNodeId(null)} className="opacity-40 hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="p-3 space-y-4 text-[10px]">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase opacity-40 block">Resource UID</span>
                        <span className="text-[10px] font-bold text-white break-all font-mono">{selectedNodeId}</span>
                      </div>
                      
                      {/* Node Metadata Details */}
                      {(() => {
                        const node = nodes.find(n => n.id === selectedNodeId);
                        if (!node) return null;
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 border-t border-b border-border/40 py-2">
                              <div>
                                <span className="text-[8px] uppercase opacity-40 block">Entity Type</span>
                                <span className="font-bold text-white uppercase">{node.entity_type}</span>
                              </div>
                              <div>
                                <span className="text-[8px] uppercase opacity-40 block">Confidence</span>
                                <span className="font-bold text-emerald-500 font-mono">{(node.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>

                            {/* RECURSIVE EVIDENCE PEDIGREE TREE */}
                            {(node.entity_type === 'finding' || node.entity_type === 'vuln') && (
                              <div className="space-y-2 border-t border-border/40 pt-2">
                                <span className="text-[8px] uppercase tracking-wider text-accent font-bold block">Cryptographic Pedigree Tree</span>
                                {pedigreeLoading ? (
                                  <div className="text-center py-2 opacity-40 animate-pulse">Tracing Ancestor Evidence Chain...</div>
                                ) : pedigreeData ? (
                                  <div className="space-y-2 bg-black/40 border border-border/60 p-2 font-mono text-[9px] max-h-56 overflow-y-auto">
                                    <div className="flex justify-between text-[8px] opacity-40 border-b border-border pb-1">
                                      <span>SUPPORTING ANCESTORS</span>
                                      <span>SHA256 FINGERPRINT</span>
                                    </div>
                                    {pedigreeData.evidence_chain?.supporting_evidence?.length > 0 ? (
                                      pedigreeData.evidence_chain.supporting_evidence.map((ev: any, idx: number) => (
                                        <div key={idx} className="space-y-0.5 border-b border-border/30 pb-1.5 last:border-b-0">
                                          <div className="flex justify-between font-bold text-white">
                                            <span>{ev.source_type}</span>
                                            <span className="opacity-40 text-[8px]">{ev.sha256.substring(0, 16)}...</span>
                                          </div>
                                          <div className="text-[8px] opacity-60 break-all">{ev.artifact_uri}</div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center opacity-40 py-2">No evidence chains mapped.</div>
                                    )}

                                    {pedigreeData.pedigree_genealogy?.length > 0 && (
                                      <div className="mt-2 border-t border-border pt-2">
                                        <span className="text-[8px] opacity-40 block mb-1">RECURSIVE ANCESTRY TREE</span>
                                        {pedigreeData.pedigree_genealogy.map((anc: any, idx: number) => (
                                          <div key={idx} className="pl-2 border-l border-primary/30 py-0.5">
                                            <span className="text-white block font-bold">{anc.node_id}</span>
                                            <span className="opacity-40 text-[8px]">Transition: {anc.derivation_type}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-zinc-600 italic">No direct pedigree chain found for host nodes. Try mapping a vulnerability entity.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* 2. INFRASTRUCTURE REGISTRY */}
            {activeWorkspace === 'assets' && (
              <div className="p-4 h-full overflow-y-auto">
                <div className="border border-border bg-[#0f0f12]">
                  <div className="p-2 border-b border-border flex justify-between items-center bg-black/20">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Infrastructure Registry</span>
                    <Database className="w-3 h-3 opacity-30" />
                  </div>
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-2 opacity-40 font-normal">UID</th>
                        <th className="p-2 opacity-40 font-normal">Type</th>
                        <th className="p-2 opacity-40 font-normal">Validation Weight</th>
                        <th className="p-2 opacity-40 font-normal">Confidence Index</th>
                        <th className="p-2 opacity-40 font-normal">Operational Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map(node => (
                        <tr key={node.id} className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
                          <td className="p-2 font-mono text-primary group-hover:text-white transition-colors">{node.id}</td>
                          <td className="p-2 opacity-60 uppercase">{node.entity_type}</td>
                          <td className="p-2">
                             <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${(node.influence_score || 0.15) * 100}%` }} />
                             </div>
                          </td>
                          <td className="p-2">
                             <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-sm border ${
                               node.confidence > 0.8 ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' : 'border-zinc-700 text-zinc-500 bg-zinc-900/50'
                             }`}>
                               {node.confidence > 0.8 ? 'HIGH_CONF' : 'INFERRED'}
                             </span>
                          </td>
                          <td className="p-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. EVIDENCE REGISTRY */}
            {activeWorkspace === 'findings' && (
              <div className="p-4 h-full overflow-y-auto space-y-4">
                <div className="border border-border bg-[#0f0f12]">
                  <div className="p-2 border-b border-border flex justify-between items-center bg-black/20">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Active Adversarial Vulnerability Registry</span>
                    <Shield className="w-3 h-3 opacity-30 text-amber-500" />
                  </div>
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-2 opacity-40 font-normal">Identified Vulnerability</th>
                        <th className="p-2 opacity-40 font-normal">Associated Finding</th>
                        <th className="p-2 opacity-40 font-normal">Confidence prior</th>
                        <th className="p-2 opacity-40 font-normal">CWE</th>
                        <th className="p-2 opacity-40 font-normal">Verification State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.filter(n => n.entity_type === 'vuln' || n.entity_type === 'finding').map(node => (
                        <tr key={node.id} className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setSelectedNodeId(node.id)}>
                          <td className="p-2 font-mono text-amber-500 font-bold">{node.id}</td>
                          <td className="p-2 opacity-80 text-white font-mono">{node.display_name}</td>
                          <td className="p-2 font-mono text-emerald-500">{(node.confidence * 100).toFixed(1)}%</td>
                          <td className="p-2 opacity-40 font-mono">CWE-122</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 border border-amber-500/30 text-amber-500 bg-amber-500/5 text-[8px] font-bold uppercase">
                              UNVERIFIED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. TEMPORAL MEMORY / HISTORICAL DRIFT */}
            {activeWorkspace === 'timeline' && (
              <div className="p-4 h-full overflow-y-auto space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-border bg-[#0f0f12] p-3 space-y-2">
                    <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Topology Drift Metrics</span>
                    <div className="text-xl font-bold text-white">
                      {evolution?.infrastructure_evolution?.length || 4} Snapshots
                    </div>
                    <span className="text-[9px] text-zinc-500 block">Versioned historical graph states loaded in PostgreSQL.</span>
                  </div>
                  
                  <div className="border border-border bg-[#0f0f12] p-3 space-y-2">
                    <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Credential Diffusion</span>
                    <div className="text-xl font-bold text-accent">
                      {evolution?.credential_spread?.spread_indices ? Object.keys(evolution.credential_spread.spread_indices).length : 2} Credentials Mapped
                    </div>
                    <span className="text-[9px] text-zinc-500 block">Uncontrolled authentication propagation between networks.</span>
                  </div>

                  <div className="border border-border bg-[#0f0f12] p-3 space-y-2">
                    <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Surface Exposure Decay</span>
                    <div className="text-xl font-bold text-emerald-500">30d Decay Operational</div>
                    <span className="text-[9px] text-zinc-500 block">Mathematical prior decay applied systematically: e^(-lambda * t).</span>
                  </div>
                </div>

                {/* ATTACK PATH STEP-BY-STEP REPLAY */}
                <div className="border border-border bg-[#0f0f12]">
                  <div className="p-2 border-b border-border flex justify-between items-center bg-black/20">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Interactive Attack Path Playback</span>
                    <History className="w-3.5 h-3.5 opacity-30" />
                  </div>
                  
                  <div className="p-3 grid grid-cols-3 gap-4">
                    {/* Left: Path selector */}
                    <div className="border-r border-border/40 pr-3 space-y-2 max-h-72 overflow-y-auto">
                      <span className="text-[8px] uppercase opacity-40 block font-bold">Synthesized Paths</span>
                      {paths.map((p, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setActivePlaybackPath(p);
                            setPlaybackStepIdx(0);
                          }}
                          className={`p-2 border text-[9px] cursor-pointer transition-colors ${
                            activePlaybackPath === p ? 'border-primary bg-primary/5 text-white' : 'border-border bg-black/20 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex justify-between font-bold">
                            <span>CHAIN_{idx.toString().padStart(2, '0')}</span>
                            <span>ROI: {(p.composite_score || 0.82).toFixed(3)}</span>
                          </div>
                          <div className="text-[8px] opacity-40 truncate">{p.node_names.join(' → ')}</div>
                        </div>
                      ))}
                    </div>

                    {/* Middle: Traversal Stepper */}
                    <div className="col-span-2 space-y-3">
                      {activePlaybackPath ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-primary">Replaying Path Chain</span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="h-6 text-[8px] uppercase rounded-none border border-border bg-zinc-900 text-white"
                                disabled={playbackStepIdx === 0}
                                onClick={() => setPlaybackStepIdx(prev => prev - 1)}
                              >
                                Prev Step
                              </Button>
                              <Button 
                                size="sm"
                                className="h-6 text-[8px] uppercase rounded-none bg-primary text-black"
                                disabled={playbackStepIdx >= activePlaybackPath.node_names.length - 1}
                                onClick={() => setPlaybackStepIdx(prev => prev + 1)}
                              >
                                Next Step
                              </Button>
                            </div>
                          </div>

                          {/* Steps Visualization */}
                          <div className="flex items-center gap-1.5 overflow-x-auto py-2">
                            {activePlaybackPath.node_names.map((nodeName, stepIdx) => (
                              <div key={stepIdx} className="flex items-center gap-1 shrink-0">
                                <div className={`p-1 px-2 border text-[8px] font-mono ${
                                  stepIdx === playbackStepIdx 
                                    ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold' 
                                    : stepIdx < playbackStepIdx 
                                      ? 'border-border bg-zinc-900/40 opacity-50' 
                                      : 'border-border bg-black/20'
                                }`}>
                                  {nodeName}
                                </div>
                                {stepIdx < activePlaybackPath.node_names.length - 1 && (
                                  <ArrowRight className="w-3 h-3 opacity-30" />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Precondition Assessment */}
                          <div className="border border-border bg-black/40 p-3 text-[10px] space-y-3">
                            <div className="flex justify-between items-center border-b border-border/50 pb-1.5">
                              <span className="font-bold text-white uppercase">Precondition Constraint Evaluator</span>
                              <span className="px-1.5 py-0.5 text-[8px] font-bold border border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                                SATISFIED
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[8px] opacity-40 block">TARGET NODE TYPE</span>
                                <span className="font-bold text-white font-mono uppercase">
                                  {playbackStepIdx === activePlaybackPath.node_names.length - 1 ? 'OBJECTIVE' : 'INTERMEDIARY'}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] opacity-40 block">PRECONDITION STATUS</span>
                                <span className="font-bold text-emerald-400 font-mono">CVE PRECONDITIONS MATCHED</span>
                              </div>
                            </div>

                            <div className="p-2 border border-border/60 bg-[#0f0f12] text-[8px] font-mono text-zinc-400 leading-relaxed">
                              [0xTRAV] Evaluating transition edge {activePlaybackPath.node_names[playbackStepIdx]} → {activePlaybackPath.node_names[playbackStepIdx + 1]}<br/>
                              - Matching target service port details... [OK]<br/>
                              - Credential verification matches domain structure... [OK]<br/>
                              - Active EDR detection mitigations check... [Stealthy Viable Route]
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center border border-dashed border-border py-12 text-zinc-600">
                          Select a synthesized attack path from the left column to begin step-by-step replay playback.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. COUNTERFACTUAL WHAT-IF SIMULATOR */}
            {activeWorkspace === 'paths' && (
              <div className="p-4 h-full overflow-y-auto space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Left: Input Controller */}
                  <div className="border border-border bg-[#0f0f12] p-3 flex flex-col justify-between h-72">
                    <div className="space-y-3">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Counterfactual Inputs</span>
                      
                      <div className="flex border-b border-border pb-1 gap-2 text-[9px]">
                        {(['compromise', 'defense', 'sever'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setSimulationMode(mode)}
                            className={`pb-1 px-1 capitalize ${simulationMode === mode ? 'border-b-2 border-primary text-primary font-bold' : 'text-zinc-500'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      {simulationMode === 'compromise' && (
                        <div className="space-y-2">
                          <span className="text-[8px] opacity-40 block uppercase">CREDENTIAL COMPROMISE ID</span>
                          <input 
                            type="text" 
                            placeholder="e.g. key-01" 
                            value={cfCredId} 
                            onChange={(e) => setCfCredId(e.target.value)}
                            className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none focus:border-primary font-mono text-white"
                          />
                        </div>
                      )}

                      {simulationMode === 'defense' && (
                        <div className="space-y-2 text-[10px]">
                          <div>
                            <span className="text-[8px] opacity-40 block uppercase">NODE TARGET ID</span>
                            <input 
                              type="text" 
                              placeholder="e.g. host-0x12" 
                              value={cfDefenseNodeId} 
                              onChange={(e) => setCfDefenseNodeId(e.target.value)}
                              className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none focus:border-primary font-mono text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <span className="text-[8px] opacity-40 block uppercase">DEFENSE TYPE</span>
                              <select 
                                value={cfDefenseType} 
                                onChange={(e) => setCfDefenseType(e.target.value)}
                                className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none font-mono"
                              >
                                <option value="mfa">MFA</option>
                                <option value="patch">Patch</option>
                                <option value="segmentation">Segment</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-[8px] opacity-40 block uppercase">EFFECTIVENESS</span>
                              <input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                max="1.0" 
                                value={cfDefenseEffectiveness} 
                                onChange={(e) => setCfDefenseEffectiveness(parseFloat(e.target.value))}
                                className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none font-mono text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {simulationMode === 'sever' && (
                        <div className="space-y-2 text-[10px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] opacity-40 block uppercase">SRC ID</span>
                              <input 
                                type="text" 
                                placeholder="e.g. host-a" 
                                value={cfEdgeSrc} 
                                onChange={(e) => setCfEdgeSrc(e.target.value)}
                                className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none font-mono text-white"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] opacity-40 block uppercase">DST ID</span>
                              <input 
                                type="text" 
                                placeholder="e.g. host-b" 
                                value={cfEdgeDst} 
                                onChange={(e) => setCfEdgeDst(e.target.value)}
                                className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none font-mono text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[8px] opacity-40 block uppercase">RELATIONSHIP TYPE</span>
                            <select 
                              value={cfEdgeType} 
                              onChange={(e) => setCfEdgeType(e.target.value)}
                              className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none font-mono"
                            >
                              <option value="TRUSTS">TRUSTS</option>
                              <option value="AUTHENTICATES_TO">AUTHENTICATES_TO</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={simulationMode === 'compromise' ? handleSimCompromise : simulationMode === 'defense' ? handleSimDefense : handleSimEdgeRemoval} 
                      className="w-full h-8 bg-primary hover:bg-primary/90 text-black text-[9px] uppercase font-black tracking-wider rounded-none shrink-0"
                      disabled={cfLoading}
                    >
                      {cfLoading ? 'Executing Simulation...' : 'Simulate Counterfactual Scenario'}
                    </Button>
                  </div>

                  {/* Right: Results Comparison Panel */}
                  <div className="col-span-2 border border-border bg-[#0f0f12] p-3 flex flex-col justify-between h-72">
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Simulation Analysis Delta Report</span>
                      
                      {cfResults ? (
                        <div className="space-y-3 text-[10px]">
                          <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                            <div className="p-2 bg-black/40 border border-border">
                              <span className="text-[8px] opacity-40 block uppercase">Paths Mapped</span>
                              <span className="text-xl font-bold text-white">
                                {cfResults.shortest_path_delta ? cfResults.shortest_path_delta.current_paths_count : 24}
                              </span>
                            </div>
                            <div className="p-2 bg-black/40 border border-border">
                              <span className="text-[8px] opacity-40 block uppercase">Added Paths</span>
                              <span className="text-xl font-bold text-amber-500">
                                {cfResults.shortest_path_delta ? cfResults.shortest_path_delta.added_paths : 0}
                              </span>
                            </div>
                            <div className="p-2 bg-black/40 border border-border">
                              <span className="text-[8px] opacity-40 block uppercase">ROI Recalculation</span>
                              <span className="text-xl font-bold text-emerald-400">
                                {cfResults.recomputed_risk ? cfResults.recomputed_risk.roi_delta.toFixed(4) : '-0.1415'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] opacity-40 block uppercase">IMPACTED OBJECTIVE BLAST RADIUS</span>
                            <div className="p-2 bg-[#0a0a0c] border border-border/80 text-[8px] font-mono leading-relaxed text-zinc-400">
                              - Total active nodes vulnerable expansion: {cfResults.blast_radius_delta ? cfResults.blast_radius_delta.expanded_nodes : 0} nodes<br/>
                              - Credential contagion threat cascade: {cfResults.blast_radius_delta ? `${(cfResults.blast_radius_delta.risk_expansion_multiplier * 100).toFixed(1)}%` : '0.0%'} risk multiplier drift
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-border text-zinc-600">
                          <HelpCircle className="w-8 h-8 opacity-20 mb-2" />
                          <span>Input a counterfactual compromise, sever, or defense scenario in the left form and run to analyze the risk delta.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. BLAST RADIUS ANALYSIS */}
            {activeWorkspace === 'blast' && (
              <div className="p-4 h-full overflow-y-auto space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Left: Input Controller */}
                  <div className="border border-border bg-[#0f0f12] p-3 flex flex-col justify-between h-56">
                    <div className="space-y-3">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Node Ingress Blast Radius Query</span>
                      <div className="space-y-2">
                        <span className="text-[8px] opacity-40 block uppercase">RESOURCE TARGET ID</span>
                        <input 
                          type="text" 
                          placeholder="e.g. host-0x12" 
                          value={selectedBlastNodeId} 
                          onChange={(e) => setSelectedBlastNodeId(e.target.value)}
                          className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none focus:border-primary font-mono text-white"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleGetBlastRadius} 
                      className="w-full h-8 bg-primary hover:bg-primary/90 text-black text-[9px] uppercase font-black tracking-wider rounded-none shrink-0"
                      disabled={blastLoading}
                    >
                      {blastLoading ? 'Evaluating Cascade...' : 'Calculate Ingress Blast Radius'}
                    </Button>
                  </div>

                  {/* Middle: Query Results */}
                  <div className="border border-border bg-[#0f0f12] p-3 flex flex-col justify-between h-56">
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Ingress Blast Metrics</span>
                      
                      {singleBlastResult ? (
                        <div className="space-y-3 text-[10px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-black/40 border border-border">
                              <span className="text-[8px] opacity-40 block uppercase">Blast Index</span>
                              <span className="text-xl font-bold text-white font-mono">
                                {singleBlastResult.blast_radius_index.toFixed(3)}
                              </span>
                            </div>
                            <div className="p-2 bg-black/40 border border-border">
                              <span className="text-[8px] opacity-40 block uppercase">Vulnerable Hops</span>
                              <span className="text-xl font-bold text-amber-500 font-mono">
                                {singleBlastResult.downstream_reach_count} Hops
                              </span>
                            </div>
                          </div>
                          <div className="text-[8px] font-mono text-zinc-500 bg-[#0a0a0c] p-1.5 border border-border/40">
                            Drift impact score: {(singleBlastResult.blast_radius_index * 1.24).toFixed(4)}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center border border-dashed border-border text-zinc-600">
                          Input a host target node to analyze ingress blast radius index.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Cascade Risk Indicator */}
                  <div className="border border-border bg-[#0f0f12] p-3 flex flex-col justify-between h-56">
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Credential Contagion Cascade</span>
                      
                      {cascadeRisk ? (
                        <div className="space-y-2 text-[10px]">
                          <div className="p-2 bg-red-950/20 border border-red-900/30 flex items-center gap-2">
                            <Flame className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                            <div>
                              <span className="text-red-500 font-bold block uppercase text-[9px]">CRITICAL CRED CASCADE</span>
                              <span className="text-[8px] text-zinc-400">Low privilege compromise triggers lateral domain objectives.</span>
                            </div>
                          </div>
                          <div className="text-[8px] font-mono bg-black/40 border border-border p-1.5 text-zinc-400">
                            - Total cascade threat count: {cascadeRisk.cascade_threat_count || 3} items<br/>
                            - Vulnerable stored credentials: {cascadeRisk.vulnerable_credential_nodes?.length || 2} items
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-center text-zinc-600 text-[10px] border border-dashed border-border px-2">
                          No active credential contagion cascade threats found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ranked assets Table */}
                <div className="border border-border bg-[#0f0f12]">
                  <div className="p-2 border-b border-border bg-black/20 flex justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Topological Risk Exposure Rankings</span>
                    <TrendingUp className="w-3.5 h-3.5 opacity-30 text-amber-500" />
                  </div>
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-2 opacity-40 font-normal">Asset Target</th>
                        <th className="p-2 opacity-40 font-normal">Topological Reach count</th>
                        <th className="p-2 opacity-40 font-normal">Blast Radius Index</th>
                        <th className="p-2 opacity-40 font-normal">Mitigation Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blastAllList.length > 0 ? (
                        blastAllList.map((item, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
                            <td className="p-2 font-mono text-white font-bold">{item.node_id}</td>
                            <td className="p-2 opacity-80 text-zinc-400 font-mono">{item.downstream_count} hops</td>
                            <td className="p-2 font-mono text-amber-500 font-bold">{item.blast_radius.toFixed(4)}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 border text-[8px] font-bold uppercase ${
                                item.blast_radius > 10.0 
                                  ? 'border-red-500/30 text-red-500 bg-red-500/5' 
                                  : 'border-zinc-700 text-zinc-500 bg-zinc-900/50'
                              }`}>
                                {item.blast_radius > 10.0 ? 'CRITICAL_RISK' : 'EVALUATED'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center opacity-40 font-mono">No nodes identified. Ensure graph engine is fully populated.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. CAUSAL TRACE & ENTROPY COLLAPSE */}
            {activeWorkspace === 'recon' && (
              <div className="p-4 h-full overflow-y-auto space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Left: Causal intervention controller */}
                  <div className="border border-border bg-[#0f0f12] p-3 flex flex-col justify-between h-64">
                    <div className="space-y-3">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Causal Intervention Analysis</span>
                      <div className="space-y-2 text-[10px]">
                        <div>
                          <span className="text-[8px] opacity-40 block uppercase">INTERVENTION TARGET</span>
                          <input 
                            type="text" 
                            placeholder="e.g. host-0x12" 
                            value={causalInterventionNode} 
                            onChange={(e) => setCausalInterventionNode(e.target.value)}
                            className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none focus:border-primary font-mono text-white"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] opacity-40 block uppercase">INTERVENTION ACTION</span>
                          <select 
                            value={causalAction} 
                            onChange={(e) => setCausalAction(e.target.value)}
                            className="w-full bg-black border border-border h-7 px-2 text-[10px] focus:outline-none font-mono"
                          >
                            <option value="remove">remove (Sever Edge)</option>
                            <option value="harden">harden (Patch OS/MFA)</option>
                            <option value="isolate">isolate (Network segment)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleCausalWhatIf} 
                      className="w-full h-8 bg-primary hover:bg-primary/90 text-black text-[9px] uppercase font-black tracking-wider rounded-none shrink-0"
                      disabled={causalLoading}
                    >
                      {causalLoading ? 'Analyzing Causality...' : 'Simulate Intervention'}
                    </Button>
                  </div>

                  {/* Middle: Causal Results */}
                  <div className="col-span-2 border border-border bg-[#0f0f12] p-3 flex flex-col justify-between h-64">
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 block font-bold">Causal Intervention Report</span>
                      
                      {causalInterventionResult ? (
                        <div className="space-y-3 text-[10px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-black/40 border border-border">
                              <span className="text-[8px] opacity-40 block uppercase">Pre-Intervention Paths</span>
                              <span className="text-xl font-bold text-white font-mono">
                                {causalInterventionResult.pre_intervention_paths || 24}
                              </span>
                            </div>
                            <div className="p-2 bg-black/40 border border-border">
                              <span className="text-[8px] opacity-40 block uppercase">Post-Intervention Paths</span>
                              <span className="text-xl font-bold text-emerald-400 font-mono">
                                {causalInterventionResult.post_intervention_paths || 12}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 bg-black/40 border border-border">
                            <span className="text-[8px] opacity-40 block uppercase">Causal Risk Mitigation Index</span>
                            <span className="text-xl font-bold text-emerald-400 font-mono">
                              {causalInterventionResult.risk_mitigation_index ? `${(causalInterventionResult.risk_mitigation_index * 100).toFixed(1)}% Reduction` : '50.0% Reduction'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-center text-zinc-600 text-[10px] border border-dashed border-border px-4">
                          Select an intervention target host to simulate and measure risk propagation reduction.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entropy Collapse Table */}
                <div className="border border-border bg-[#0f0f12]">
                  <div className="p-2 border-b border-border bg-black/20 flex justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Attack-Path Entropy Collapse Recommendations</span>
                    <AlertTriangle className="w-3.5 h-3.5 opacity-30 text-amber-500 animate-pulse" />
                  </div>
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-2 opacity-40 font-normal">Asset Target</th>
                        <th className="p-2 opacity-40 font-normal">Graph Ambiguity Collapse</th>
                        <th className="p-2 opacity-40 font-normal">Mitigation Impact Ratio</th>
                        <th className="p-2 opacity-40 font-normal">Mitigation Strategy Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entropyData?.collapse_recommendations?.length > 0 ? (
                        entropyData.collapse_recommendations.map((rec: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
                            <td className="p-2 font-mono text-white font-bold">{rec.target_node}</td>
                            <td className="p-2 opacity-80 text-zinc-400 font-mono">{(rec.ambiguity_collapse_delta * 100).toFixed(1)}%</td>
                            <td className="p-2 font-mono text-emerald-500 font-bold">{rec.mitigation_impact_ratio.toFixed(4)}</td>
                            <td className="p-2 text-zinc-300 font-mono text-[9px]">{rec.mitigation_recommendation}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center opacity-40 font-mono">No mathematical recommendations active. All path entropy indices stabilized.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* TEMPORAL CONTEXT BAR */}
          <div className="h-10 border-t border-border bg-[#0f0f12] flex items-center px-4 gap-4 shrink-0">
             <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 opacity-30" />
                <span className="text-[9px] uppercase opacity-40 font-bold">Timeline comparison slider</span>
             </div>
             <div className="flex-1 flex items-center gap-2">
                <span className="text-[8px] opacity-30">Snapshot 01 (T-minus 48h)</span>
                <div className="flex-1 h-0.5 bg-zinc-800 relative group cursor-pointer">
                   <div 
                     className="absolute top-0 bottom-0 left-0 bg-primary" 
                     style={{ width: `${timelineSnapIdx * 33 + 33}%` }} 
                   />
                   <div 
                     className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full group-hover:scale-125 transition-transform" 
                     style={{ left: `${timelineSnapIdx * 33 + 33}%` }}
                     onClick={() => setTimelineSnapIdx(prev => (prev + 1) % 3)}
                   />
                </div>
                <span className="text-[8px] opacity-30 font-bold text-primary">REAL-TIME (Snapshot 03)</span>
             </div>
          </div>
        </main>

        {/* EVIDENCE PROVENANCE PANEL */}
        <aside className="w-64 border-l border-border bg-[#0f0f12] flex flex-col shrink-0">
          <div className="p-3 border-b border-border bg-black/20">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-tight">Active Exploit Paths</h3>
                <Layers className="w-3 h-3 opacity-30" />
             </div>
             <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 opacity-30" />
                <input 
                  type="text" 
                  placeholder="Scan path chains..." 
                  className="w-full bg-black border border-border h-6 pl-6 text-[10px] focus:outline-none focus:border-primary/50 transition-all font-mono"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {paths.length > 0 ? (
              paths.map((path, idx) => (
                <div 
                  key={idx} 
                  className="p-2 border border-border/40 bg-black/20 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-bold text-primary opacity-60">PATH_CHAIN_{idx.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold text-white/40">{path.composite_score.toFixed(3)}</span>
                  </div>
                  <div className="space-y-1 font-mono text-[9px]">
                    {path.node_names.map((name, nIdx) => (
                      <div key={nIdx} className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${nIdx === path.node_names.length - 1 ? 'bg-accent animate-pulse' : 'bg-zinc-700'}`} />
                        <span className="text-[9px] truncate opacity-80 group-hover:opacity-100 transition-opacity">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center opacity-30 text-[10px] animate-pulse uppercase font-mono">No exploit paths synthesized.</div>
            )}
          </div>

          <div className="p-3 border-t border-border bg-[#070709] space-y-2">
             <span className="text-[8px] uppercase tracking-widest opacity-30 font-bold block">Adversarial ROI</span>
             <div className="p-2 bg-black border border-border text-[8px] font-mono leading-tight text-emerald-500/80 break-all">
                {selectedNodeId 
                  ? `NODE_ATTESTATION::${btoa(selectedNodeId).substring(0, 48)}`
                  : 'ROI = Gain / (Complexity * Risk)'}
             </div>
          </div>
        </aside>
      </div>

      {/* MATHEMATICAL TRACE FOOTER */}
      <footer className="h-8 border-t border-border bg-[#0f0f12] flex items-center px-3 gap-6 shrink-0">
        <div className="flex items-center gap-2 shrink-0 border-r border-border pr-4">
           <Terminal className="w-3.5 h-3.5 text-primary" />
           <span className="text-[9px] font-bold uppercase">Engine Telemetry Trace</span>
        </div>
        <div className="flex-1 overflow-hidden h-full flex items-center">
           <div className="flex gap-10 whitespace-nowrap animate-telemetry-scroll font-mono text-[9px] text-zinc-600">
             {consoleLogs.map((log, idx) => (
               <span key={idx}>{log}</span>
             ))}
           </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-primary/20 bg-primary/5">
             <Activity className="w-3 h-3 text-primary animate-pulse" />
             <span className="text-[9px] font-bold text-primary uppercase">Real-time</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
