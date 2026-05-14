import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * CoreSections: Adversarial Systems Modules
 * 
 * Visualization of core intelligence layers:
 * - Bayesian Attack Graphs
 * - Shannon Entropy Mapping
 * - Laplacian Topology
 * - Temporal Drift Analysis
 */

// SVG Instrumental Visualizations
function BayesianMiniGraph({ color }: { color: string }) {
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    x: 40 + Math.sin(i * 2) * 25,
    y: 40 + Math.cos(i * 2.5) * 20,
    r: 1 + Math.random() * 2
  }));
  
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible">
      {nodes.map((n1, i) => nodes.map((n2, j) => {
        if (j <= i) return null;
        const d = Math.sqrt((n2.x - n1.x) ** 2 + (n2.y - n1.y) ** 2);
        if (d > 35) return null;
        return (
          <motion.line 
            key={`e-${i}-${j}`} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} 
            stroke={color} strokeWidth="0.4" strokeOpacity={0.15}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.15 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          />
        );
      }))}
      {nodes.map((n, i) => (
        <circle key={`n-${i}`} cx={n.x} cy={n.y} r={n.r} fill={color} fillOpacity={0.3 + (i / 8) * 0.4} />
      ))}
    </svg>
  );
}

function SpectralEntropy({ color }: { color: string }) {
  const bars = [0.8, 0.45, 0.92, 0.3, 0.67, 0.55, 0.78, 0.2, 0.85, 0.42];
  return (
    <svg viewBox="0 0 90 45" className="w-full h-full">
      {bars.map((v, i) => (
        <motion.rect 
          key={i} x={5 + i * 8.5} y={40 - v * 35} width={4} height={v * 35} 
          fill={color} fillOpacity={0.1 + v * 0.3} rx={0.5}
          animate={{ height: [v * 35, (v * 0.8) * 35, v * 35] }}
          transition={{ duration: 2 + i, repeat: Infinity }}
        />
      ))}
      <line x1="0" y1="40" x2="90" y2="40" stroke={color} strokeWidth="0.5" strokeOpacity="0.1" />
    </svg>
  );
}

function LatentTopology({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 48" className="w-full h-full">
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 6 }).map((_, c) => (
          <circle key={`${r}-${c}`} cx={c * 10 + 5} cy={r * 10 + 5} 
            r={1 + Math.random() * 2}
            fill={color} fillOpacity={Math.sin(r + c) * 0.3 + 0.3} />
        ))
      )}
      <path d="M 5 5 Q 32 24 59 43" stroke={color} strokeWidth="0.3" fill="none" strokeOpacity="0.2" strokeDasharray="2 2" />
    </svg>
  );
}

function Metric({ label, value, unit, color = '#4a9eff' }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="telemetry-text text-[#555]">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-sm tabular-nums" style={{ color }}>{value}</span>
        {unit && <span className="telemetry-text text-[#555]">{unit}</span>}
      </div>
    </div>
  );
}

function SectionCard({ index, id, title, subtitle, children, viz }: {
  index: number; id: string; title: string; subtitle: string; children: React.ReactNode; viz: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((e) => { if (e[0].isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`hawk-card p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 80}ms` }}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="telemetry-text text-[#4a9eff] opacity-60 font-bold">{id}</span>
            <div className="h-px bg-[#1e1e20] flex-1" />
          </div>
          <h3 className="text-[#e0e0e0] text-base font-semibold tracking-wide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{title}</h3>
          <p className="telemetry-text text-[#666] mt-1 leading-relaxed lowercase">{subtitle}</p>
        </div>
        <div className="w-20 h-20 opacity-80 ml-4 flex-shrink-0">{viz}</div>
      </div>
      <div className="space-y-4">{children}</div>
      <div className="mt-6 h-px bg-gradient-to-r from-[#1e1e20] via-transparent to-transparent" />
    </div>
  );
}

export function CoreSections() {
  const sections = [
    {
      id: 'BAM-01', title: 'Bayesian Attack Modeling', subtitle: 'Probabilistic exploit-chain inference matrix',
      viz: <BayesianMiniGraph color="#4a9eff" />,
      metrics: [
        { label: 'Asset Nodes', value: '2,847', color: '#4a9eff' },
        { label: 'Mean Confidence', value: '0.87', color: '#4a9eff' },
        { label: 'Latent Paths', value: '341', color: '#d4a574' },
        { label: 'Critical Edges', value: '89', color: '#ff4444' },
      ],
      status: 'active' as const, statusText: 'P(compromise | context) = 0.87',
    },
    {
      id: 'SEM-02', title: 'Shannon Entropy Mapping', subtitle: 'Spectral instability distribution across assets',
      viz: <SpectralEntropy color="#d4a574" />,
      metrics: [
        { label: 'Mean Entropy', value: '2.84', unit: 'bits', color: '#d4a574' },
        { label: 'Max Delta', value: '4.21', unit: 'bits', color: '#ff4444' },
        { label: 'Low-H Assets', value: '23', color: '#4a9eff' },
        { label: 'Compression', value: '0.67', color: '#4a9eff' },
      ],
      status: 'active' as const, statusText: 'Entropy variance σ = 0.041',
    },
    {
      id: 'LTA-03', title: 'Laplacian Topology Analysis', subtitle: 'Graph spectral gap & trust zone partitioning',
      viz: <LatentTopology color="#4a9eff" />,
      metrics: [
        { label: 'Spectral Gap', value: '0.142', color: '#4a9eff' },
        { label: 'Trust Clusters', value: '12', color: '#4a9eff' },
        { label: 'Silhouette Index', value: '0.82', color: '#4a9eff' },
        { label: 'Drift Vectors', value: '8', color: '#d4a574' },
      ],
      status: 'active' as const, statusText: 'λ₂(L) convergence detected — stable',
    },
    {
      id: 'BRE-04', title: 'Bellman Recon Engine', subtitle: 'Optimized trajectory routing for recon yield',
      viz: <LatentTopology color="#00d9ff" />,
      metrics: [
        { label: 'State Space', value: '1.2M', color: '#00d9ff' },
        { label: 'γ Discount', value: '0.95', color: '#00d9ff' },
        { label: 'V*(s) Yield', value: '0.94', color: '#4a9eff' },
        { label: 'Active Routes', value: '14', color: '#ff4444' },
      ],
      status: 'active' as const, statusText: 'Bellman convergence achieved — optimizing trajectory',
    },
  ];

  return (
    <section className="py-24 border-t border-[#1a1a1c] bg-[#050506]">
      <div className="container">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px bg-[#1e1e20] flex-1" />
          <span className="telemetry-text text-[#555] tracking-[0.3em]">OPERATIONAL_MODULES</span>
          <div className="h-px bg-gradient-to-r from-[#1e1e20] to-transparent flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((s, i) => (
            <SectionCard key={s.id} index={i} id={s.id} title={s.title} subtitle={s.subtitle} viz={s.viz}>
              <div className="grid grid-cols-2 gap-4">
                {s.metrics.map((m) => <Metric key={m.label} {...m} />)}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className={`status-dot status-${s.status}`} />
                <span className="telemetry-text text-[#444] lowercase">{s.statusText}</span>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </section>
  );
}
