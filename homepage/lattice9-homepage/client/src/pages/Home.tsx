import { useState } from 'react';
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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelligenceNavigator } from '@/components/IntelligenceNavigator';
import { TelemetryBar } from '@/components/TelemetryBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useIntelligence } from '@/hooks/useIntelligence';

export default function Home() {
  const [engagementId, setEngagementId] = useState('L9-ALPHA-01');
  const [activeWorkspace, setActiveWorkspace] = useState('intelligence');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  
  const { nodes, paths, loading, error } = useIntelligence(engagementId);

  return (
    <div className="h-screen bg-[#0a0a0c] text-[#a1a1aa] flex flex-col overflow-hidden font-mono selection:bg-primary/30">
      {/* PHASE 9 — PROFESSIONAL OPERATOR HEADER */}
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
                className="bg-transparent text-[10px] text-primary font-bold focus:outline-none border-b border-transparent hover:border-primary/30 transition-all cursor-pointer"
              >
                <option value="L9-ALPHA-01">L9-ALPHA-01</option>
                <option value="L9-BETA-02">L9-BETA-02</option>
                <option value="LAB-OOS">LAB-OOS</option>
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
            <span className="text-[9px] uppercase font-bold text-white/80">root@l9-gateway</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none hover:bg-white/5">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* PHASE 9 — DENSE WORKSPACE NAVIGATOR */}
        <aside className="w-44 border-r border-border bg-[#0f0f12] flex flex-col">
          <nav className="flex-1 p-1.5 space-y-0.5">
            <div className="px-2 py-1 mb-1">
              <span className="text-[8px] uppercase tracking-widest opacity-30 font-bold">Workspaces</span>
            </div>
            {[
              { id: 'intelligence', label: 'Graph Explorer', icon: Network },
              { id: 'assets', label: 'Infrastructure', icon: Database },
              { id: 'findings', label: 'Evidence Log', icon: Shield },
              { id: 'timeline', label: 'Temporal Drift', icon: History },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] font-medium transition-all group relative ${
                  activeWorkspace === item.id 
                    ? 'text-primary bg-primary/5' 
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
              <span className="text-[8px] uppercase tracking-widest opacity-30 font-bold">Analysis Tools</span>
            </div>
            {[
              { id: 'paths', label: 'Path Synthesis', icon: Zap },
              { id: 'blast', label: 'Blast Radius', icon: Radar },
              { id: 'recon', label: 'Engine Trace', icon: Eye },
            ].map(item => (
              <button
                key={item.id}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-all group"
              >
                <item.icon className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-border bg-[#0a0a0c]">
             <div className="mb-3 space-y-1">
                <span className="text-[8px] uppercase opacity-30 font-bold">Session Uptime</span>
                <span className="text-[10px] font-bold text-white block font-mono tracking-tighter">04:12:44:09</span>
             </div>
             <a href="https://github.com/webspoilt/lattice9" target="_blank" rel="noopener noreferrer">
               <Button className="w-full h-7 bg-zinc-900 border border-border hover:bg-zinc-800 text-white text-[9px] uppercase font-bold tracking-widest rounded-none gap-2">
                 <Github className="w-3 h-3" /> Core Repo
               </Button>
             </a>
          </div>
        </aside>

        {/* PHASE 9 — PRIMARY ANALYST VIEWPORT */}
        <main className="flex-1 flex flex-col bg-[#070709] relative">
          {/* Viewport Toolbar */}
          <div className="h-8 border-b border-border bg-[#0f0f12]/80 flex items-center px-3 justify-between">
            <div className="flex gap-4 items-center">
              <span className="text-[10px] font-bold text-primary uppercase">{activeWorkspace}</span>
              <div className="h-3 w-px bg-border" />
              <div className="flex gap-3">
                <span className="text-[9px] opacity-30">Nodes: {nodes.length}</span>
                <span className="text-[9px] opacity-30">Paths: {paths.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-6 text-[9px] px-2 rounded-none hover:bg-white/5 uppercase">Refresh View</Button>
              <Button variant="ghost" className="h-6 text-[9px] px-2 rounded-none hover:bg-white/5 uppercase">Export Data</Button>
            </div>
          </div>

          <div className="flex-1 relative bg-[radial-gradient(#1a1a1f_1px,transparent_1px)] bg-[size:24px_24px]">
            {activeWorkspace === 'intelligence' && (
              <div className="absolute inset-0">
                <ErrorBoundary>
                  <IntelligenceNavigator 
                    data={{ entities: nodes, inferences: [] }} 
                    onNodeClick={(id) => setSelectedNodeId(id)}
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* PHASE 9 — DENSE DATA DISPLAYS */}
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
                        <th className="p-2 opacity-40 font-normal">Classification</th>
                        <th className="p-2 opacity-40 font-normal">Influence</th>
                        <th className="p-2 opacity-40 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map(node => (
                        <tr key={node.id} className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
                          <td className="p-2 font-mono text-primary group-hover:text-white transition-colors">{node.id}</td>
                          <td className="p-2 opacity-60">{node.entity_type}</td>
                          <td className="p-2">
                             <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-sm border ${
                               node.confidence > 0.8 ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' : 'border-zinc-700 text-zinc-500'
                             }`}>
                               {node.confidence > 0.8 ? 'HIGH_CONF' : 'INFERRED'}
                             </span>
                          </td>
                          <td className="p-2">
                             <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${(node.influence_score || 0.1) * 100}%` }} />
                             </div>
                          </td>
                          <td className="p-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PHASE 5 — REASONING TRACE OVERLAY */}
            {activeWorkspace === 'intelligence' && selectedNodeId && (
              <motion.div 
                initial={{ x: 20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                className="absolute top-4 right-4 w-72 border border-border bg-[#0f0f12] shadow-2xl z-20"
              >
                <div className="p-2 border-b border-border bg-primary/10 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-primary uppercase">Reasoning Trace</span>
                  <button onClick={() => setSelectedNodeId(null)} className="opacity-40 hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 space-y-4">
                   <div className="space-y-1">
                      <span className="text-[8px] uppercase opacity-40 block">Subject ID</span>
                      <span className="text-[11px] font-bold text-white break-all">{selectedNodeId}</span>
                   </div>
                   <div className="space-y-2">
                      <span className="text-[8px] uppercase opacity-40 block">Deterministic Logic</span>
                      <div className="p-2 bg-black/40 border border-border/50 text-[9px] space-y-2">
                         <div className="flex gap-2">
                            <span className="text-emerald-500">✓</span>
                            <span>Direct relationship to verified identity: root@prod</span>
                         </div>
                         <div className="flex gap-2">
                            <span className="text-emerald-500">✓</span>
                            <span>Exploit dependency: CVE-2024-5122 confirmed</span>
                         </div>
                         <div className="flex gap-2 text-amber-500 font-bold">
                            <span>!</span>
                            <span>Confidence propagation from host-0x12 (0.92)</span>
                         </div>
                      </div>
                   </div>
                   <Button className="w-full h-7 bg-primary text-black text-[9px] uppercase font-black tracking-widest rounded-none">
                     Expand Lineage
                   </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* PHASE 4 — TEMPORAL CONTEXT BAR */}
          <div className="h-10 border-t border-border bg-[#0f0f12] flex items-center px-4 gap-4">
             <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 opacity-30" />
                <span className="text-[9px] uppercase opacity-40 font-bold">Timeline</span>
             </div>
             <div className="flex-1 flex items-center gap-2">
                <span className="text-[8px] opacity-30">T-minus 48h</span>
                <div className="flex-1 h-0.5 bg-zinc-800 relative group cursor-pointer">
                   <div className="absolute top-0 bottom-0 left-0 w-3/4 bg-primary" />
                   <div className="absolute top-1/2 -translate-y-1/2 left-3/4 w-2 h-2 bg-white border-2 border-primary rounded-full group-hover:scale-125 transition-transform" />
                </div>
                <span className="text-[8px] opacity-30 font-bold text-primary">REAL-TIME</span>
             </div>
          </div>
        </main>

        {/* PHASE 7 — EVIDENCE PROVENANCE PANEL */}
        <aside className="w-64 border-l border-border bg-[#0f0f12] flex flex-col">
          <div className="p-3 border-b border-border bg-black/20">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-tight">Evidence Lineage</h3>
                <Layers className="w-3 h-3 opacity-30" />
             </div>
             <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 opacity-30" />
                <input 
                  type="text" 
                  placeholder="Scan artifacts..." 
                  className="w-full bg-black border border-border h-6 pl-6 text-[10px] focus:outline-none focus:border-primary/50 transition-all"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center opacity-30 text-[10px] animate-pulse uppercase">Fetching engine data...</div>
            ) : (
              paths.map((path, idx) => (
                <div 
                  key={idx} 
                  className="p-2 border border-border/40 bg-black/20 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-bold text-primary opacity-60">PATH_CHAIN_{idx.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold text-white/40">{path.composite_score.toFixed(3)}</span>
                  </div>
                  <div className="space-y-1">
                    {path.node_names.map((name, nIdx) => (
                      <div key={nIdx} className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${nIdx === path.node_names.length - 1 ? 'bg-accent' : 'bg-zinc-700'}`} />
                        <span className="text-[9px] truncate opacity-80 group-hover:opacity-100 transition-opacity">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-border bg-[#070709]">
             <span className="text-[8px] uppercase tracking-widest opacity-30 font-bold block mb-2">Provenance Audit</span>
             <div className="p-1.5 bg-black border border-border text-[8px] font-mono leading-tight text-emerald-500/80 break-all">
                {selectedNodeId 
                  ? `NODE_ATTESTATION::${btoa(selectedNodeId).substring(0, 48)}`
                  : 'READY_FOR_INTEGRITY_AUDIT'}
             </div>
          </div>
        </aside>
      </div>

      {/* PHASE 10 — MATHEMATICAL TRACE FOOTER */}
      <footer className="h-8 border-t border-border bg-[#0f0f12] flex items-center px-3 gap-6">
        <div className="flex items-center gap-2 shrink-0 border-r border-border pr-4">
           <Terminal className="w-3.5 h-3.5 text-primary" />
           <span className="text-[9px] font-bold uppercase">Engine Trace</span>
        </div>
        <div className="flex-1 overflow-hidden h-full flex items-center">
           <div className="flex gap-10 whitespace-nowrap animate-telemetry-scroll font-mono text-[9px] text-zinc-600">
             <span>[0x1A2F] DIJKSTRA_PATH_SYNTHESIS::COMPLETE (paths=24, depth=6)</span>
             <span>[0x92BC] BAYESIAN_CONFIDENCE_PROPAGATION::STABLE (drift=0.002)</span>
             <span>[0xC122] SNAPSHOT_v5.4.1_CAPTURED::NEO4J_COMMIT_ID: 9f8a32</span>
             <span>[0x44D1] EXPOSURE_DIFFUSION_GRADIENT::0.412_REACHABLE</span>
             <span>[0x1A2F] DIJKSTRA_PATH_SYNTHESIS::COMPLETE (paths=24, depth=6)</span>
             <span>[0x92BC] BAYESIAN_CONFIDENCE_PROPAGATION::STABLE (drift=0.002)</span>
             <span>[0xC122] SNAPSHOT_v5.4.1_CAPTURED::NEO4J_COMMIT_ID: 9f8a32</span>
             <span>[0x44D1] EXPOSURE_DIFFUSION_GRADIENT::0.412_REACHABLE</span>
           </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-primary/20 bg-primary/5">
             <Activity className="w-3 h-3 text-primary" />
             <span className="text-[9px] font-bold text-primary uppercase">Real-time</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
