import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import { MathAnnotations, MathAnnotation } from './MathAnnotations';

/**
 * HeroGraph: Restored "Big Bang" Intelligence Expansion
 * 
 * 1. Clump (0s): Nodes start in a dense central cluster.
 * 2. Expansion (0s - 20s): Force simulation pushes nodes apart gradually.
 * 3. Persistence (20s+): Graph stays expanded with high-frequency organic jitter.
 */

interface Node {
  id: string;
  name: string;
  type: 'domain' | 'api' | 'cloud' | 'cred' | 'vuln' | 'auth';
  val: number;
  confidence: number;
  entropy: number;
  cluster: number;
  group: string;
  x?: number;
  y?: number;
}

const colors = {
  blue: '#6366f1',
  teal: '#00d9ff',
  amber: '#d4a574',
};

export function HeroGraph() {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [annotations] = useState<MathAnnotation[]>([]);

  // Initialize nodes at (0,0) with minor random jitter for a stable "explosion"
  const data = useMemo(() => {
    const nodes: Node[] = ([
      { id: '0', name: 'api.lattice9.io', type: 'api', val: 12, confidence: 0.95, entropy: 0.1, cluster: 0, group: 'recon' },
      { id: '1', name: 'auth.v5', type: 'auth', val: 15, confidence: 0.98, entropy: 0.05, cluster: 2, group: 'auth' },
      { id: '2', name: 'lattice-db-01', type: 'cloud', val: 10, confidence: 0.92, entropy: 0.08, cluster: 3, group: 'infra' },
      { id: '3', name: 'os-intelligence', type: 'cred', val: 8, confidence: 0.4, entropy: 0.8, cluster: 2, group: 'auth' },
      { id: '4', name: 'EXPLOIT-L9-X', type: 'vuln', val: 9, confidence: 0.15, entropy: 0.9, cluster: 1, group: 'exploit' },
      { id: '5', name: 'l9-ingress-01', type: 'cloud', val: 7, confidence: 0.88, entropy: 0.15, cluster: 3, group: 'infra' },
      { id: '6', name: 's3://l9-evidence', type: 'cloud', val: 6, confidence: 0.7, entropy: 0.4, cluster: 3, group: 'infra' },
      { id: '7', name: 'l9-signing-key', type: 'cred', val: 8, confidence: 0.9, entropy: 0.2, cluster: 2, group: 'auth' },
      { id: '8', name: 'graph-reasoning', type: 'vuln', val: 7, confidence: 0.3, entropy: 0.7, cluster: 1, group: 'exploit' },
      { id: '9', name: 'internal-mesh', type: 'domain', val: 6, confidence: 0.9, entropy: 0.1, cluster: 0, group: 'recon' },
      { id: '10', name: 'reasoning-svc', type: 'cloud', val: 7, confidence: 0.8, entropy: 0.3, cluster: 3, group: 'infra' },
      { id: '11', name: 'advisor-agent', type: 'auth', val: 6, confidence: 0.85, entropy: 0.2, cluster: 2, group: 'auth' },
      { id: '12', name: 'l9-intelligence', type: 'vuln', val: 9, confidence: 0.1, entropy: 0.95, cluster: 1, group: 'exploit' },
      { id: '13', name: 'l9-collection', type: 'api', val: 5, confidence: 0.5, entropy: 0.6, cluster: 0, group: 'recon' },
      { id: '14', name: 'l9-exposure', type: 'domain', val: 4, confidence: 0.92, entropy: 0.1, cluster: 0, group: 'recon' },
    ] as const).map(n => ({
      ...n,
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5
    })) as Node[];

    const links = [
      { source: '0', target: '1' }, { source: '1', target: '7' }, { source: '1', target: '3' },
      { source: '0', target: '13' }, { source: '13', target: '8' }, { source: '8', target: '12' },
      { source: '4', target: '5' }, { source: '5', target: '9' }, { source: '9', target: '10' },
      { source: '7', target: '11' }, { source: '2', target: '6' }, { source: '10', target: '14' },
    ];

    return { nodes, links };
  }, []);

  useEffect(() => {
    // Robust simulation startup
    const fg = fgRef.current;
    if (fg) {
      try {
        if (fg.d3Force) {
          fg.d3Force('charge')?.strength(-140);
          fg.d3Force('link')?.distance(110);
          fg.d3AlphaTarget(0.1); 
          fg.d3AlphaDecay(0.005);
          fg.d3ReheatSimulation();
        }
      } catch (e) {
        console.warn("D3 forces not yet available", e);
      }
    }
  }, []);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!node || typeof node.x !== 'number' || !isFinite(node.x)) return;
    
    const time = performance.now() / 1000;
    const size = node.val || 5;
    
    // High-frequency organic jitter
    const jitter = (node.entropy || 0.2) * 1.5;
    const nx = node.x + (Math.random() - 0.5) * jitter;
    const ny = node.y + (Math.random() - 0.5) * jitter;

    const pulse = Math.sin(time * 3 + (parseInt(node.id) || 0)) * 0.5 + 0.5;
    const color = colors.blue;

    // Halos
    ctx.beginPath();
    ctx.arc(nx, ny, size * (1.3 + pulse * 0.2), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99, 102, 241, ${0.03 + pulse * 0.05})`;
    ctx.fill();

    // Orb
    const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, size);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.2, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(nx, ny, size, 0, Math.PI * 2); ctx.fill();

    // Labels
    if (globalScale > 0.6) {
      ctx.font = `${6 / globalScale}px "IBM Plex Mono"`;
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + pulse * 0.1})`;
      ctx.fillText(node.name.toUpperCase(), nx, ny + size + 10 / globalScale);
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#000000] overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={1}
        linkColor={() => 'rgba(99, 102, 241, 0.04)'}
        linkWidth={0.5}
        nodeCanvasObject={nodeCanvasObject}
        onNodeHover={setHoverNode}
      />

      <MathAnnotations annotations={annotations} containerRef={containerRef} />

      {/* Floating Labels */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-5 pointer-events-none z-10">
        {['L9_OS', 'INTEL', 'GRAPH', 'REASON'].map((l) => (
          <div key={l} className="flex items-center gap-3 justify-end opacity-40">
            <span className="text-[10px] font-mono text-[#555] tracking-[0.4em] uppercase">{l}</span>
            <div className="w-1 h-1 rounded-none bg-[#6366f1]" />
          </div>
        ))}
      </div>

      {/* Background Equation */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] select-none flex items-center justify-center">
        <div className="text-[25vw] font-mono font-bold tracking-tighter" style={{ filter: 'blur(10px)' }}>L=D-A</div>
      </div>
    </div>
  );
}
