import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * HeroGraph: Adversarial Systems Theory Engine
 * 
 * A high-fidelity force-directed simulation visualizing:
 * - Bayesian attack graphs (probabilistic edge transitions)
 * - Spectral topology (Laplacian clustering)
 * - Shannon Entropy (node instability/heatmaps)
 * - Bellman recon routing (optimized path highlight)
 */

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'domain' | 'api' | 'cloud' | 'cred' | 'vuln' | 'auth';
  confidence: number;
  entropy: number;
  label: string;
  cluster: number;
  centrality: number;
}

interface Edge {
  source: number;
  target: number;
  probability: number;
  type: 'exploit' | 'trust' | 'lateral' | 'temporal';
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

    // Color Palette: Scientific Graphite & Spectral Cyan/Amber
    const colors = {
      cyan: { r: 74, g: 158, b: 255 },   // recon/trust
      amber: { r: 212, g: 165, b: 116 },  // exploit/entropy
      teal: { r: 0, g: 217, b: 255 },    // auth/identity
      gray: { r: 140, g: 140, b: 160 },  // infra/static
      danger: { r: 255, g: 68, b: 68 },   // critical vuln
    };

    const getClusterColor = (c: number) => {
      const pal = [colors.cyan, colors.amber, colors.teal, colors.gray];
      return pal[c % pal.length];
    };

    // Initialize Nodes
    const nodeData: Partial<Node>[] = [
      { label: 'api.hawk.io', type: 'api', cluster: 0, centrality: 0.9, entropy: 0.2, confidence: 0.95 },
      { label: 'auth.v1', type: 'auth', cluster: 2, centrality: 0.95, entropy: 0.1, confidence: 0.98 },
      { label: 'prod-db-cluster', type: 'cloud', cluster: 3, centrality: 0.8, entropy: 0.05, confidence: 0.92 },
      { label: 'admin-creds', type: 'cred', cluster: 2, centrality: 0.7, entropy: 0.8, confidence: 0.4 },
      { label: 'CVE-2024-X1', type: 'vuln', cluster: 1, centrality: 0.85, entropy: 0.9, confidence: 0.15 },
      { label: 'edge-lb-01', type: 'cloud', cluster: 3, centrality: 0.6, entropy: 0.15, confidence: 0.88 },
      { label: 's3://evidence', type: 'cloud', cluster: 3, centrality: 0.4, entropy: 0.4, confidence: 0.7 },
      { label: 'jwt-sign-key', type: 'cred', cluster: 2, centrality: 0.6, entropy: 0.2, confidence: 0.9 },
      { label: 'ssrf-entry', type: 'vuln', cluster: 1, centrality: 0.5, entropy: 0.7, confidence: 0.3 },
      { label: 'internal-net', type: 'domain', cluster: 0, centrality: 0.4, entropy: 0.1, confidence: 0.9 },
      { label: 'user-db', type: 'cloud', cluster: 3, centrality: 0.5, entropy: 0.3, confidence: 0.8 },
      { label: 'oauth-proxy', type: 'auth', cluster: 2, centrality: 0.4, entropy: 0.2, confidence: 0.85 },
      { label: 'shell-access', type: 'vuln', cluster: 1, centrality: 0.7, entropy: 0.95, confidence: 0.1 },
      { label: 'metadata-svc', type: 'api', cluster: 0, centrality: 0.3, entropy: 0.6, confidence: 0.5 },
      { label: 'config-repo', type: 'domain', cluster: 0, centrality: 0.2, entropy: 0.1, confidence: 0.92 },
    ];

    const nodes: Node[] = nodeData.map((d, i) => ({
      id: i,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0, vy: 0,
      radius: 4 + (d.centrality || 0) * 8,
      type: d.type as Node['type'],
      confidence: d.confidence || 0.5,
      entropy: d.entropy || 0.1,
      label: d.label || '',
      cluster: d.cluster || 0,
      centrality: d.centrality || 0.5,
    }));

    const edges: Edge[] = [
      { source: 0, target: 1, probability: 0.9, type: 'trust' },
      { source: 1, target: 7, probability: 0.8, type: 'trust' },
      { source: 1, target: 3, probability: 0.4, type: 'exploit' },
      { source: 0, target: 13, probability: 0.7, type: 'trust' },
      { source: 13, target: 8, probability: 0.85, type: 'exploit' },
      { source: 8, target: 12, probability: 0.9, type: 'exploit' },
      { source: 12, target: 2, probability: 0.3, type: 'lateral' },
      { source: 4, target: 5, probability: 0.75, type: 'exploit' },
      { source: 5, target: 9, probability: 0.6, type: 'lateral' },
      { source: 9, target: 10, probability: 0.5, type: 'lateral' },
      { source: 7, target: 11, probability: 0.4, type: 'temporal' },
      { source: 2, target: 6, probability: 0.3, type: 'temporal' },
      { source: 10, target: 14, probability: 0.2, type: 'temporal' },
    ];

    let animId: number;
    let t = 0;

    const animate = () => {
      t += 0.006;
      ctx.fillStyle = '#0a0a0b';
      ctx.fillRect(0, 0, w, h);

      // Background: Laplacian Grid (Subtle spectral gap lines)
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.02)';
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Physics: Bayesian Force Simulation
      const damping = 0.97;
      const repulsion = 120;
      const attraction = 0.012;
      const gravity = 0.0005;

      nodes.forEach((n, i) => {
        let fx = 0, fy = 0;

        // Soft center gravity
        fx += (w * 0.5 - n.x) * gravity;
        fy += (h * 0.45 - n.y) * gravity;

        // Repulsion (Shannon Entropy based instability)
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);
          // High entropy nodes are more "repulsive" and unstable
          const f = (repulsion * (1 + n.entropy * 0.5)) / distSq;
          fx += (dx / dist) * f;
          fy += (dy / dist) * f;
        });

        // Attraction (Bayesian Probability weight)
        edges.forEach(e => {
          let otherId = -1;
          if (e.source === i) otherId = e.target;
          else if (e.target === i) otherId = e.source;
          if (otherId === -1) return;
          const other = nodes[otherId];
          const dx = other.x - n.x;
          const dy = other.y - n.y;
          // Edges are stronger if probability is high
          fx += dx * attraction * e.probability;
          fy += dy * attraction * e.probability;
        });

        // Orbital drift (Adversarial perturbation)
        fx += Math.sin(t * 0.8 + i) * 0.03;
        fy += Math.cos(t * 0.7 + i) * 0.03;

        n.vx = (n.vx + fx) * damping;
        n.vy = (n.vy + fy) * damping;
        n.x += n.vx;
        n.y += n.vy;

        // Boundaries
        const margin = 40;
        n.x = Math.max(margin, Math.min(w - margin, n.x));
        n.y = Math.max(margin, Math.min(h - margin, n.y));
      });

      // Layer 1: Confidence Diffusion (Soft probability waves)
      nodes.forEach(n => {
        if (n.entropy > 0.6) {
          const waveR = (t * 80 + n.id * 20) % 150;
          const alpha = Math.max(0, 0.05 * (1 - waveR / 150));
          ctx.strokeStyle = `rgba(212, 165, 116, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, waveR, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Layer 2: Probabilistic Edges
      edges.forEach(e => {
        const s = nodes[e.source];
        const d = nodes[e.target];
        
        const alpha = e.probability * 0.2;
        const color = e.type === 'exploit' ? colors.amber : colors.cyan;
        
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        // Bayesian "Curved" path for inferred edges
        if (e.type === 'temporal' || e.type === 'lateral') {
          const midX = (s.x + d.x) / 2 + Math.sin(t + e.source) * 20;
          const midY = (s.y + d.y) / 2 + Math.cos(t + e.target) * 20;
          ctx.quadraticCurveTo(midX, midY, d.x, d.y);
          ctx.setLineDash([2, 5]);
        } else {
          ctx.lineTo(d.x, d.y);
          ctx.setLineDash([]);
        }
        
        const grad = ctx.createLinearGradient(s.x, s.y, d.x, d.y);
        grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
        grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},${alpha * 0.3})`);
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + e.probability * 1.5;
        ctx.stroke();
        
        // Confidence pulses (diffusion packets)
        const pulseT = (t * 0.5 * e.probability) % 1;
        const px = s.x + (d.x - s.x) * pulseT;
        const py = s.y + (d.y - s.y) * pulseT;
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 2})`;
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.setLineDash([]);

      // Layer 3: Nodes (Instrumental Render)
      nodes.forEach(n => {
        const c = getClusterColor(n.cluster);
        
        // Laplacian Stability Ring
        const ringR = n.radius * 2.5 + Math.sin(t * 1.5 + n.id) * 2;
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.05 + n.centrality * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2); ctx.stroke();

        // Entropy Distortion (Heatmap effect for high-entropy nodes)
        if (n.entropy > 0.7) {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 6);
          glow.addColorStop(0, `rgba(${colors.amber.r},${colors.amber.g},${colors.amber.b},0.1)`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.radius * 6, 0, Math.PI * 2); ctx.fill();
        }

        // Core
        const coreAlpha = 0.4 + n.confidence * 0.4;
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${coreAlpha})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2); ctx.fill();
        
        // Outer glow
        ctx.shadowBlur = 15 * n.confidence;
        ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},0.3)`;
        
        // Label
        if (n.centrality > 0.4) {
          ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.6)`;
          ctx.font = '9px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(n.label.toUpperCase(), n.x, n.y + n.radius + 15);
          
          // Probability tag
          ctx.fillStyle = 'rgba(74, 158, 255, 0.3)';
          ctx.fillText(`P=${n.confidence.toFixed(2)}`, n.x, n.y - n.radius - 8);
        }
        ctx.shadowBlur = 0;
      });

      // Layer 4: Mathematical System Overlays (Floating equations)
      const equations = [
        { text: 'P(A|B) = [P(B|A)P(A)] / P(B)', x: w * 0.1, y: h * 0.2 },
        { text: 'L = D - A', x: w * 0.8, y: h * 0.15 },
        { text: 'H(X) = -Σ p(x) log p(x)', x: w * 0.15, y: h * 0.8 },
        { text: 'V*(s) = max[R + γV*]', x: w * 0.75, y: h * 0.85 },
      ];

      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      equations.forEach((eq, i) => {
        const alpha = 0.1 + Math.sin(t * 0.5 + i) * 0.05;
        ctx.fillStyle = `rgba(74, 158, 255, ${alpha})`;
        ctx.fillText(eq.text, eq.x + Math.sin(t * 0.3 + i) * 10, eq.y + Math.cos(t * 0.4 + i) * 10);
      });

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
