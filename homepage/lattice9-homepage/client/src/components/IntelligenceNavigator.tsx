import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { EntityType, RelationshipType } from '../shared/intelligence';

/**
 * IntelligenceNavigator: The Operational Command View
 * 
 * Replaces the "HeroGraph" aesthetic with functional, 
 * high-density attack path visualization.
 */

interface GraphData {
  nodes: any[];
  links: any[];
}

export const IntelligenceNavigator: React.FC<{ data: any; className?: string }> = ({ data, className = "" }) => {
  const fgRef = useRef<any>(null);

  const graphData = useMemo(() => {
    // Transform normalized intelligence data into Graph format
    const nodes = data?.entities?.map((e: any) => ({
      id: e.id,
      label: e.label,
      type: e.type,
      val: e.type === 'vuln' ? 12 : 6,
      color: e.type === 'vuln' ? '#d4a574' : '#6366f1',
      entropy: Math.random() * 0.5 + 0.2
    })) || [];

    const links = data?.inferences?.map((i: any) => ({
      source: i.sourceId,
      target: i.targetEntityId,
      label: i.type,
      color: 'rgba(99, 102, 241, 0.05)'
    })) || [];

    return { nodes, links };
  }, [data]);

  useEffect(() => {
    const fg = fgRef.current;
    if (fg) {
      // Use optional chaining and type checks for D3 methods
      if (typeof fg.d3Force === 'function') {
        fg.d3Force('charge')?.strength(-150);
        fg.d3Force('link')?.distance(100);
      }
      if (typeof fg.d3AlphaTarget === 'function') {
        fg.d3AlphaTarget(0.01);
      }
    }
  }, []);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeLabel="label"
        linkLabel="label"
        enableNodeDrag={false}
        enablePanInteraction={false}
        enableZoomInteraction={false}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          // Prevent drawing if coordinates are not yet initialized by D3
          if (typeof node.x !== 'number' || typeof node.y !== 'number') return;

          const time = performance.now() / 1000;
          const label = node.label;
          const fontSize = 10 / globalScale;
          const size = node.val || 5;
          
          // Organic jitter
          const jitter = (node.entropy || 0) * 0.8;
          const nx = node.x + (Math.random() - 0.5) * jitter;
          const ny = node.y + (Math.random() - 0.5) * jitter;
          
          const pulse = Math.sin(time * 2 + (parseInt(node.id) || 0)) * 0.5 + 0.5;

          // Draw halo
          ctx.beginPath();
          ctx.arc(nx, ny, size * (1.2 + pulse * 0.3), 0, 2 * Math.PI, false);
          ctx.fillStyle = node.type === 'vuln' 
            ? `rgba(212, 165, 116, ${0.05 + pulse * 0.1})` 
            : `rgba(99, 102, 241, ${0.05 + pulse * 0.1})`;
          ctx.fill();

          // Draw node
          ctx.beginPath();
          ctx.arc(nx, ny, size, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Draw label
          if (globalScale > 1.2) {
            ctx.font = `${fontSize}px "IBM Plex Mono"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText(label, nx, ny + size + 8);
          }
        }}
      />
    </div>
  );
};

const LegendItem = ({ label, color }: { label: string; color: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[9px] font-mono text-[#888] uppercase">{label}</span>
  </div>
);
