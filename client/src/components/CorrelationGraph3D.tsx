import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { trpc } from "@/lib/trpc";
import * as THREE from "three";

const NODE_COLORS: Record<string, string> = {
  host: "#6366f1",
  service: "#00d9ff",
  endpoint: "#8b5cf6",
  identity: "#f59e0b",
  credential: "#ef4444",
  vulnerability: "#ec4899",
  finding: "#f97316",
  evidence: "#6b7280",
  trust_zone: "#10b981",
  objective: "#14b8a6",
};

const LINK_COLORS: Record<string, string> = {
  RESOLVES_TO: "rgba(99, 102, 241, 0.3)",
  HOSTS: "rgba(0, 217, 255, 0.25)",
  HAS_FINDING: "rgba(249, 115, 22, 0.35)",
  ATTACK_PATH: "rgba(239, 68, 68, 0.45)",
};

const DEFAULT_NODE_COLOR = "#6b7280";
const DEFAULT_LINK_COLOR = "rgba(255, 255, 255, 0.08)";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  confidence: number;
  severity?: string;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface CorrelationGraph3DProps {
  engagementId: string;
}

export function CorrelationGraph3D({ engagementId }: CorrelationGraph3DProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  const { data, isLoading } = trpc.exposure.getGraphData.useQuery(
    { engagementId },
    { refetchInterval: 10000 }
  );

  const graphData = useMemo<GraphData>(() => {
    if (!data) return { nodes: [], links: [] };
    return {
      nodes: data.nodes.map(n => ({
        ...n,
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10,
      })),
      links: data.links,
    };
  }, [data]);

  useEffect(() => {
    const fg = fgRef.current;
    if (fg && graphData.nodes.length > 0) {
      try {
        if (fg.d3Force) {
          fg.d3Force("charge")?.strength(-80);
          fg.d3Force("link")?.distance(60);
          fg.d3AlphaDecay(0.02);
          fg.d3VelocityDecay(0.3);
          fg.d3ReheatSimulation();
        }
      } catch {
        // forces not ready yet
      }
    }
  }, [graphData.nodes.length]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const getNodeColor = useCallback((node: GraphNode): string => {
    return NODE_COLORS[node.type] || DEFAULT_NODE_COLOR;
  }, []);

  const nodeThreeObject = useCallback((node: GraphNode) => {
    const color = getNodeColor(node);
    const size = 1 + node.confidence * 3;
    const group = new THREE.Group();

    const sphereGeom = new THREE.SphereGeometry(size, 16, 12);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    group.add(sphere);

    const glowGeom = new THREE.SphereGeometry(size * 1.6, 16, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.08,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    group.add(glow);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.clearRect(0, 0, 256, 64);

    ctx.font = "bold 20px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(node.label.toUpperCase(), 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = -size - 3;
    sprite.scale.set(24, 6, 1);
    group.add(sprite);

    return group;
  }, [getNodeColor]);

  const handleLinkColor = useCallback((link: any): string => {
    return LINK_COLORS[link.type] || DEFAULT_LINK_COLOR;
  }, []);

  const handleLinkWidth = useCallback((link: any): number => {
    return 0.3 + link.confidence * 0.7;
  }, []);

  const isHighlighted = useCallback((node: GraphNode, link: any): boolean => {
    if (!selectedNode && !hoverNode) return false;
    const activeId = selectedNode?.id || hoverNode?.id;
    return node.id === activeId || link.source.id === activeId || link.target.id === activeId;
  }, [selectedNode, hoverNode]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0b]">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Synthesizing graph topology...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0b]">
      {graphData.nodes.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
              Graph topology pending...
            </div>
            <div className="text-[9px] font-mono text-zinc-800">
              Initiate intelligence capture to populate correlation graph
            </div>
          </div>
        </div>
      ) : (
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          backgroundColor="#0a0a0b"
          nodeRelSize={0.8}
          linkColor={handleLinkColor}
          linkWidth={handleLinkWidth}
          linkOpacity={0.6}
          nodeThreeObject={nodeThreeObject}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoverNode}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          enableNodeDrag={false}
          enableNavigationControls={true}
          showNavInfo={false}
          rendererConfig={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        />
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
        {Object.entries(NODE_COLORS).map(([type, color]) => {
          const hasType = graphData.nodes.some(n => n.type === type);
          if (!hasType) return null;
          return (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2" style={{ backgroundColor: color }} />
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">{type}</span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 flex gap-4 pointer-events-none z-10">
        <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
          Nodes: {graphData.nodes.length}
        </div>
        <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
          Edges: {graphData.links.length}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[480px] bg-[#0e0e10] border border-white/[0.06] shadow-2xl z-20">
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5" style={{ backgroundColor: getNodeColor(selectedNode) }} />
              <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-tight">
                {selectedNode.label}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-700 hover:text-zinc-400 text-[10px] font-mono uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="px-5 py-4 flex gap-6 text-[10px] font-mono">
            <div className="space-y-2">
              <div className="text-zinc-700 uppercase tracking-widest">Type</div>
              <div className="text-zinc-300 uppercase">{selectedNode.type}</div>
            </div>
            <div className="space-y-2">
              <div className="text-zinc-700 uppercase tracking-widest">Confidence</div>
              <div className="text-zinc-300">{(selectedNode.confidence * 100).toFixed(0)}%</div>
            </div>
            {selectedNode.severity && (
              <div className="space-y-2">
                <div className="text-zinc-700 uppercase tracking-widest">Severity</div>
                <div className="text-orange-400 uppercase">{selectedNode.severity}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
