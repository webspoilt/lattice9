import { motion } from 'framer-motion';
import { ArrowRight, Radar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroGraph } from '@/components/HeroGraph';
import { MathAnnotations } from '@/components/MathAnnotations';
import { TelemetryBar } from '@/components/TelemetryBar';
import { CoreSections } from '@/components/CoreSections';

export default function Home() {
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
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] selection:bg-[#4a9eff]/20">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e20] bg-[#0a0a0b]/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#4a9eff] flex items-center justify-center">
              <Radar className="w-4 h-4 text-[#0a0a0b]" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>HAWK</span>
            <span className="hidden sm:inline text-[10px] font-mono text-[#555] ml-2 tracking-widest">v3.5</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Architecture', 'Modules', 'Research'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-xs font-mono text-[#777] hover:text-[#ccc] transition-colors tracking-wider uppercase">{l}</a>
            ))}
          </div>
          <a href="https://github.com/webspoilt/hawk-pentest-platform" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-[#4a9eff] text-[#0a0a0b] hover:bg-[#3d8ce6] text-xs font-mono tracking-wider h-8 px-4">GitHub</Button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-14 min-h-screen flex flex-col hawk-grid-bg">
        <div className="absolute inset-0 w-full h-full" style={{ top: '56px' }}><HeroGraph /></div>
        <MathAnnotations />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b]/95 via-[#0a0a0b]/60 to-transparent pointer-events-none" style={{ top: '56px' }} />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />

        {/* Side annotations */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 pointer-events-none">
          <div className="telemetry-text text-[#2a2a2d]" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>ATTACK_SURFACE_TOPOLOGY_v3.5.1</div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 pointer-events-none">
          {['PROB', 'GRAPH', 'BAYES', 'ENTROPY'].map((l, i) => (
            <div key={l} className="flex items-center gap-1.5 justify-end">
              <span className="telemetry-text text-[#2a2a2d]">{l}</span>
              <div className="w-1 h-1 rounded-full" style={{ background: ['#4a9eff', '#4a9eff', '#d4a574', '#4a9eff'][i], opacity: 0.4 }} />
            </div>
          ))}
        </div>

        {/* Node legend */}
        <div className="absolute bottom-16 left-6 hidden md:flex items-center gap-5 pointer-events-none z-10">
          {[{ l: 'Recon', c: '#4a9eff' }, { l: 'Exploit', c: '#d4a574' }, { l: 'Auth', c: '#00d9ff' }, { l: 'Infra', c: '#8c8ca0' }].map((n) => (
            <div key={n.l} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: n.c, opacity: 0.6 }} />
              <span className="telemetry-text text-[#555]">{n.l.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="container">
            <motion.div className="max-w-xl space-y-8" variants={stagger} initial="hidden" animate="visible">
              <motion.div className="space-y-5" variants={fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-[#4a9eff]/40" />
                  <span className="text-[10px] font-mono text-[#4a9eff] tracking-[0.25em] uppercase">Offensive Intelligence Engine</span>
                </div>
                <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Graph-native<br /><span className="text-[#4a9eff]">attack surface</span><br />reasoning.
                </h1>
                <p className="text-sm leading-relaxed text-[#888] max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Probabilistic reconnaissance intelligence built on Bayesian inference, spectral graph theory, and decision compression. Reduces 10,000 observations into 3 actionable attack paths.
                </p>
              </motion.div>
              <motion.div className="flex items-center gap-4" variants={fadeUp}>
                <a href="https://github.com/webspoilt/hawk-pentest-platform" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#4a9eff] text-[#0a0a0b] hover:bg-[#3d8ce6] gap-2 text-xs font-mono tracking-wider h-10 px-5">
                    View Repository <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
                <a href="#architecture">
                  <Button variant="outline" className="border-[#2a2a2d] text-[#888] hover:bg-[#151517] hover:text-[#ccc] text-xs font-mono tracking-wider h-10 px-5">Architecture</Button>
                </a>
              </motion.div>
              <motion.div className="flex items-center gap-6 pt-6 border-t border-[#1e1e20]" variants={fadeUp}>
                {[{ l: 'Confidence', v: '0.982' }, { l: 'Variance', v: '±0.04' }, { l: 'Paths', v: '3' }, { l: 'Nodes', v: '20' }].map((m) => (
                  <div key={m.l} className="space-y-1">
                    <div className="text-xs font-mono text-[#4a9eff] tracking-wider">{m.v}</div>
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
      <section id="architecture" className="py-24 border-t border-[#1a1a1c]">
        <div className="container">
          <motion.div className="space-y-16" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            <motion.div className="max-w-lg space-y-4" variants={fadeUp}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-6 bg-[#4a9eff]/30" />
                <span className="text-[9px] font-mono text-[#4a9eff] tracking-[0.3em] uppercase">Architecture</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>How the engine reasons.</h2>
              <p className="text-sm text-[#777] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                HAWK models every target as a graph. Nodes are assets, edges are relationships. Intelligence flows through the topology via Bayesian updates.
              </p>
            </motion.div>
            <motion.div className="p-8 rounded border border-[#1e1e20] bg-[#0e0e10] overflow-x-auto" variants={fadeUp}>
              <pre className="text-[11px] font-mono text-[#555] leading-loose whitespace-pre">
{`       [ TARGET ]
           │
    ┌──────┴──────┐
    │             │
 [ DNS ]     [ SERVICE ] ←── Scrapling (Stealth)
    │             │
    └──────┬──────┘
           │
    [ ASSET GRAPH ] ←── Spectral Partitioning (Laplacian)
           │
    [ EVIDENCE FUSION ] ←── P(H|E) = P(E|H)·P(H) / P(E)
           │
    ┌──────┴──────┐
    │             │
 [ PATH A ]   [ PATH B ] ←── Decision Compression
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
                <motion.div key={p.s} className="p-5 rounded border border-[#1e1e20] bg-[#0e0e10] hover:border-[#4a9eff]/20 transition-colors group"
                  custom={i} variants={fadeIn(i)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <div className="text-[10px] font-mono text-[#4a9eff] tracking-[0.3em] mb-3">{p.s}</div>
                  <h3 className="text-sm font-bold mb-2 group-hover:text-[#4a9eff] transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.t}</h3>
                  <p className="text-xs text-[#666] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{p.d}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Modules (from zai design) */}
      <div id="modules">
        <CoreSections />
      </div>

      {/* Mathematical Foundation — scattered layout */}
      <section id="research" className="py-24 border-t border-[#1a1a1c] relative overflow-hidden">
        <div className="container relative z-10">
          <motion.div className="space-y-16" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            <motion.div className="max-w-lg space-y-4" variants={fadeUp}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-6 bg-[#4a9eff]/30" />
                <span className="text-[9px] font-mono text-[#4a9eff] tracking-[0.3em] uppercase">Research</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Mathematical foundation.</h2>
              <p className="text-sm text-[#777] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Every conclusion is grounded in formal mathematics. No heuristic guesses without traceable provenance.
              </p>
            </motion.div>

            {/* Scattered formula cards */}
            <div className="relative min-h-[500px]">
              {/* Main 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { t: 'Bayesian Evidence Fusion', f: 'P(H|E) = P(E|H) · P(H) / P(E)', d: 'Multi-source probabilistic reasoning with uncertainty propagation (σ²) for attack path validation.', a: 'Posterior confidence with variance tracking' },
                  { t: 'Graph Laplacian Spectrum', f: 'L = D − A,  λᵢ ∈ spectrum(L)', d: 'Spectral partitioning of the asset graph into functionally coupled trust zones and infrastructure clusters.', a: 'Fiedler vector for graph bisection' },
                  { t: 'Information Entropy', f: 'H(X) = −Σ p(xᵢ) log₂ p(xᵢ)', d: 'Shannon entropy of response payloads to detect anomalous secrets, debug artifacts, and structural signatures.', a: 'Anomaly detection via entropy deviation' },
                ].map((p, i) => (
                  <motion.div key={p.t} className="p-6 rounded border border-[#1e1e20] bg-[#0e0e10] hover:border-[#4a9eff]/15 transition-colors group"
                    custom={i} variants={fadeIn(i)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <h3 className="text-sm font-bold mb-4 group-hover:text-[#4a9eff] transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.t}</h3>
                    <div className="p-3 rounded bg-[#0a0a0b] border border-[#1a1a1c] mb-4">
                      <code className="text-xs font-mono text-[#4a9eff]/80 break-all">{p.f}</code>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{p.d}</p>
                    <div className="pt-3 border-t border-[#1a1a1c]">
                      <span className="text-[9px] font-mono text-[#444] italic">{p.a}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Scattered ambient formulas */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[
                  { text: 'V*(s) = maxₐ Σ P(s′|s,a)[R + γV*(s′)]', top: '5%', right: '2%', rotate: '-2deg' },
                  { text: 'C_B(v) = Σ σ(s,t|v) / σ(s,t)', bottom: '10%', left: '5%', rotate: '1deg' },
                  { text: '∂Ω/∂t = ∫K(x,y)·φ(y)dΓ(y)', top: '40%', right: '10%', rotate: '-1deg' },
                  { text: 'G = (V, E, w) | w: E → ℝ⁺', bottom: '25%', right: '20%', rotate: '2deg' },
                ].map((f, i) => (
                  <motion.div key={i} className="absolute text-[9px] font-mono text-[#4a9eff]" style={{ top: f.top, bottom: f.bottom, left: f.left, right: f.right, transform: `rotate(${f.rotate})` }}
                    initial={{ opacity: 0 }} whileInView={{ opacity: 0.08 }} viewport={{ once: true }} transition={{ delay: i * 0.3 + 0.5 }}>
                    {f.text}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Research annotation footer */}
            <div className="flex items-center justify-center gap-4">
              <div className="hawk-section-line w-32" />
              <div className="text-center">
                <p className="text-[9px] font-mono text-[#4a9eff]/10">∂Ω/∂t = ∫K(x,y)·φ(y)dΓ(y) — surface evolution operator</p>
                <p className="text-[8px] font-mono text-[#d4a574]/8 mt-1">G = (V, E, w) | w: E → ℝ⁺ | ∀ path p: Σw(e) → min</p>
              </div>
              <div className="hawk-section-line w-32" style={{ background: 'linear-gradient(90deg, rgba(74,158,255,0.3), rgba(74,158,255,0.05), transparent)' }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#1a1a1c]">
        <div className="container">
          <motion.div className="max-w-lg space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Built for operators who care about ground truth.</h2>
              <p className="text-sm text-[#777] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>HAWK is an experimental prototype. Open source, graph-native, and mathematically grounded.</p>
            </motion.div>
            <motion.div className="flex gap-4" variants={fadeUp}>
              <a href="https://github.com/webspoilt/hawk-pentest-platform" target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#4a9eff] text-[#0a0a0b] hover:bg-[#3d8ce6] gap-2 text-xs font-mono tracking-wider h-10 px-5">View on GitHub <ArrowRight className="w-3.5 h-3.5" /></Button>
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
              <div className="w-5 h-5 rounded-sm bg-[#4a9eff] flex items-center justify-center"><Radar className="w-3 h-3 text-[#0a0a0b]" /></div>
              <span className="text-xs font-mono text-[#555]">HAWK — Offensive Intelligence Engine</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/webspoilt/hawk-pentest-platform" className="text-[10px] font-mono text-[#555] hover:text-[#888] transition-colors tracking-wider uppercase">GitHub</a>
              <span className="text-[10px] font-mono text-[#333]">by zeroday</span>
              <span className="text-[10px] font-mono text-[#333]">v3.5.1</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Telemetry Bar */}
      <TelemetryBar />
    </div>
  );
}
