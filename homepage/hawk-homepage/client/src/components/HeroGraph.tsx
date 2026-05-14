import { useEffect, useRef, useMemo, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import { MathAnnotations, MathAnnotation } from './MathAnnotations';

/**
 * HeroGraph: Adversarial Intelligence Operating Environment
 * 
 * A mathematically-driven interface using D3 force simulation.
 * Visualizes:
 * - Bayesian Attack Propagation (Inference-driven edges)
 * - Shannon Entropy Fields (Visual distortion/noise)
 * - Spectral Topology (Laplacian clustering)
 * - Bellman Trajectory Optimization (RL-style pathing)
 */

interface Node {
  id: string;
  name: string;
  type: 'domain' | 'api' | 'cloud' | 'cred' | 'vuln' | 'auth';
  val: number; // size
  confidence: number;
  entropy: number;
  cluster: number;
  group: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string | any;
  target: string | any;
  probability: number;
  type: 'exploit' | 'trust' | 'lateral' | 'temporal';
  equation?: string;
}

const colors = {
  blue: '#4a9eff',
  teal: '#00d9ff',
  purple: '#8c52ff',
  cyan: '#00f2ff',
  amber: '#d4a574',
  red: '#ff4444'
};

export function HeroGraph() {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [annotations, setAnnotations] = useState<MathAnnotation[]>([]);

  const data = useMemo(() => {
    const nodes: Node[] = [
      { id: '0', name: 'api.hawk.io', type: 'api', val: 12, confidence: 0.95, entropy: 0.1, cluster: 0, group: 'recon' },
      { id: '1', name: 'auth.v1', type: 'auth', val: 15, confidence: 0.98, entropy: 0.05, cluster: 2, group: 'auth' },
      { id: '2', name: 'prod-db-cluster', type: 'cloud', val: 10, confidence: 0.92, entropy: 0.08, cluster: 3, group: 'infra' },
      { id: '3', name: 'admin-creds', type: 'cred', val: 8, confidence: 0.4, entropy: 0.8, cluster: 2, group: 'auth' },
      { id: '4', name: 'CVE-2024-X1', type: 'vuln', val: 9, confidence: 0.15, entropy: 0.9, cluster: 1, group: 'exploit' },
      { id: '5', name: 'edge-lb-01', type: 'cloud', val: 7, confidence: 0.88, entropy: 0.15, cluster: 3, group: 'infra' },
      { id: '6', name: 's3://evidence', type: 'cloud', val: 6, confidence: 0.7, entropy: 0.4, cluster: 3, group: 'infra' },
      { id: '7', name: 'jwt-sign-key', type: 'cred', val: 8, confidence: 0.9, entropy: 0.2, cluster: 2, group: 'auth' },
      { id: '8', name: 'ssrf-entry', type: 'vuln', val: 7, confidence: 0.3, entropy: 0.7, cluster: 1, group: 'exploit' },
      { id: '9', name: 'internal-net', type: 'domain', val: 6, confidence: 0.9, entropy: 0.1, cluster: 0, group: 'recon' },
      { id: '10', name: 'user-db', type: 'cloud', val: 7, confidence: 0.8, entropy: 0.3, cluster: 3, group: 'infra' },
      { id: '11', name: 'oauth-proxy', type: 'auth', val: 6, confidence: 0.85, entropy: 0.2, cluster: 2, group: 'auth' },
      { id: '12', name: 'shell-access', type: 'vuln', val: 9, confidence: 0.1, entropy: 0.95, cluster: 1, group: 'exploit' },
      { id: '13', name: 'metadata-svc', type: 'api', val: 5, confidence: 0.5, entropy: 0.6, cluster: 0, group: 'recon' },
      { id: '14', name: 'config-repo', type: 'domain', val: 4, confidence: 0.92, entropy: 0.1, cluster: 0, group: 'recon' },
    ];

    const links: Link[] = [
      { source: '0', target: '1', probability: 0.9, type: 'trust', equation: 'P(H|E) = \\frac{P(E|H)P(H)}{P(E)}' },
      { source: '1', target: '7', probability: 0.8, type: 'trust', equation: '\\lambda_2(L) > 0' },
      { source: '1', target: '3', probability: 0.4, type: 'exploit', equation: 'H(X) = -\\sum p(x) \\log p(x)' },
      { source: '0', target: '13', probability: 0.7, type: 'trust' },
      { source: '13', target: '8', probability: 0.85, type: 'exploit', equation: 'V^*(s) = \\max_a [R + \\gamma V^*]' },
      { source: '8', target: '12', probability: 0.9, type: 'exploit' },
      { source: '12', target: '2', probability: 0.3, type: 'lateral' },
      { source: '4', target: '5', probability: 0.75, type: 'exploit' },
      { source: '5', target: '9', probability: 0.6, type: 'lateral' },
      { source: '9', target: '10', probability: 0.5, type: 'lateral' },
      { source: '7', target: '11', probability: 0.4, type: 'temporal' },
      { source: '2', target: '6', probability: 0.3, type: 'temporal' },
      { source: '10', target: '14', probability: 0.2, type: 'temporal' },
    ];

    const bellmanPath = ['0', '13', '8', '12', '2'];

    return { nodes, links, bellmanPath };
  }, []);

  // Update annotations based on graph state
  useEffect(() => {
    if (!fgRef.current) return;
    
    const interval = setInterval(() => {
      const graphData = fgRef.current.getGraphData();
      if (!graphData) return;
      
      const internalNodes = graphData.nodes;
      const internalLinks = graphData.links;
      
      const newAnns: MathAnnotation[] = [];
      
      // Randomly annotate active links
      internalLinks.forEach((link: any) => {
        if (link.equation && Math.random() > 0.6) {
          const s = link.source;
          const d = link.target;
          if (s && d && !isNaN(s.x) && !isNaN(d.x)) {
            const midX = (s.x + d.x) / 2;
            const midY = (s.y + d.y) / 2;
            
            const screenPos = fgRef.current.graph2ScreenPos(midX, midY);
            if (screenPos && !isNaN(screenPos.x)) {
              newAnns.push({
                id: `link-${link.index || Math.random()}`,
                latex: link.equation,
                x: screenPos.x,
                y: screenPos.y,
                opacity: 0.6,
                scale: 0.7,
                color: colors.cyan
              });
            }
          }
        }
      });

      // Annotate uncertain nodes
      internalNodes.forEach((node: any) => {
        if (node.entropy > 0.6 && Math.random() > 0.5) {
          if (!isNaN(node.x) && !isNaN(node.y)) {
            const screenPos = fgRef.current.graph2ScreenPos(node.x, node.y);
            if (screenPos && !isNaN(screenPos.x)) {
              newAnns.push({
                id: `node-${node.id}`,
                latex: `H(X) = ${(node.entropy || 0).toFixed(2)}`,
                x: screenPos.x,
                y: screenPos.y - 20,
                opacity: 0.8,
                color: colors.amber
              });
            }
          }
        }
      });

      setAnnotations(newAnns);
    }, 3000);
    return () => clearInterval(interval);
  }, [data]);

  const getClusterColor = (c: number) => {
    const clusterColors = [colors.blue, colors.teal, colors.purple, colors.cyan];
    return clusterColors[(c || 0) % clusterColors.length];
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0b] overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={1}
        nodeLabel={node => node.name}
        linkColor={() => 'rgba(255,255,255,0.05)'}
        linkWidth={1}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.3}
        
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const time = performance.now() / 1000;
          const c = getClusterColor(node.cluster);
          const size = node.val || 5;
          
          if (node.entropy > 0.6) {
            // Turbulence/Entropy field
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = `rgba(212, 165, 116, ${0.2 + Math.random() * 0.2})`;
            ctx.arc(node.x, node.y, size * (1.5 + Math.sin(time * 10) * 0.2), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Stability Rings
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(74, 158, 255, ${0.1 + Math.sin(time * 2 + (parseInt(node.id) || 0)) * 0.05})`;
          ctx.stroke();

          // Core node
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size);
          gradient.addColorStop(0, c);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.fill();

          // Label and telemetry
          if (globalScale > 1.5) {
            ctx.font = `${8 / globalScale}px "IBM Plex Mono"`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText((node.name || '').toUpperCase(), node.x, node.y + size + 10 / globalScale);
            
            ctx.fillStyle = colors.cyan;
            ctx.fillText(`P=${(node.confidence || 0).toFixed(2)}`, node.x, node.y - size - 5 / globalScale);
          }
        }}

        linkCanvasObject={(link: any, ctx, globalScale) => {
          const time = performance.now() / 1000;
          const start = link.source;
          const end = link.target;
          if (typeof start !== 'object' || typeof end !== 'object') return;

          // Base line
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = link.type === 'exploit' ? 'rgba(255, 68, 68, 0.15)' : 'rgba(74, 158, 255, 0.1)';
          ctx.lineWidth = 1 / globalScale;
          ctx.stroke();

          // Confidence pulse
          if (link.probability > 0.5) {
            const progress = (time * 0.5 + ((link.index || 0) % 10) / 10) % 1;
            const px = start.x + (end.x - start.x) * progress;
            const py = start.y + (end.y - start.y) * progress;
            
            ctx.beginPath();
            ctx.arc(px, py, 1 / globalScale, 0, Math.PI * 2);
            ctx.fillStyle = link.type === 'exploit' ? '#ff4444' : colors.cyan;
            ctx.fill();
          }
        }}

        onRenderFramePre={(ctx, globalScale) => {
          const time = performance.now() / 1000;
          const graphData = fgRef.current?.getGraphData();
          if (!graphData) return;

          const nodes = graphData.nodes;
          const path = data.bellmanPath;
          
          // Render Bellman Optimal Path
          for (let i = 0; i < path.length - 1; i++) {
            const n1 = nodes.find((n: any) => n.id === path[i]);
            const n2 = nodes.find((n: any) => n.id === path[i + 1]);
            
            if (n1 && n2 && !isNaN(n1.x) && !isNaN(n2.x)) {
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = `rgba(0, 217, 255, ${0.1 + Math.sin(time * 3) * 0.05})`;
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }
          }

          // Ghost Agent traversing the optimal path
          if (path.length > 1) {
            const totalDuration = 10;
            const progressTotal = (time % totalDuration) / totalDuration;
            const segmentCount = path.length - 1;
            const segmentIndex = Math.floor(progressTotal * segmentCount);
            const segmentProgress = (progressTotal * segmentCount) % 1;
            
            const n1 = nodes.find((n: any) => n.id === path[segmentIndex]);
            const n2 = nodes.find((n: any) => n.id === path[segmentIndex + 1]);
            
            if (n1 && n2 && !isNaN(n1.x) && !isNaN(n2.x)) {
              const ax = n1.x + (n2.x - n1.x) * segmentProgress;
              const ay = n1.y + (n2.y - n1.y) * segmentProgress;
              
              ctx.fillStyle = colors.teal;
              ctx.shadowBlur = 15;
              ctx.shadowColor = colors.teal;
              ctx.beginPath(); ctx.arc(ax, ay, 2 / globalScale, 0, Math.PI * 2); ctx.fill();
              ctx.shadowBlur = 0;
              
              ctx.font = `${5 / globalScale}px "IBM Plex Mono"`;
              ctx.fillStyle = `rgba(0, 217, 255, ${0.4 + Math.sin(time * 5) * 0.2})`;
              ctx.fillText('OPTIMAL_RECON_TRAJECTORY', ax + 8 / globalScale, ay);
            }
          }
        }}
        
        onNodeHover={setHoverNode}
      />

      <MathAnnotations annotations={annotations} containerRef={containerRef} />

      <div className="absolute top-20 right-6 w-56 space-y-4 pointer-events-none">
        <div className="p-4 border border-[#1e1e20] bg-[#0a0a0b]/90 backdrop-blur-md rounded shadow-2xl">
          <div className="text-[10px] font-mono text-[#555] mb-3 flex justify-between items-center">
            <span>TOPOLOGY_METRICS_v4.1</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#4a9eff] animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-mono text-[#444]">L_EIGENVALUE_λ₂:</span>
              <span className="text-[10px] font-mono text-[#4a9eff]">0.482</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-mono text-[#444]">SHANNON_H(X):</span>
              <span className="text-[10px] font-mono text-[#d4a574]">2.84 bits</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-mono text-[#444]">BELLMAN_VALUE:</span>
              <span className="text-[10px] font-mono text-[#00d9ff]">0.942</span>
            </div>
            <div className="h-1 bg-[#1e1e20] w-full mt-2 relative overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-[#4a9eff]"
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>
          </div>
        </div>
        
        {hoverNode && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="p-4 border border-[#4a9eff]/30 bg-[#0a0a0b]/95 backdrop-blur-xl rounded shadow-[0_0_40px_rgba(74,158,255,0.05)]"
          >
            <div className="text-[11px] font-mono text-[#4a9eff] mb-1 font-bold tracking-tight">{(hoverNode.name || '').toUpperCase()}</div>
            <div className="text-[9px] font-mono text-[#555] mb-3">ID_{(hoverNode.id || '').toString().padStart(4, '0')} // GROUP_{(hoverNode.group || '').toUpperCase()}</div>
            
            <div className="space-y-2 border-t border-[#1e1e20] pt-3">
              <div className="flex justify-between">
                <span className="text-[8px] font-mono text-[#444]">INFERENCE_CONF</span>
                <span className="text-[9px] font-mono text-[#e0e0e0] font-bold">{(hoverNode.confidence || 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[8px] font-mono text-[#444]">LOCAL_ENTROPY</span>
                <span className="text-[9px] font-mono text-[#d4a574] font-bold">{(hoverNode.entropy || 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[8px] font-mono text-[#444]">SPECTRAL_RANK</span>
                <span className="text-[9px] font-mono text-[#8c8ca0] font-bold">#{((hoverNode.cluster || 0) + 1).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.02] select-none flex items-center justify-center">
        <div className="text-[25vw] font-mono font-bold tracking-tighter" style={{ filter: 'blur(2px)' }}>L=D-A</div>
      </div>
    </div>
  );
}
