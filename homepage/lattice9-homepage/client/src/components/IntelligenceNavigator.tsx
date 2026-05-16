import React, { useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * IntelligenceNavigator: Operational Graph Workspace
 * 
 * Implements high-density infrastructure mapping and attack path visualization
 * following Tactical Operational design principles.
 */

export const IntelligenceNavigator: React.FC<{ data: any; className?: string }> = ({ data, className = "" }) => {
  const fgRef = useRef<any>(null);

  const graphData = useMemo(() => {
    // Transform normalized intelligence data into Tactical Graph format
    const nodes = data?.entities?.map((e: any) => ({
      id: e.id,
      label: e.label,
      type: e.type,
      val: e.type === 'vuln' ? 6 : 4,
      // Operational palette: Tactical Blue, Operational Amber, Slate Cyan
      color: e.type === 'vuln' ? '#c48c00' : (e.type === 'identity' ? '#00a3a3' : '#4a6fa5'),
    })) || [];

    const links = data?.inferences?.map((i: any) => ({
      source: i.sourceId,
      target: i.targetEntityId,
      label: i.type,
      color: '#252529' // Deep charcoal edges
    })) || [];

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
        d3AlphaTarget={0.01}
        d3VelocityDecay={0.4}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkWidth={1}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          if (typeof node.x !== 'number' || typeof node.y !== 'number') return;

          const label = node.label;
          const fontSize = 8 / globalScale;
          const size = node.val || 4;
          
          // Draw tactical node marker
          ctx.beginPath();
          if (node.type === 'vuln') {
            // Diamond for vulnerabilities
            ctx.moveTo(node.x, node.y - size);
            ctx.lineTo(node.x + size, node.y);
            ctx.lineTo(node.x, node.y + size);
            ctx.lineTo(node.x - size, node.y);
            ctx.closePath();
          } else {
            // Sharp circle for assets/identities
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          }
          
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Tactical outline
          ctx.strokeStyle = '#ffffff20';
          ctx.lineWidth = 1 / globalScale;
          ctx.stroke();

          // Draw operational label
          if (globalScale > 2.5) {
            ctx.font = `${fontSize}px "IBM Plex Mono"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#8e8e93';
            ctx.fillText(label, node.x, node.y + size + 5);
          }
        }}
      />
    </div>
  );
};
