import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * HeroGraph Component
 * Renders the force-directed attack surface topology visualization
 * with spectral gradients, orbital node behavior, and confidence pulses.
 * 
 * Design: Scientific Instrumentalism
 * - Dark graphite background (#0f0f0f)
 * - Spectral cyan (#4a9eff) and amber (#d4a574) nodes
 * - Subtle mesh topology overlay
 * - Orbital rings and glow effects
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
}

interface Edge {
  source: number;
  target: number;
  strength: number;
}

export function HeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes with more sophisticated distribution
    const nodes: Node[] = [
      { x: 300, y: 250, vx: 0, vy: 0, radius: 10, color: '#4a9eff', confidence: 0.95, label: 'Core' },
      { x: 400, y: 150, vx: 0, vy: 0, radius: 7, color: '#00d9ff', confidence: 0.75, label: 'Recon' },
      { x: 500, y: 200, vx: 0, vy: 0, radius: 6, color: '#4a9eff', confidence: 0.65, label: 'Enum' },
      { x: 350, y: 350, vx: 0, vy: 0, radius: 8, color: '#d4a574', confidence: 0.85, label: 'Exploit' },
      { x: 450, y: 300, vx: 0, vy: 0, radius: 5, color: '#4a9eff', confidence: 0.55, label: 'Verify' },
      { x: 200, y: 200, vx: 0, vy: 0, radius: 7, color: '#00d9ff', confidence: 0.70, label: 'Asset' },
      { x: 550, y: 350, vx: 0, vy: 0, radius: 6, color: '#d4a574', confidence: 0.80, label: 'Payload' },
      { x: 300, y: 100, vx: 0, vy: 0, radius: 5, color: '#4a9eff', confidence: 0.45, label: 'Scan' },
      { x: 600, y: 250, vx: 0, vy: 0, radius: 5, color: '#00d9ff', confidence: 0.60, label: 'Pivot' },
      { x: 150, y: 300, vx: 0, vy: 0, radius: 4, color: '#4a9eff', confidence: 0.40, label: 'Data' },
    ];

    const edges: Edge[] = [
      { source: 0, target: 1, strength: 0.8 },
      { source: 0, target: 3, strength: 0.9 },
      { source: 0, target: 5, strength: 0.7 },
      { source: 1, target: 2, strength: 0.6 },
      { source: 1, target: 4, strength: 0.5 },
      { source: 3, target: 6, strength: 0.85 },
      { source: 2, target: 4, strength: 0.7 },
      { source: 5, target: 1, strength: 0.6 },
      { source: 0, target: 7, strength: 0.4 },
      { source: 0, target: 8, strength: 0.65 },
      { source: 8, target: 6, strength: 0.75 },
      { source: 5, target: 9, strength: 0.55 },
    ];

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.016; // ~60fps

      // Clear canvas with dark graphite background
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Draw subtle mesh topology overlay
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.02)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.offsetWidth; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.offsetHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.offsetHeight; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }

      // Physics simulation
      const damping = 0.98;
      const repulsion = 120;
      const attraction = 0.012;

      // Apply forces
      for (let i = 0; i < nodes.length; i++) {
        let fx = 0;
        let fy = 0;

        // Repulsion between nodes
        for (let j = 0; j < nodes.length; j++) {
          if (i !== j) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
            const force = repulsion / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        }

        // Attraction along edges
        for (const edge of edges) {
          if (edge.source === i) {
            const dx = nodes[edge.target].x - nodes[i].x;
            const dy = nodes[edge.target].y - nodes[i].y;
            fx += dx * attraction * edge.strength;
            fy += dy * attraction * edge.strength;
          } else if (edge.target === i) {
            const dx = nodes[edge.source].x - nodes[i].x;
            const dy = nodes[edge.source].y - nodes[i].y;
            fx += dx * attraction * edge.strength;
            fy += dy * attraction * edge.strength;
          }
        }

        // Update velocity and position
        nodes[i].vx = (nodes[i].vx + fx) * damping;
        nodes[i].vy = (nodes[i].vy + fy) * damping;
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;

        // Boundary constraints
        const margin = 40;
        if (nodes[i].x < margin) nodes[i].x = margin;
        if (nodes[i].x > canvas.offsetWidth - margin) nodes[i].x = canvas.offsetWidth - margin;
        if (nodes[i].y < margin) nodes[i].y = margin;
        if (nodes[i].y > canvas.offsetHeight - margin) nodes[i].y = canvas.offsetHeight - margin;
      }

      // Draw edges with spectral gradients
      for (const edge of edges) {
        const source = nodes[edge.source];
        const target = nodes[edge.target];

        const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
        gradient.addColorStop(0, `rgba(74, 158, 255, ${0.15 * edge.strength})`);
        gradient.addColorStop(0.5, `rgba(0, 217, 255, ${0.1 * edge.strength})`);
        gradient.addColorStop(1, `rgba(212, 165, 116, ${0.08 * edge.strength})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.2 * edge.strength;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }

      // Draw nodes with orbital rings and glow
      for (const node of nodes) {
        // Outer orbital ring
        ctx.strokeStyle = `rgba(74, 158, 255, ${0.08 + Math.sin(time * 1.5 + node.confidence) * 0.04})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.stroke();

        // Glow effect
        const glowRadius = node.radius * 3.5 + Math.sin(time * 2.5 + node.confidence) * 1.5;
        const glowColor = node.color === '#d4a574' ? '212, 165, 116' : '74, 158, 255';
        const glowGradient = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, glowRadius);
        glowGradient.addColorStop(0, `rgba(${glowColor}, 0.25)`);
        glowGradient.addColorStop(1, `rgba(${glowColor}, 0)`);

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Confidence pulse ring
        const pulseAlpha = 0.3 + Math.sin(time * 2.2 + node.confidence * 3) * 0.25 * node.confidence;
        ctx.strokeStyle = `rgba(${node.color === '#d4a574' ? '212, 165, 116' : '74, 158, 255'}, ${pulseAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Inner confidence indicator
        const innerRing = node.radius * 0.6;
        ctx.strokeStyle = `rgba(${node.color === '#d4a574' ? '212, 165, 116' : '74, 158, 255'}, ${0.2 * node.confidence})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, innerRing, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </motion.div>
  );
}
