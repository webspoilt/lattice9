import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * HeroGraph: Force-directed attack surface topology
 * 
 * 20+ nodes with spectral clustering, confidence pulse diffusion,
 * probabilistic edge transitions, and topology mesh overlays.
 * Nodes drift with orbital inertia. Edges fade based on Bayesian weight.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  confidence: number;
  label: string;
  cluster: number;
  centrality: number;
}

interface Edge {
  source: number;
  target: number;
  strength: number;
  type: 'trust' | 'inferred' | 'temporal';
}

export function HeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Cluster colors
    const clusterColors = [
      { r: 74, g: 158, b: 255 },   // cyan — recon cluster
      { r: 212, g: 165, b: 116 },   // amber — exploit cluster
      { r: 0, g: 217, b: 255 },     // bright cyan — auth cluster
      { r: 140, g: 140, b: 160 },   // muted steel — infra cluster
    ];

    // Generate nodes with spectral distribution
    const makeNode = (x: number, y: number, r: number, cluster: number, label: string, conf: number, cent: number): Node => {
      const c = clusterColors[cluster];
      return { x, y, vx: 0, vy: 0, radius: r, color: `rgb(${c.r},${c.g},${c.b})`, confidence: conf, label, cluster, centrality: cent };
    };

    const nodes: Node[] = [
      // Cluster 0: Recon
      makeNode(w * 0.25, h * 0.35, 12, 0, 'DNS', 0.92, 0.85),
      makeNode(w * 0.18, h * 0.22, 6, 0, 'WHOIS', 0.55, 0.3),
      makeNode(w * 0.32, h * 0.18, 7, 0, 'CERT', 0.68, 0.45),
      makeNode(w * 0.15, h * 0.45, 5, 0, 'ASN', 0.42, 0.2),
      // Cluster 1: Exploit
      makeNode(w * 0.65, h * 0.55, 10, 1, 'RCE', 0.88, 0.9),
      makeNode(w * 0.72, h * 0.42, 7, 1, 'SQLi', 0.72, 0.6),
      makeNode(w * 0.58, h * 0.65, 6, 1, 'SSRF', 0.65, 0.5),
      makeNode(w * 0.78, h * 0.62, 5, 1, 'LFI', 0.48, 0.35),
      // Cluster 2: Auth
      makeNode(w * 0.45, h * 0.4, 11, 2, 'AUTH', 0.95, 0.95),
      makeNode(w * 0.5, h * 0.25, 6, 2, 'JWT', 0.7, 0.55),
      makeNode(w * 0.38, h * 0.55, 5, 2, 'IDOR', 0.62, 0.4),
      makeNode(w * 0.52, h * 0.52, 4, 2, 'CSRF', 0.38, 0.25),
      // Cluster 3: Infra
      makeNode(w * 0.82, h * 0.25, 8, 3, 'CDN', 0.78, 0.7),
      makeNode(w * 0.88, h * 0.38, 5, 3, 'LB', 0.52, 0.35),
      makeNode(w * 0.85, h * 0.15, 4, 3, 'WAF', 0.45, 0.3),
      makeNode(w * 0.92, h * 0.5, 4, 3, 'PROXY', 0.35, 0.2),
      // Peripheral nodes
      makeNode(w * 0.1, h * 0.7, 4, 0, 'SUB', 0.3, 0.15),
      makeNode(w * 0.35, h * 0.75, 5, 1, 'API', 0.58, 0.45),
      makeNode(w * 0.6, h * 0.12, 3, 3, 'S3', 0.25, 0.1),
      makeNode(w * 0.42, h * 0.08, 3, 0, 'NS', 0.2, 0.08),
    ];

    const edges: Edge[] = [
      // Recon internal
      { source: 0, target: 1, strength: 0.7, type: 'trust' },
      { source: 0, target: 2, strength: 0.8, type: 'trust' },
      { source: 0, target: 3, strength: 0.5, type: 'inferred' },
      { source: 1, target: 3, strength: 0.3, type: 'temporal' },
      // Exploit internal
      { source: 4, target: 5, strength: 0.85, type: 'trust' },
      { source: 4, target: 6, strength: 0.7, type: 'trust' },
      { source: 5, target: 7, strength: 0.55, type: 'inferred' },
      { source: 6, target: 7, strength: 0.4, type: 'temporal' },
      // Auth internal
      { source: 8, target: 9, strength: 0.9, type: 'trust' },
      { source: 8, target: 10, strength: 0.65, type: 'trust' },
      { source: 8, target: 11, strength: 0.4, type: 'inferred' },
      { source: 9, target: 10, strength: 0.5, type: 'temporal' },
      // Infra internal
      { source: 12, target: 13, strength: 0.75, type: 'trust' },
      { source: 12, target: 14, strength: 0.6, type: 'trust' },
      { source: 13, target: 15, strength: 0.45, type: 'inferred' },
      // Cross-cluster (attack paths)
      { source: 0, target: 8, strength: 0.6, type: 'trust' },
      { source: 8, target: 4, strength: 0.75, type: 'trust' },
      { source: 2, target: 12, strength: 0.45, type: 'inferred' },
      { source: 10, target: 6, strength: 0.55, type: 'temporal' },
      { source: 12, target: 9, strength: 0.35, type: 'temporal' },
      { source: 14, target: 5, strength: 0.3, type: 'inferred' },
      // Peripheral
      { source: 16, target: 0, strength: 0.4, type: 'inferred' },
      { source: 17, target: 4, strength: 0.5, type: 'trust' },
      { source: 17, target: 10, strength: 0.35, type: 'temporal' },
      { source: 18, target: 12, strength: 0.25, type: 'inferred' },
      { source: 19, target: 0, strength: 0.3, type: 'temporal' },
    ];

    let animId: number;
    let t = 0;

    const animate = () => {
      t += 0.008;

      // Clear
      ctx.fillStyle = '#0a0a0b';
      ctx.fillRect(0, 0, w, h);

      // Topology mesh — very subtle grid
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.015)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Physics
      const damping = 0.985;
      const repulsion = 80;
      const attraction = 0.008;
      const centerGravity = 0.0003;

      for (let i = 0; i < nodes.length; i++) {
        let fx = 0, fy = 0;

        // Center gravity
        fx += (w * 0.5 - nodes[i].x) * centerGravity;
        fy += (h * 0.4 - nodes[i].y) * centerGravity;

        // Orbital drift
        fx += Math.sin(t * 0.5 + i * 0.7) * 0.02;
        fy += Math.cos(t * 0.4 + i * 0.9) * 0.015;

        // Repulsion
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const force = repulsion / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // Attraction along edges
        for (const e of edges) {
          let other = -1;
          if (e.source === i) other = e.target;
          else if (e.target === i) other = e.source;
          if (other < 0) continue;
          const dx = nodes[other].x - nodes[i].x;
          const dy = nodes[other].y - nodes[i].y;
          fx += dx * attraction * e.strength;
          fy += dy * attraction * e.strength;
        }

        nodes[i].vx = (nodes[i].vx + fx) * damping;
        nodes[i].vy = (nodes[i].vy + fy) * damping;
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;

        // Boundary
        const m = 30;
        nodes[i].x = Math.max(m, Math.min(w - m, nodes[i].x));
        nodes[i].y = Math.max(m, Math.min(h - m, nodes[i].y));
      }

      // Draw edges
      for (const e of edges) {
        const s = nodes[e.source];
        const d = nodes[e.target];

        const alpha = e.strength * 0.25;
        const dashOffset = t * 30 * e.strength;

        if (e.type === 'temporal') {
          ctx.setLineDash([4, 8]);
          ctx.lineDashOffset = dashOffset;
        } else if (e.type === 'inferred') {
          ctx.setLineDash([2, 4]);
          ctx.lineDashOffset = dashOffset * 0.5;
        } else {
          ctx.setLineDash([]);
        }

        const cS = clusterColors[s.cluster];
        const cD = clusterColors[d.cluster];
        const grad = ctx.createLinearGradient(s.x, s.y, d.x, d.y);
        grad.addColorStop(0, `rgba(${cS.r},${cS.g},${cS.b},${alpha})`);
        grad.addColorStop(1, `rgba(${cD.r},${cD.g},${cD.b},${alpha * 0.6})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8 + e.strength * 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw confidence propagation pulses on high-strength edges
      for (const e of edges) {
        if (e.strength < 0.6) continue;
        const s = nodes[e.source];
        const d = nodes[e.target];
        const progress = ((t * e.strength * 0.5) % 1);
        const px = s.x + (d.x - s.x) * progress;
        const py = s.y + (d.y - s.y) * progress;
        const c = clusterColors[s.cluster];
        const pulseAlpha = 0.4 * (1 - Math.abs(progress - 0.5) * 2);

        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${pulseAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw nodes
      for (const n of nodes) {
        const c = clusterColors[n.cluster];

        // Outer orbit ring
        const orbitR = n.radius * 3.5 + Math.sin(t * 1.2 + n.confidence * 5) * 2;
        const orbitAlpha = 0.04 + n.centrality * 0.04;
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${orbitAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, orbitR, 0, Math.PI * 2);
        ctx.stroke();

        // Glow
        const glowR = n.radius * 4;
        const glow = ctx.createRadialGradient(n.x, n.y, n.radius * 0.5, n.x, n.y, glowR);
        glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${0.12 * n.centrality})`);
        glow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.5 + n.confidence * 0.5})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        // Confidence pulse ring
        const pulseR = n.radius + 3 + Math.sin(t * 2 + n.confidence * 4) * 1.5;
        const pulseA = 0.15 + Math.sin(t * 1.8 + n.confidence * 3) * 0.1;
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${pulseA})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Label (only for larger nodes)
        if (n.radius >= 5) {
          ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.25 + n.centrality * 0.2})`;
          ctx.font = `${Math.max(8, n.radius * 0.8)}px 'IBM Plex Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(n.label, n.x, n.y + n.radius * 2.5 + 4);
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  );
}
