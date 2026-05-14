import { useEffect, useRef, useState } from 'react';

// SVG micro-visualizations
function MiniGraph({ color }: { color: string }) {
  const nodes = Array.from({ length: 12 }, (_, i) => ({
    x: 10 + Math.sin(i * 2.4) * 30 + Math.cos(i * 1.7) * 15,
    y: 10 + Math.cos(i * 1.8) * 30 + Math.sin(i * 3.1) * 10,
  }));
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      {nodes.map((n1, i) => nodes.map((n2, j) => {
        if (j <= i) return null;
        const d = Math.sqrt((n2.x - n1.x) ** 2 + (n2.y - n1.y) ** 2);
        return d < 25 ? <line key={`e-${i}-${j}`} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke={color} strokeWidth="0.3" strokeOpacity={0.2} /> : null;
      }))}
      {nodes.map((n, i) => <circle key={`n-${i}`} cx={n.x} cy={n.y} r={1.5} fill={color} fillOpacity={0.5 + (i / 12) * 0.3} />)}
    </svg>
  );
}

function EntropyBars({ color }: { color: string }) {
  const bars = [0.8, 0.45, 0.92, 0.3, 0.67, 0.55, 0.78, 0.2, 0.85, 0.42];
  return (
    <svg viewBox="0 0 90 45" className="w-full h-full">
      {bars.map((v, i) => (
        <rect key={i} x={5 + i * 8.5} y={40 - v * 35} width={6} height={v * 35} fill={color} fillOpacity={0.1 + v * 0.25} rx={0.5} />
      ))}
      <text x={45} y={44} textAnchor="middle" fill={color} fontSize="3" fontFamily="monospace" opacity="0.2">H(sᵢ)</text>
    </svg>
  );
}

function HeatmapGrid({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 48" className="w-full h-full">
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => (
          <rect key={`${r}-${c}`} x={c * 8 + 0.5} y={r * 8 + 0.5} width={7} height={7} rx={0.5}
            fill={color} fillOpacity={Math.sin(r * 1.2 + c * 0.8) * 0.25 + 0.25} />
        ))
      )}
    </svg>
  );
}

function TimelineViz({ color }: { color: string }) {
  const pts = Array.from({ length: 12 }, (_, i) => ({
    x: 5 + i * 7, y: 20 + Math.sin(i * 0.8) * 12 + Math.cos(i * 1.3) * 8, diff: i % 3 === 0,
  }));
  return (
    <svg viewBox="0 0 90 50" className="w-full h-full">
      <line x1={5} y1={35} x2={85} y2={35} stroke={color} strokeWidth="0.3" strokeOpacity="0.2" />
      {pts.map((p, i) => (
        <g key={i}>
          {p.diff && <rect x={p.x - 2} y={10} width={4} height={25} fill={color} fillOpacity="0.06" rx={1} />}
          <circle cx={p.x} cy={p.y} r={p.diff ? 2 : 1.2} fill={color} fillOpacity={p.diff ? 0.7 : 0.3} />
          {i > 0 && <line x1={pts[i - 1].x} y1={pts[i - 1].y} x2={p.x} y2={p.y} stroke={color} strokeWidth="0.4" strokeOpacity="0.2" />}
        </g>
      ))}
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
    <div ref={ref} className={`hawk-card p-5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 80}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="telemetry-text text-[#4a9eff] opacity-60">{id}</span>
            <div className="hawk-section-line flex-1" />
          </div>
          <h3 className="text-[#e0e0e0] text-sm font-medium tracking-wide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{title}</h3>
          <p className="telemetry-text text-[#555] mt-0.5">{subtitle}</p>
        </div>
        <div className="w-16 h-16 opacity-60 ml-3 flex-shrink-0">{viz}</div>
      </div>
      <div className="space-y-3">{children}</div>
      <div className="mt-4 hawk-section-line" />
    </div>
  );
}

// Exported section components
export function CoreSections() {
  const sections = [
    {
      id: 'ASI-01', title: 'Attack Surface Intelligence', subtitle: 'Probabilistic surface topology mapping',
      viz: <MiniGraph color="#4a9eff" />,
      metrics: [
        { label: 'Surface nodes', value: '2,847', color: '#4a9eff' },
        { label: 'Coverage', value: '94.2', unit: '%', color: '#4a9eff' },
        { label: 'Latent paths', value: '341', color: '#d4a574' },
        { label: 'Critical edges', value: '89', color: '#c44040' },
      ],
      status: 'active' as const, statusText: 'Bayesian propagation active — confidence α = 0.87',
    },
    {
      id: 'PEC-02', title: 'Probabilistic Exploit Correlation', subtitle: 'Bayesian exploit-chain inference matrix',
      viz: <HeatmapGrid color="#d4a574" />,
      metrics: [
        { label: 'Correlations', value: '1,204', color: '#d4a574' },
        { label: 'Mean confidence', value: '0.68', color: '#d4a574' },
        { label: 'Chain depth', value: '6.3', unit: 'avg', color: '#4a9eff' },
        { label: 'Active chains', value: '23', color: '#c44040' },
      ],
      status: 'active' as const, statusText: 'P(exploit|context) ≥ 0.71 — 23 chains above threshold',
    },
    {
      id: 'TID-03', title: 'Temporal Infrastructure Diffing', subtitle: 'Δ-state detection across temporal windows',
      viz: <TimelineViz color="#4a9eff" />,
      metrics: [
        { label: 'Snapshots', value: '342', color: '#4a9eff' },
        { label: 'Delta events', value: '1,847', color: '#4a9eff' },
        { label: 'Window', value: '72', unit: 'hr', color: '#4a9eff' },
        { label: 'Drift rate', value: '0.034', unit: '/hr', color: '#d4a574' },
      ],
      status: 'warning' as const, statusText: '3 structural deltas detected in last 12hr window',
    },
    {
      id: 'GTR-04', title: 'Graph-Based Threat Reasoning', subtitle: 'Subgraph isomorphism & path inference',
      viz: <MiniGraph color="#4a9eff" />,
      metrics: [
        { label: 'Threat subgraphs', value: '156', color: '#4a9eff' },
        { label: 'Iso. matches', value: '34', color: '#4a9eff' },
        { label: 'Path entropy', value: '3.42', unit: 'bits', color: '#d4a574' },
        { label: 'Critical paths', value: '7', color: '#c44040' },
      ],
      status: 'critical' as const, statusText: '7 high-priority attack paths — λ₂(L) = 0.142',
    },
    {
      id: 'IEM-05', title: 'Infrastructure Entropy Mapping', subtitle: 'Shannon entropy distribution across assets',
      viz: <EntropyBars color="#d4a574" />,
      metrics: [
        { label: 'Mean H(X)', value: '2.84', unit: 'bits', color: '#d4a574' },
        { label: 'Max entropy', value: '4.21', unit: 'bits', color: '#c44040' },
        { label: 'Low-entropy', value: '23', unit: 'assets', color: '#4a9eff' },
        { label: 'Compression', value: '0.67', color: '#4a9eff' },
      ],
      status: 'active' as const, statusText: 'Entropy distribution within σ — 23 assets H < 1.0',
    },
    {
      id: 'ESA-06', title: 'Embedding Space Analysis', subtitle: 'Latent representation clustering & drift',
      viz: <HeatmapGrid color="#4a9eff" />,
      metrics: [
        { label: 'Embedding dim', value: '256', color: '#4a9eff' },
        { label: 'Clusters', value: '12', color: '#4a9eff' },
        { label: 'Silhouette', value: '0.82', color: '#4a9eff' },
        { label: 'Drift vectors', value: '8', color: '#d4a574' },
      ],
      status: 'active' as const, statusText: 'Latent space stable — 8 drift vectors under observation',
    },
  ];

  return (
    <section className="py-24 border-t border-[#1a1a1c]">
      <div className="container">
        <div className="flex items-center gap-4 mb-10">
          <div className="hawk-section-line flex-1" />
          <span className="telemetry-text text-[#555]">CORE INTERFACE MODULES</span>
          <div className="hawk-section-line flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(74,158,255,0.05), rgba(74,158,255,0.3))' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((s, i) => (
            <SectionCard key={s.id} index={i} id={s.id} title={s.title} subtitle={s.subtitle} viz={s.viz}>
              <div className="grid grid-cols-2 gap-3">
                {s.metrics.map((m) => <Metric key={m.label} {...m} />)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`status-dot status-${s.status}`} />
                <span className="telemetry-text text-[#555]">{s.statusText}</span>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </section>
  );
}
