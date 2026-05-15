import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { EntityType, RelationshipType } from '../../../../../shared/intelligence';

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

export const IntelligenceNavigator: React.FC<{ data: any }> = ({ data }) => {
  const fgRef = useRef<any>(null);

  const graphData = useMemo(() => {
    // Transform normalized intelligence data into Graph format
    const nodes = data?.entities?.map((e: any) => ({
      id: e.id,
      label: e.label,
      type: e.type,
      val: e.type === EntityType.VULNERABILITY ? 10 : 5,
      color: e.type === EntityType.VULNERABILITY ? '#ff4a4a' : '#4a9eff'
    })) || [];

    const links = data?.inferences?.map((i: any) => ({
      source: i.sourceId,
      target: i.targetEntityId,
      label: i.type,
      color: 'rgba(74, 158, 255, 0.2)'
    })) || [];

    return { nodes, links };
  }, [data]);

  return (
    <div className="relative w-full h-[600px] bg-[#050505] border border-[#111] rounded-lg overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="text-[10px] font-mono text-[#555] tracking-widest uppercase">Intelligence_Navigator_v4</div>
        <div className="flex gap-4">
          <LegendItem label="Asset" color="#4a9eff" />
          <LegendItem label="Identity" color="#00ffcc" />
          <LegendItem label="Vuln" color="#ff4a4a" />
        </div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeLabel="label"
        linkLabel="label"
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px "IBM Plex Mono"`;
          
          // Draw node
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Draw label
          if (globalScale > 1.5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(label, node.x, node.y + 10);
          }
        }}
      />
      
      {/* Evidence Panel overlay could go here */}
    </div>
  );
};

const LegendItem = ({ label, color }: { label: string; color: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[9px] font-mono text-[#888] uppercase">{label}</span>
  </div>
);
