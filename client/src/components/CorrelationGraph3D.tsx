import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

export type AnalysisMode = "confidence" | "pressure" | "resistance" | "entropy" | "attractor" | "geometry" | "temporal";

const TYPE_COLORS: Record<string, string> = {
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
const DEFAULT_NODE_COLOR = "#6b7280";
const LINK_TYPE_COLORS: Record<string, string> = {
  RESOLVES_TO: "rgba(99, 102, 241, 0.3)",
  HOSTS: "rgba(0, 217, 255, 0.25)",
  HAS_FINDING: "rgba(249, 115, 22, 0.35)",
  ATTACK_PATH: "rgba(239, 68, 68, 0.45)",
};
const DEFAULT_LINK_COLOR = "rgba(255, 255, 255, 0.08)";

interface GraphNode { id: string; label: string; type: string; confidence: number; severity?: string; x?: number; y?: number; z?: number; }
interface GraphLink { source: string; target: string; type: string; confidence: number; }
interface GraphData { nodes: GraphNode[]; links: GraphLink[]; }

interface OverlayData {
  fieldPressure?: Record<string, number>;
  edgeResistance?: Array<{ source: string; target: string; resistance: number }>;
  attractors?: Array<{ id: string; name: string; attractor_strength: number }>;
  curvature?: Record<string, number>;
}

interface GraphCognitionEngineProps {
  engagementId: string;
  graphData: GraphData;
  analysisMode: AnalysisMode;
  overlayData?: OverlayData;
  temporalStep?: number;
  selectedNodeId?: string | null;
  onNodeSelect?: (node: GraphNode | null) => void;
}

function pressureToColor(p: number): string {
  const t = Math.min(1, Math.max(0, p));
  const r = Math.round(t * 239);
  const g = Math.round((1 - t) * 217 + t * 68);
  const b = Math.round((1 - t) * 255);
  return `rgb(${r},${g},${b})`;
}

function curvatureToColor(k: number): string {
  const t = Math.min(1, Math.max(0, k));
  const r = Math.round(t * 245);
  const g = Math.round((1 - t) * 158);
  const b = Math.round((1 - t) * 11);
  return `rgb(${r},${g},${b})`;
}

export function GraphCognitionEngine({
  graphData, analysisMode, overlayData, temporalStep, selectedNodeId, onNodeSelect,
}: GraphCognitionEngineProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeObjectsRef = useRef<Map<string, THREE.Group>>(new Map());
  const tickRef = useRef(0);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const activeNodeId = selectedNodeId || hoverNode?.id || null;

  const modeForces = useMemo(() => ({
    confidence: { charge: -80, link: 60, alpha: 0.02, velocity: 0.3 },
    pressure: { charge: -120, link: 50, alpha: 0.015, velocity: 0.25 },
    resistance: { charge: -60, link: 80, alpha: 0.025, velocity: 0.35 },
    entropy: { charge: -100, link: 65, alpha: 0.03, velocity: 0.4 },
    attractor: { charge: -150, link: 40, alpha: 0.01, velocity: 0.2 },
    geometry: { charge: -90, link: 55, alpha: 0.02, velocity: 0.3 },
    temporal: { charge: -80, link: 60, alpha: 0.02, velocity: 0.3 },
  }), []);

  const forces = modeForces[analysisMode] || modeForces.confidence;

  const resistanceMap = useMemo(() => {
    if (!overlayData?.edgeResistance) return null;
    const m = new Map<string, number>();
    for (const e of overlayData.edgeResistance) {
      m.set(`${e.source}|${e.target}`, e.resistance);
      m.set(`${e.target}|${e.source}`, e.resistance);
    }
    return m;
  }, [overlayData?.edgeResistance]);

  const attractorSet = useMemo(() => {
    if (!overlayData?.attractors) return new Set<string>();
    return new Set(overlayData.attractors.map(a => a.id));
  }, [overlayData?.attractors]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg?.d3Force) return;
    try {
      fg.d3Force("charge")?.strength(forces.charge);
      fg.d3Force("link")?.distance(forces.link);
      fg.d3AlphaDecay(forces.alpha);
      fg.d3VelocityDecay(forces.velocity);
      fg.d3ReheatSimulation();
    } catch {}
  }, [forces.charge, forces.link, forces.alpha, forces.velocity]);

  const getNodeColor = useCallback((node: GraphNode): string => {
    if (activeNodeId && node.id !== activeNodeId) {
      const base = TYPE_COLORS[node.type] || DEFAULT_NODE_COLOR;
      const c = new THREE.Color(base);
      c.multiplyScalar(0.3);
      return c.getStyle();
    }
    if (analysisMode === "pressure" && overlayData?.fieldPressure) {
      const p = overlayData.fieldPressure[node.id] || 0;
      return pressureToColor(p);
    }
    if (analysisMode === "geometry" && overlayData?.curvature) {
      const k = overlayData.curvature[node.id] || 0;
      return curvatureToColor(k);
    }
    if (analysisMode === "attractor" && attractorSet.has(node.id)) {
      return "#ff6b35";
    }
    if (analysisMode === "entropy") {
      const c = 0.5 + (1 - node.confidence) * 0.5;
      return `rgb(${Math.round(c * 245)}, ${Math.round(c * 158)}, ${Math.round(c * 11)})`;
    }
    return TYPE_COLORS[node.type] || DEFAULT_NODE_COLOR;
  }, [analysisMode, overlayData, activeNodeId, attractorSet]);

  const nodeThreeObject = useCallback((node: GraphNode) => {
    const color = getNodeColor(node);
    const baseSize = 0.6 + node.confidence * 2.5;
    const isActive = node.id === activeNodeId;
    const isAttractor = attractorSet.has(node.id);

    const group = new THREE.Group();
    const size = baseSize * (isActive ? 1.5 : isAttractor ? 1.3 : 1);

    const sphereGeom = new THREE.SphereGeometry(size, 12, 10);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: isActive ? 1 : 0.7 + node.confidence * 0.3,
    });
    group.add(new THREE.Mesh(sphereGeom, sphereMat));

    if (analysisMode === "attractor" && isAttractor) {
      const ringGeom = new THREE.RingGeometry(size * 1.2, size * 1.5, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff6b35"),
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    if (node.confidence < 0.4) {
      const glowGeom = new THREE.SphereGeometry(size * 1.8, 12, 10);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#f59e0b"),
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(glowGeom, glowMat));
    }

    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 192;
    labelCanvas.height = 48;
    const ctx = labelCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, 192, 48);
    ctx.font = "bold 14px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)";
    ctx.fillText(node.label.toUpperCase(), 96, 24);

    if (node.confidence < 0.5) {
      ctx.fillStyle = "rgba(245, 158, 11, 0.6)";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillText(`? ${(node.confidence * 100).toFixed(0)}%`, 96, 44);
    }

    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = -size - 2.5;
    sprite.scale.set(18, 4.5, 1);
    group.add(sprite);

    group.userData.nodeId = node.id;
    group.userData.confidence = node.confidence;
    nodeObjectsRef.current.set(node.id, group);
    return group;
  }, [getNodeColor, analysisMode, activeNodeId, attractorSet]);

  const getLinkColor = useCallback((link: any): string => {
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;
    const isAdj = activeNodeId && (srcId === activeNodeId || tgtId === activeNodeId);

    if (analysisMode === "resistance" && resistanceMap) {
      const r = resistanceMap.get(`${srcId}|${tgtId}`);
      if (r !== undefined) {
        const t = Math.min(1, r / 2);
        return `rgba(${Math.round(t * 239)}, ${Math.round((1 - t) * 68)}, ${Math.round((1 - t) * 36)}, ${isAdj ? 0.8 : 0.3})`;
      }
    }

    const base = LINK_TYPE_COLORS[link.type] || DEFAULT_LINK_COLOR;
    if (isAdj) return base.replace(/[\d.]+\)$/, "0.8)");
    return base;
  }, [analysisMode, resistanceMap, activeNodeId]);

  const getLinkWidth = useCallback((link: any): number => {
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;
    const isAdj = activeNodeId && (srcId === activeNodeId || tgtId === activeNodeId);

    if (analysisMode === "resistance" && resistanceMap) {
      const r = resistanceMap.get(`${srcId}|${tgtId}`);
      if (r !== undefined) return Math.max(0.2, (1 - r) * 2) * (isAdj ? 2 : 1);
    }

    return (0.2 + link.confidence * 0.6) * (isAdj ? 2 : 1);
  }, [analysisMode, resistanceMap, activeNodeId]);

  const isHighlighted = useCallback((node: GraphNode, link: any): boolean => {
    if (!activeNodeId) return false;
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;
    return node.id === activeNodeId || srcId === activeNodeId || tgtId === activeNodeId;
  }, [activeNodeId]);

  const isNodeHighlighted = useCallback((node: GraphNode): boolean => {
    if (!activeNodeId) return true;
    if (node.id === activeNodeId) return true;
    for (const link of graphData.links) {
      const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;
      if ((srcId === activeNodeId && tgtId === node.id) || (tgtId === activeNodeId && srcId === node.id)) return true;
    }
    return false;
  }, [activeNodeId, graphData.links]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    onNodeSelect?.(selectedNodeId === node.id ? null : node);
  }, [onNodeSelect, selectedNodeId]);

  const modeLabel = useMemo(() => ({
    confidence: "CONFIDENCE PROPAGATION",
    pressure: "ATTACK PRESSURE FIELD",
    resistance: "TOPOLOGICAL RESISTANCE",
    entropy: "SHANNON ENTROPY",
    attractor: "COMPROMISE ATTRACTORS",
    geometry: "MANIFOLD CURVATURE",
    temporal: "TEMPORAL EVOLUTION",
  }), []);

  if (!graphData.nodes.length) {
    return (
      <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0b]">
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
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0b]">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="#0a0a0b"
        nodeRelSize={0.6}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkOpacity={analysisMode === "entropy" ? 0.4 : 0.6}
        nodeThreeObject={nodeThreeObject}
        onNodeClick={handleNodeClick}
        onNodeHover={setHoverNode}
        d3AlphaDecay={forces.alpha}
        d3VelocityDecay={forces.velocity}
        enableNodeDrag={false}
        enableNavigationControls={true}
        showNavInfo={false}
        rendererConfig={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      />

      {/* Mode indicator */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="text-[8px] font-mono text-cyan-700 uppercase tracking-[0.3em]">{modeLabel[analysisMode]}</div>
      </div>

      {/* Disconnected warning */}
      {graphData.nodes.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-3 z-10 pointer-events-none">
          <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
            N: {graphData.nodes.length}
          </div>
          <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
            E: {graphData.links.length}
          </div>
          {analysisMode === "entropy" && (
            <div className="text-[9px] font-mono text-amber-700 uppercase tracking-widest">
              UNCERTAINTY: {graphData.nodes.filter(n => n.confidence < 0.5).length}
            </div>
          )}
          {analysisMode === "pressure" && overlayData?.fieldPressure && (
            <div className="text-[9px] font-mono text-cyan-700 uppercase tracking-widest">
              WELLS: {Object.values(overlayData.fieldPressure).filter(v => v > 0.6).length}
            </div>
          )}
          {analysisMode === "attractor" && (
            <div className="text-[9px] font-mono text-orange-700 uppercase tracking-widest">
              ATTRACTORS: {attractorSet.size}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
