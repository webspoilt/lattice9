import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Radar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelligenceNavigator } from '@/components/IntelligenceNavigator';
import { TelemetryBar } from '@/components/TelemetryBar';
import { CoreSections } from '@/components/CoreSections';
import { PretextLog } from '@/components/PretextLog';
import { BackgroundField } from '@/components/BackgroundField';
import { AdversarialSlopeGraph } from '@/components/AdversarialSlopeGraph';

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

export default function Home() {
  const [globalEntropy, setGlobalEntropy] = useState(0.2);

  useEffect(() => {
    console.log("LATTICE9_INIT: Offensive Intelligence Interface active.");
    
    // Simulate global entropy fluctuations
    const interval = setInterval(() => {
      setGlobalEntropy(prev => {
        const target = Math.random() > 0.8 ? 0.6 : 0.2;
        return prev + (target - prev) * 0.1;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] } },
  };
  const fadeIn = (i: number) => ({
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] } },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] selection:bg-indigo-500/20">

      {/* Background Spectral Field (Entropy Simulation) */}
      <BackgroundField entropy={globalEntropy} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e20] bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-none bg-indigo-600 flex items-center justify-center">
              <Radar className="w-4 h-4 text-[#0a0a0b]" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Lattice9</span>
            <span className="hidden sm:inline text-[10px] font-mono text-[#444] ml-2 tracking-widest lowercase">system.intelligence_v5.0.0</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Topology', 'Entropy', 'Inference'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-[10px] font-mono text-[#555] hover:text-indigo-400 transition-colors tracking-widest uppercase">{l}</a>
            ))}
          </div>
          <a href="https://github.com/webspoilt/lattice9" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] font-mono tracking-widest h-7 px-4 rounded-none lowercase">deploy_node</Button>
          </a>
        </div>
      </nav>

      {/* Hero: Active Intelligence Environment */}
      <section className="relative pt-24 min-h-screen flex flex-col overflow-hidden bg-[#050507]">
        <div className="absolute inset-0 z-0 opacity-20"><BackgroundField entropy={globalEntropy} /></div>
        
        <div className="container relative z-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-10">
              <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="visible">
                <motion.div className="flex items-center gap-3" variants={fadeUp}>
                  <div className="h-px w-12 bg-indigo-500/30" />
                  <span className="text-[10px] font-mono text-indigo-400 tracking-[0.4em] uppercase">Intelligence_Reasoning_Active</span>
                </motion.div>
                
                <motion.h1 className="text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tighter lowercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }} variants={fadeUp}>
                  Reasoning <br />
                  <span className="text-indigo-500">Over</span> <br />
                  Orchestration.
                </motion.h1>

                <motion.p className="text-base leading-relaxed text-[#666] max-w-md font-light" variants={fadeUp}>
                  Lattice9 generates normalized attack surface graphs using probabilistic inference. We solve for exploitability by deriving truth from high-entropy adversarial noise.
                </motion.p>

                <motion.div className="flex items-center gap-4 pt-4" variants={fadeUp}>
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-500 gap-2 text-xs font-mono tracking-wider h-11 px-6 rounded-none">
                    Initialize Engine <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" className="border-[#2a2a2d] text-[#888] hover:bg-[#151517] text-xs font-mono tracking-wider h-11 px-6 rounded-none">Documentation</Button>
                </motion.div>
              </motion.div>
            </div>

            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}>
                <IntelligenceNavigator data={{
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
                }} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Side annotations */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 pointer-events-none">
          <div className="telemetry-text text-[#2a2a2d]" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>LATTICE9_SURFACE_TOPOLOGY_v5.0.0</div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 pointer-events-none">
          {['PROB', 'GRAPH', 'BAYES', 'ENTROPY'].map((l, i) => (
            <div key={l} className="flex items-center gap-1.5 justify-end">
              <span className="telemetry-text text-[#2a2a2d]">{l}</span>
              <div className="w-1 h-1 rounded-none" style={{ background: ['#6366f1', '#6366f1', '#d4a574', '#6366f1'][i], opacity: 0.4 }} />
            </div>
          ))}
        </div>

        {/* Node legend */}
        <div className="absolute bottom-16 left-6 hidden md:flex items-center gap-5 pointer-events-none z-10">
          {[{ l: 'Recon', c: '#6366f1' }, { l: 'Exploit', c: '#d4a574' }, { l: 'Auth', c: '#00d9ff' }, { l: 'Infra', c: '#8c8ca0' }].map((n) => (
            <div key={n.l} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-none" style={{ background: n.c, opacity: 0.6 }} />
              <span className="telemetry-text text-[#555]">{n.l.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="container">
            <motion.div className="max-w-xl space-y-10" variants={stagger} initial="hidden" animate="visible">
              <motion.div className="space-y-6" variants={fadeUp}>
                <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-indigo-500/30" />
                  <span className="text-[10px] font-mono text-indigo-400 tracking-[0.4em] uppercase">Adversarial Systems Theory</span>
                </div>
                <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-bold leading-[1.05] tracking-tight text-[#f0f0f0] lowercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Adversarial Intelligence <br />
                  <span className="text-indigo-500">Compression.</span>
                </h1>
                <p className="text-base leading-relaxed text-[#666] max-w-lg lowercase font-light" style={{ fontFamily: "'Inter', sans-serif" }}>
                  A graph-native probabilistic reasoning engine for the automated discovery of adversarial system states. Solving for intelligence yield at the edge of computational observability.
                </p>
              </motion.div>
              <motion.div className="flex items-center gap-4" variants={fadeUp}>
                <a href="https://github.com/webspoilt/lattice9" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-500 gap-2 text-xs font-mono tracking-wider h-10 px-5 rounded-none">
                    View Repository <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
                <a href="#architecture">
                  <Button variant="outline" className="border-[#2a2a2d] text-[#888] hover:bg-[#151517] hover:text-[#ccc] text-xs font-mono tracking-wider h-10 px-5 rounded-none">Architecture</Button>
                </a>
              </motion.div>
              <motion.div className="flex items-center gap-6 pt-6 border-t border-[#1e1e20]" variants={fadeUp}>
                {[{ l: 'Confidence', v: '0.982' }, { l: 'Variance', v: '±0.04' }, { l: 'Paths', v: '3' }, { l: 'Nodes', v: '15' }].map((m) => (
                  <div key={m.l} className="space-y-1">
                    <div className="text-xs font-mono text-indigo-400 tracking-wider">{m.v}</div>
                    <div className="text-[9px] font-mono text-[#555] uppercase tracking-[0.2em]">{m.l}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown className="w-4 h-4 text-[#444]" />
        </motion.div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-24 border-t border-[#1a1a1c] bg-[#080809]">
        <div className="container">
          <motion.div className="space-y-16" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            <motion.div className="max-w-lg space-y-4" variants={fadeUp}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-6 bg-indigo-500/30" />
                <span className="text-[9px] font-mono text-indigo-400 tracking-[0.3em] uppercase">Architecture</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>How the engine reasons.</h2>
              <p className="text-sm text-[#777] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Lattice9 models every target as a graph G=(V,E). Intelligence flows through the topology via Bayesian inference and spectral partitioning.
              </p>
            </motion.div>
            <motion.div className="p-8 rounded-none border border-[#1e1e20] bg-[#0e0e10] overflow-x-auto shadow-inner" variants={fadeUp}>
              <pre className="text-[11px] font-mono text-[#555] leading-loose whitespace-pre">
{`       [ TARGET_SYSTEM ]
           │
    ┌──────┴──────┐
    │             │
 [ NODES ]     [ EDGES ] ←── Probabilistic Exploit Trajectories
    │             │
    └──────┬──────┘
           │
    [ SPECTRAL_TOPOLOGY ] ←── λ₂(L) > 0 (Fiedler Vector)
           │
    [ BAYESIAN_FUSION ] ←── P(H|E) = P(E|H)·P(H) / P(E)
           │
    ┌──────┴──────┐
    │             │
 [ PATH_OPTIM ]   [ ENTROPY_MIN ] ←── Bellman Equations
    │             │
    └─────────────┘
           │
      [ OPERATOR ]`}
              </pre>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { s: '01', t: 'Evidence Collection', d: 'Gather raw signals from headers, DNS, timing, and entropy analysis.' },
                { s: '02', t: 'Confidence Calibration', d: 'Weigh each signal by source type (Deterministic, Statistical, Heuristic).' },
                { s: '03', t: 'Graph Fusion', d: 'Map evidence onto the asset graph. Calculate centrality-weighted risk.' },
                { s: '04', t: 'Decision Compression', d: 'Synthesize all intelligence into the top 3 attack paths.' },
              ].map((p, i) => (
                <motion.div key={p.s} className="p-5 rounded-none border border-[#1e1e20] bg-[#0e0e10] hover:border-indigo-500/20 transition-colors group"
                  custom={i} variants={fadeIn(i)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <div className="text-[10px] font-mono text-indigo-400 tracking-[0.3em] mb-3">{p.s}</div>
                  <h3 className="text-sm font-bold mb-2 group-hover:text-indigo-400 transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.t}</h3>
                  <p className="text-xs text-[#666] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{p.d}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Modules */}
      <div id="modules">
        <CoreSections />
      </div>

      {/* Predictive Intelligence Section */}
      <section id="intelligence" className="py-24 border-t border-[#1a1a1c] bg-[#0a0a0b]">
        <div className="container">
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div className="space-y-6" variants={fadeUp}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-6 bg-indigo-500/30" />
                <span className="text-[9px] font-mono text-indigo-400 tracking-[0.3em] uppercase">PREDICTIVE_INFERENCE</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Derivative Analysis.</h2>
              <p className="text-sm text-[#777] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Lattice9 calculates the rate of change across multiple adversarial metrics. By analyzing the slope of trust decay and recon yield, we can predict system compromise before it manifests in deterministic logs.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-none border border-[#1e1e20] bg-[#0e0e10] flex items-center justify-center text-[10px] text-indigo-400 font-mono">01</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#aaa] mb-1">Direct Slope Labeling</h4>
                    <p className="text-[10px] text-[#555]">Industry-standard visualization with immediate rate-of-change visibility.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-none border border-[#1e1e20] bg-[#0e0e10] flex items-center justify-center text-[10px] text-indigo-400 font-mono">02</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#aaa] mb-1">KaTeX Formula Support</h4>
                    <p className="text-[10px] text-[#555]">High-fidelity mathematical typesetting for exact derivative expressions.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <AdversarialSlopeGraph />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Operational Log */}
      <section id="research" className="py-24 border-t border-[#1a1a1c] relative overflow-hidden bg-[#050506]">
        <div className="container relative z-10">
          <motion.div className="space-y-16" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            <motion.div className="max-w-lg space-y-4" variants={fadeUp}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-6 bg-indigo-500/30" />
                <span className="text-[9px] font-mono text-indigo-400 tracking-[0.3em] uppercase">SYSTEM.DUMP</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#888]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>REASONING_TRACE_v5.0.0</h2>
              <p className="text-xs text-[#555] font-mono leading-relaxed max-w-sm">
                Every inference is backed by an evidence chain. Lattice9 propagates confidence through the graph to minimize false positives.
              </p>
            </motion.div>

            <div className="relative min-h-[600px] border border-[#1e1e20] bg-[#000000] p-8 overflow-hidden shadow-2xl rounded-none">
              <PretextLog 
                color="#6366f1"
                className="opacity-80"
                content={`[SYSTEM_INIT] Initializing adversarial systems theory engine... OK
[STATUS] Project status: ESCAPING_CONTAINMENT
[LOGIC] Executing Offensive Intelligence Compression:
      Target: 1,000,000 observations -> 3 high-confidence narratives.
      Inference Engine: Stable. Confidence propagation: 0.94

[DIAGNOSTIC] Analyzing graph-native recon topology G=(V,E)
      V*(s) = maxₐ Σ P(s′|s,a)[R + γV*(s′)]
      Evaluating probabilistic truth propagation... SUCCESS.

[STREAM] Measuring Shannon Entropy across trust zones
      H(X) = −Σ p(xᵢ) log₂ p(xᵢ)
      Alert: Transitive confidence cascade instability detected at 0x6366F1.
      Stabilizing ontology via Spectral Laplacian... OK.

[EVOLUTION] Drift toward systems-level cyber observability
      ∂Ω/∂t = ∫K(x,y)·φ(y)dΓ(y)
      Warning: Abstraction recursion detected in exploit graph. 
      Decoupling cyber-philosophy from operational outcomes.

[GOAL] Reducing noise. Grounding inference quality.
[END_OF_DUMP] SYSTEM_NOMINAL // STATUS: DANGEROUSLY_AMBITIOUS`}
              />
              
              <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-30">
                {[
                  { text: '0x00A1: INTELLIGENCE_COMPRESSION_RATIO = 333,333:1', top: '15%', right: '10%', rotate: '0deg' },
                  { text: '0x00F3: ADVERSARIAL_SYSTEMS_THEORY_v5.0.0', bottom: '20%', left: '15%', rotate: '0deg' },
                  { text: '0x01A4: REASONING_QUALITY > RUNNING_TOOLS', top: '60%', right: '20%', rotate: '0deg' },
                  { text: '0x02B1: PROBABILISTIC_TRUTH_PROPAGATION', bottom: '40%', right: '30%', rotate: '0deg' },
                ].map((f, i) => (
                  <motion.div key={i} className="absolute text-xs font-mono text-[#d4a574] tracking-wide" style={{ top: f.top, bottom: f.bottom, left: f.left, right: f.right, transform: `rotate(${f.rotate})` }}
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.5 + 0.5 }}>
                    {f.text}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#1a1a1c] bg-[#0a0a0b]">
        <div className="container">
          <motion.div className="max-w-lg space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Built for operators who care about ground truth.</h2>
              <p className="text-sm text-[#777] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>Lattice9 is an experimental intelligence organism. Open source, graph-native, and mathematically constrained.</p>
            </motion.div>
            <motion.div className="flex gap-4" variants={fadeUp}>
              <a href="https://github.com/webspoilt/lattice9" target="_blank" rel="noopener noreferrer">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500 gap-2 text-xs font-mono tracking-wider h-10 px-5 rounded-none">View on GitHub <ArrowRight className="w-3.5 h-3.5" /></Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-[#1a1a1c] bg-[#08080a] mb-7">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-none bg-indigo-600 flex items-center justify-center"><Radar className="w-3 h-3 text-[#0a0a0b]" /></div>
              <span className="text-xs font-mono text-[#555]">Lattice9 — Offensive Intelligence Engine</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/webspoilt/lattice9" className="text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors tracking-wider uppercase">GitHub</a>
              <span className="text-[10px] font-mono text-[#333]">by zeroday</span>
              <span className="text-[10px] font-mono text-[#333]">v5.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Telemetry Bar */}
      <TelemetryBar />
    </div>
  );
}
