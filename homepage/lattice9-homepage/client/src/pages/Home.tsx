import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
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
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelligenceNavigator } from '@/components/IntelligenceNavigator';
import { TelemetryBar } from '@/components/TelemetryBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const MOCK_INTELLIGENCE = {
  entities: [
    { id: '1', label: 'prod-api.lattice9.io', type: 'asset' },
    { id: '2', label: 'admin-console', type: 'asset' },
    { id: '3', label: 'svc_deployer', type: 'identity' },
    { id: '4', label: 'CVE-2024-JWT-BYPASS', type: 'vuln' },
    { id: '5', label: 'SSO-Gateway', type: 'service' },
  ],
  inferences: [
    { sourceId: '1', targetEntityId: '5', type: 'contains' },
    { sourceId: '5', targetEntityId: '4', type: 'exploits' },
    { sourceId: '4', targetEntityId: '3', type: 'identifies' },
    { sourceId: '3', targetEntityId: '2', type: 'auths' },
  ]
};

const MOCK_FINDINGS = [
  { id: 'F-921', title: 'Credential Leakage in CI/CD', severity: 'critical', type: 'IDENTITY' },
  { id: 'F-842', title: 'Insecure JWT Validation', severity: 'high', type: 'VULN' },
  { id: 'F-711', title: 'Orphaned API Endpoint', severity: 'medium', type: 'ASSET' },
  { id: 'F-603', title: 'TLS 1.1 Support Detected', severity: 'low', type: 'SERVICE' },
];

export default function Home() {
  const [globalEntropy, setGlobalEntropy] = useState(0.2);
  const [activeWorkspace, setActiveWorkspace] = useState('intelligence');

  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalEntropy(prev => {
        const target = Math.random() > 0.8 ? 0.6 : 0.2;
        return prev + (target - prev) * 0.1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fixed variants with proper types for React 19 / latest Framer Motion
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" } 
    },
  };

  return (
    <div className="h-screen bg-[#0d0d0f] text-[#d1d1d6] flex flex-col overflow-hidden font-sans op-scanlines">
      {/* Global Operational Header */}
      <header className="h-10 border-b border-border bg-[#141417] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-primary" />
            <span className="op-title text-white">Lattice9</span>
            <div className="h-4 w-px bg-border mx-2" />
            <span className="op-label text-muted-foreground">Operational Interface v5.0.0</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="op-label">Status:</span>
              <span className="op-badge op-badge-accent">Nominal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="op-label">Entropy:</span>
              <span className="op-value">{globalEntropy.toFixed(4)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-border">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="op-value !text-[10px] uppercase">Operator: Root</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none hover:bg-white/5">
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Tactical Navigation Sidebar */}
        <aside className="w-48 border-r border-border bg-[#141417] flex flex-col">
          <nav className="flex-1 p-2 space-y-1">
            <div className="px-2 pb-2 mb-2 border-b border-border">
              <span className="op-label !text-[8px]">Intelligence Core</span>
            </div>
            {[
              { id: 'intelligence', label: 'Graph Explorer', icon: Network },
              { id: 'assets', label: 'Infrastructure', icon: Database },
              { id: 'findings', label: 'Evidence Log', icon: Shield },
              { id: 'telemetry', label: 'Real-time Trace', icon: Activity },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium transition-all group ${
                  activeWorkspace === item.id 
                    ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${activeWorkspace === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.label}
              </button>
            ))}

            <div className="px-2 pt-6 pb-2 mb-2 border-b border-border">
              <span className="op-label !text-[8px]">Operation Context</span>
            </div>
            {['L9-ALPHA', 'L9-BETA', 'DEV-ENV'].map(ctx => (
              <button key={ctx} className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-white hover:bg-white/5">
                {ctx}
                <ChevronRight className="w-2.5 h-2.5 opacity-30" />
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border space-y-4">
             <div className="space-y-1.5">
                <span className="op-label block">Uptime</span>
                <span className="op-value block">142:23:11</span>
             </div>
             <a href="https://github.com/webspoilt/lattice9" target="_blank" rel="noopener noreferrer">
               <Button className="w-full h-8 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] uppercase font-bold tracking-widest rounded-none gap-2">
                 <Github className="w-3.5 h-3.5" /> Source
               </Button>
             </a>
          </div>
        </aside>

        {/* Main Intelligence Surface */}
        <main className="flex-1 flex flex-col bg-[#0d0d0f] relative overflow-hidden">
          {/* Workspace Tabs / Tools */}
          <div className="h-8 border-b border-border bg-[#141417]/50 flex items-center px-4 justify-between">
            <div className="flex gap-4">
              <span className="op-label text-primary">Intelligence Navigator</span>
              <span className="op-label opacity-30">Projection: Mercator</span>
              <span className="op-label opacity-30">Clustering: Spectral</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary" />
                <span className="op-label">Asset</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-accent" />
                <span className="op-label">Vuln</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative op-grid-pattern">
            {/* Graph Visualization Workspace */}
            <div className="absolute inset-0">
              <ErrorBoundary>
                <IntelligenceNavigator data={MOCK_INTELLIGENCE} />
              </ErrorBoundary>
            </div>

            {/* Floatover UI Overlays */}
            <div className="absolute top-4 left-4 w-64 space-y-4 pointer-events-none">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="op-panel shadow-2xl pointer-events-auto">
                <div className="op-panel-header">
                  <span className="op-title">Operational Summary</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="op-label text-muted-foreground">Total Assets</span>
                    <span className="op-value text-white">412</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="op-label text-muted-foreground">Exposure Paths</span>
                    <span className="op-value text-accent">14 Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="op-label text-muted-foreground">Reasoning Engine</span>
                    <span className="op-badge op-badge-primary">Enabled</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="op-panel shadow-2xl pointer-events-auto">
                <div className="op-panel-header">
                  <span className="op-title">Attack Path Inference</span>
                  <Zap className="w-3 h-3 text-accent" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic border-l border-accent/30 pl-2">
                    L9-Inference: High-confidence path detected from [prod-api] to [admin-console] via JWT-Bypass.
                  </p>
                  <button className="w-full h-6 bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase hover:bg-accent/20 transition-all">
                    Initiate Path Synthesis
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Operational Inspector Panel (Right) */}
        <aside className="w-72 border-l border-border bg-[#141417] flex flex-col">
          <div className="p-4 border-b border-border bg-[#1c1c1f]/50">
             <div className="flex items-center justify-between mb-2">
                <h3 className="op-title text-white">Evidence Inspector</h3>
                <Layers className="w-3 h-3 text-muted-foreground" />
             </div>
             <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Filter findings..." 
                  className="w-full bg-black border border-border h-7 pl-8 text-[11px] font-mono focus:outline-none focus:border-primary/50"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {MOCK_FINDINGS.map(finding => (
              <div key={finding.id} className="p-3 border border-border bg-black/20 hover:bg-white/5 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="op-label op-text-mono !text-primary">{finding.id}</span>
                  <span className={`op-badge ${
                    finding.severity === 'critical' ? 'op-badge-destructive' : 
                    finding.severity === 'high' ? 'op-badge-destructive' : 
                    'op-badge-muted'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <h4 className="text-[11px] font-bold mb-2 group-hover:text-primary transition-colors">{finding.title}</h4>
                <div className="flex items-center gap-3">
                  <span className="op-label !text-[8px] opacity-40">{finding.type}</span>
                  <div className="h-2 w-px bg-border" />
                  <span className="op-label !text-[8px] opacity-40">2 HOURS AGO</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border bg-[#0d0d0f]">
             <span className="op-label block mb-3">Lineage Integrity</span>
             <div className="p-2 border border-border bg-black/40 op-text-mono text-[9px] text-muted-foreground break-all">
                SHA256: 9f8349b1e2e3c4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9
             </div>
          </div>
        </aside>
      </div>

      {/* Real-time Telemetry Trace */}
      <footer className="h-10 border-t border-border bg-[#0d0d0f] flex items-center px-4 gap-6 z-50">
        <div className="flex items-center gap-2">
           <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
           <span className="op-label">Telemetry Trace</span>
        </div>
        <div className="flex-1 overflow-hidden h-full flex items-center">
           <div className="flex gap-8 whitespace-nowrap animate-telemetry-scroll op-text-mono text-[10px] text-muted-foreground opacity-50">
             <span>[07:22:11] INITIALIZING GRAPH_PARTITIONER... OK</span>
             <span>[07:22:12] EXECUTING DIJKSTRA ATTACH_PATH_CALC...</span>
             <span>[07:22:14] BAYESIAN_FUSION COMPLETED FOR 0x921F</span>
             <span>[07:22:15] DETECTED ANOMALOUS TRUST_ZONE ESCALATION</span>
             <span>[07:22:18] PROPAGATING CONFIDENCE_SCORE: 0.9412</span>
             <span>[07:22:11] INITIALIZING GRAPH_PARTITIONER... OK</span>
             <span>[07:22:12] EXECUTING DIJKSTRA ATTACH_PATH_CALC...</span>
             <span>[07:22:14] BAYESIAN_FUSION COMPLETED FOR 0x921F</span>
             <span>[07:22:15] DETECTED ANOMALOUS TRUST_ZONE ESCALATION</span>
             <span>[07:22:18] PROPAGATING CONFIDENCE_SCORE: 0.9412</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 bg-accent" />
             <span className="op-label !text-accent">Live Feed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
