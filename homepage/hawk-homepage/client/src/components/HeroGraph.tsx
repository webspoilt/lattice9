import { useEffect, useRef, useMemo, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

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
}

interface Link {
  source: string;
  target: string;
  probability: number;
  type: 'exploit' | 'trust' | 'lateral' | 'temporal';
  equation?: string;
}

export function HeroGraph() {
  const fgRef = useRef<any>();
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [time, setTime] = useState(0);

  // Simulation time loop
  useEffect(() => {
    let id = requestAnimationFrame(function loop() {
      setTime(t => t + 0.016);
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, []);

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
      { source: '0', target: '1', probability: 0.9, type: 'trust', equation: 'P(A|B) = [P(B|A)P(A)] / P(B)' },
      { source: '1', target: '7', probability: 0.8, type: 'trust', equation: 'λ₂(L) > 0' },
      { source: '1', target: '3', probability: 0.4, type: 'exploit', equation: 'H(X) = -Σ p(x) log p(x)' },
      { source: '0', target: '13', probability: 0.7, type: 'trust' },
      { source: '13', target: '8', probability: 0.85, type: 'exploit', equation: 'V*(s) = max[R + γV*]' },
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

  const colors = {
    cyan: '#4a9eff',
    amber: '#d4a574',
    teal: '#00d9ff',
    gray: '#8c8ca0',
    danger: '#ff4444',
    bg: '#0a0a0b',
  };

  const getClusterColor = (c: number) => {
    const pal = [colors.cyan, colors.amber, colors.teal, colors.gray];
    return pal[c % pal.length];
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0b]">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        backgroundColor="#0a0a0b"
        showNavInfo={false}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.1}
        cooldownTicks={100}
        
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const c = getClusterColor(node.cluster);
          const size = node.val;
          
          // Layer 1: Entropy Distortion Field
          if (node.entropy > 0.6) {
            const distortionR = size * 4 + Math.sin(time * 3 + node.id) * 5;
            const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, distortionR);
            grad.addColorStop(0, `rgba(212, 165, 116, ${0.1 * node.entropy})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(node.x, node.y, distortionR, 0, Math.PI * 2); ctx.fill();
            
            // Instability particles
            ctx.fillStyle = `rgba(212, 165, 116, ${0.4 * node.entropy})`;
            for(let i=0; i<3; i++) {
              const px = node.x + Math.sin(time * 5 + i * 2) * size * 2;
              const py = node.y + Math.cos(time * 4 + i * 3) * size * 2;
              ctx.beginPath(); ctx.arc(px, py, 0.5, 0, Math.PI * 2); ctx.fill();
            }
          }

          // Layer 2: Laplacian Stability Ring
          ctx.strokeStyle = c;
          ctx.lineWidth = 0.5 / globalScale;
          ctx.setLineDash([2 / globalScale, 4 / globalScale]);
          ctx.beginPath(); ctx.arc(node.x, node.y, size * 2.5, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);

          // Layer 3: Core Bayesian Node
          const coreAlpha = 0.4 + node.confidence * 0.4;
          ctx.fillStyle = c;
          ctx.globalAlpha = coreAlpha;
          ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1.0;

          // Node Text Overlay (Active Metrics)
          if (globalScale > 1.5) {
            ctx.font = `${8 / globalScale}px "IBM Plex Mono"`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(node.name.toUpperCase(), node.x, node.y + size + 10 / globalScale);
            
            // Dynamic Metric
            ctx.fillStyle = colors.cyan;
            ctx.fillText(`P=${node.confidence.toFixed(2)}`, node.x, node.y - size - 5 / globalScale);
          }
        }}

        linkCanvasObject={(link: any, ctx, globalScale) => {
          const s = link.source;
          const d = link.target;
          if (typeof s !== 'object' || typeof d !== 'object') return;

          const color = link.type === 'exploit' ? colors.amber : colors.cyan;
          const alpha = link.probability * 0.25;
          
          // Bayesian Probability Edge
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          
          // Curved lateral paths
          if (link.type === 'lateral' || link.type === 'temporal') {
            const midX = (s.x + d.x) / 2 + Math.sin(time + link.index) * 20;
            const midY = (s.y + d.y) / 2 + Math.cos(time + link.index) * 20;
            ctx.quadraticCurveTo(midX, midY, d.x, d.y);
          } else {
            ctx.lineTo(d.x, d.y);
          }

          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = (1 + link.probability * 2) / globalScale;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Active Mathematics: Equation Floating near Edge
          if (link.equation && globalScale > 2) {
            const midX = (s.x + d.x) / 2;
            const midY = (s.y + d.y) / 2;
            ctx.font = `${6 / globalScale}px "IBM Plex Mono"`;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4 + Math.sin(time * 2) * 0.2;
            ctx.fillText(link.equation, midX + 5, midY - 5);
            ctx.globalAlpha = 1.0;
          }

          // Confidence Propagation Packet
          const pulseT = (time * 0.5 * link.probability) % 1;
          const px = s.x + (d.x - s.x) * pulseT;
          const py = s.y + (d.y - s.y) * pulseT;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(px, py, 1.5 / globalScale, 0, Math.PI * 2); ctx.fill();
        }}

        // Layer 5: Bellman Trajectory Optimization (RL Ghost Agent)
        onRenderFramePre={(ctx, globalScale) => {
          if (!data.bellmanPath || !data.nodes) return;
          const pathIds = data.bellmanPath;
          const pathNodes = pathIds.map(id => data.nodes.find(n => n.id === id)).filter(n => n && n.x !== undefined) as any[];
          
          if (pathNodes.length < 2) return;

          // Draw optimal path glow
          ctx.beginPath();
          ctx.strokeStyle = colors.teal;
          ctx.globalAlpha = 0.05 + Math.sin(time * 2) * 0.05;
          ctx.lineWidth = 3 / globalScale;
          pathNodes.forEach((n, i) => {
            if (i === 0) ctx.moveTo(n.x, n.y);
            else ctx.lineTo(n.x, n.y);
          });
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Ghost Agent Agent
          const speed = 0.4;
          const agentT = (time * speed) % (pathNodes.length - 1);
          const segmentIdx = Math.floor(agentT);
          const segmentT = agentT % 1;
          const n1 = pathNodes[segmentIdx];
          const n2 = pathNodes[segmentIdx + 1];
          
          if (n1 && n2) {
            const ax = n1.x + (n2.x - n1.x) * segmentT;
            const ay = n1.y + (n2.y - n1.y) * segmentT;
            
            ctx.fillStyle = colors.teal;
            ctx.shadowBlur = 15;
            ctx.shadowColor = colors.teal;
            ctx.beginPath(); ctx.arc(ax, ay, 2 / globalScale, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            
            // Label with fade
            ctx.font = `${5 / globalScale}px "IBM Plex Mono"`;
            ctx.fillStyle = `rgba(0, 217, 255, ${0.4 + Math.sin(time * 5) * 0.2})`;
            ctx.fillText('OPTIMAL_TRAJECTORY_AGENT', ax + 8 / globalScale, ay);
          }
        }}
        
        onNodeHover={setHoverNode}
      />

      {/* Side Status HUD */}
      <div className="absolute top-20 right-6 w-48 space-y-4 pointer-events-none">
        <div className="p-3 border border-[#1e1e20] bg-[#0a0a0b]/80 backdrop-blur-sm rounded">
          <div className="text-[10px] font-mono text-[#555] mb-2">SYSTEM_TOPOLOGY_v4.1</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[9px] font-mono text-[#444]">NODES:</span>
              <span className="text-[9px] font-mono text-[#4a9eff]">15 [STABLE]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] font-mono text-[#444]">EDGES:</span>
              <span className="text-[9px] font-mono text-[#4a9eff]">13 [INFERRED]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] font-mono text-[#444]">ENTROPY:</span>
              <span className="text-[9px] font-mono text-[#d4a574]">H=2.84 bits</span>
            </div>
          </div>
        </div>
        
        {hoverNode && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="p-3 border border-[#4a9eff]/30 bg-[#0a0a0b]/90 backdrop-blur-sm rounded shadow-[0_0_20px_rgba(74,158,255,0.1)]"
          >
            <div className="text-[10px] font-mono text-[#4a9eff] mb-1 font-bold">{hoverNode.name.toUpperCase()}</div>
            <div className="text-[9px] font-mono text-[#666] mb-2">{hoverNode.type.toUpperCase()} // CLUSTER_{hoverNode.cluster}</div>
            <div className="h-px bg-[#1e1e20] mb-2" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[8px] font-mono text-[#444]">CONFIDENCE</span>
                <span className="text-[8px] font-mono text-[#e0e0e0]">{hoverNode.confidence.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[8px] font-mono text-[#444]">ENTROPY</span>
                <span className="text-[8px] font-mono text-[#d4a574]">{hoverNode.entropy.toFixed(4)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Laplacian Background Equations */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center">
        <div className="text-[20vw] font-mono font-bold">L=D-A</div>
      </div>
    </div>
  );
}
