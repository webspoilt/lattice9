import React, { useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * IntelligenceNavigator: Graph Intelligence Workspace
 * 
 * Implements high-density infrastructure mapping with weighted influence
 * and attack path synthesis.
 */

interface Props {
  data: any;
  className?: string;
  onNodeClick?: (nodeId: string) => void;
}

export const IntelligenceNavigator: React.FC<Props> = ({ data, className = "", onNodeClick }) => {
  const fgRef = useRef<any>(null);

  const graphData = useMemo(() => {
    // Transform engine data into Influence-Weighted format
    const rawNodes = data?.nodes || data?.entities || [];
    const nodes = rawNodes.map((e: any) => ({
      id: e.id,
      label: e.display_name || e.id,
      type: e.entity_type,
      // Scale by influence score (PageRank) or confidence
      val: (e.influence_score ? e.influence_score * 20 : 4) + ((e.confidence || 0.5) * 2),
      color: e.entity_type === 'vuln' || e.entity_type === 'finding' ? '#f59e0b' : (e.entity_type === 'identity' || e.entity_type === 'credential' ? '#06b6d4' : '#3b82f6'),
      confidence: e.confidence || 0.5
    }));

    const rawLinks = data?.links || data?.inferences || [];
    const links = rawLinks.map((i: any) => ({
      source: i.source || i.sourceId,
      target: i.target || i.targetEntityId,
      label: i.type,
      weight: i.weight || 1,
      color: i.type === 'TRUSTS' ? 'rgba(16, 185, 129, 0.4)' : (i.type === 'AUTHENTICATES_TO' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(39, 39, 42, 0.4)')
    }));

    return { nodes, links };
  }, [data]);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeLabel="label"
        linkLabel="label"
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkWidth={(link: any) => link.weight || 1}
        onNodeClick={(node: any) => onNodeClick?.(node.id)}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          if (typeof node.x !== 'number' || typeof node.y !== 'number') return;

          const label = node.label;
          const fontSize = 7 / globalScale;
          const size = node.val || 4;
          
          // Draw tactical marker
          ctx.beginPath();
          if (node.type === 'vuln') {
            // Diamond for vulnerabilities (indicator of risk)
            ctx.moveTo(node.x, node.y - size);
            ctx.lineTo(node.x + size, node.y);
            ctx.lineTo(node.x, node.y + size);
            ctx.lineTo(node.x - size, node.y);
            ctx.closePath();
          } else {
            // Sharp circle for assets
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          }
          
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Confidence Ring
          ctx.strokeStyle = `rgba(255, 255, 255, ${node.confidence * 0.3})`;
          ctx.lineWidth = 2 / globalScale;
          ctx.stroke();

          // High-scale labels
          if (globalScale > 3) {
            ctx.font = `${fontSize}px "JetBrains Mono", "IBM Plex Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#71717a';
            ctx.fillText(label, node.x, node.y + size + 4);
          }
        }}
      />
    </div>
  );
};
