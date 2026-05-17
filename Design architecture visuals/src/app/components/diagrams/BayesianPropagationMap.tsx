import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface BayesianNode {
  id: string;
  label: string;
  prior: number;
  posterior: number;
  evidence: number;
}

export function BayesianPropagationMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const nodes: BayesianNode[] = [
      { id: "b1", label: "INITIAL_COMPROMISE", prior: 0.15, posterior: 0.87, evidence: 0.92 },
      { id: "b2", label: "CREDENTIAL_THEFT", prior: 0.25, posterior: 0.76, evidence: 0.81 },
      { id: "b3", label: "PRIVILEGE_ESC", prior: 0.18, posterior: 0.69, evidence: 0.73 },
      { id: "b4", label: "LATERAL_SPREAD", prior: 0.12, posterior: 0.58, evidence: 0.64 },
      { id: "b5", label: "PERSISTENCE", prior: 0.20, posterior: 0.72, evidence: 0.78 },
      { id: "b6", label: "DATA_EXFIL", prior: 0.08, posterior: 0.41, evidence: 0.52 },
      { id: "b7", label: "C2_ESTABLISH", prior: 0.22, posterior: 0.79, evidence: 0.84 },
      { id: "b8", label: "DEFENSE_EVASION", prior: 0.16, posterior: 0.63, evidence: 0.69 },
    ];
    
    const links = [
      { source: "b1", target: "b2", conditional: 0.85 },
      { source: "b2", target: "b3", conditional: 0.78 },
      { source: "b3", target: "b4", conditional: 0.72 },
      { source: "b2", target: "b5", conditional: 0.81 },
      { source: "b1", target: "b7", conditional: 0.88 },
      { source: "b7", target: "b8", conditional: 0.76 },
      { source: "b5", target: "b4", conditional: 0.69 },
      { source: "b4", target: "b6", conditional: 0.65 },
      { source: "b8", target: "b6", conditional: 0.58 },
    ];
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    svg.selectAll("*").remove();
    
    const g = svg.append("g");
    
    // Hierarchical layout
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("y", d3.forceY(height / 2).strength(0.1));
    
    // Draw probability flow fields
    const defs = g.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "prob-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#000")
      .attr("stop-opacity", 0.1);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#000")
      .attr("stop-opacity", 0.4);
    
    // Links with conditional probabilities
    const link = g.append("g")
      .selectAll("g")
      .data(links)
      .join("g");
    
    link.append("line")
      .attr("stroke", "#000")
      .attr("stroke-width", (d) => d.conditional * 3)
      .attr("stroke-opacity", 0.4)
      .attr("marker-end", "url(#arrow-bayes)");
    
    link.append("text")
      .attr("font-size", "8px")
      .attr("font-family", "monospace")
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text((d) => `P=${d.conditional.toFixed(2)}`);
    
    // Nodes with probability distributions
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g");
    
    // Outer circle (evidence)
    node.append("circle")
      .attr("r", 45)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .attr("stroke-opacity", 0.3);
    
    // Middle circle (posterior)
    node.append("circle")
      .attr("r", (d) => 15 + d.posterior * 20)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("fill-opacity", (d) => d.posterior * 0.2);
    
    // Inner circle (prior)
    node.append("circle")
      .attr("r", (d) => 10 + d.prior * 15)
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5);
    
    // Labels
    node.append("text")
      .text((d) => d.label)
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("dy", -55)
      .attr("text-anchor", "middle")
      .attr("fill", "#000");
    
    // Probability values
    node.append("text")
      .text((d) => `π=${d.prior.toFixed(2)}`)
      .attr("font-size", "7px")
      .attr("font-family", "monospace")
      .attr("dy", 55)
      .attr("text-anchor", "middle")
      .attr("fill", "#666");
    
    node.append("text")
      .text((d) => `P=${d.posterior.toFixed(2)}`)
      .attr("font-size", "7px")
      .attr("font-family", "monospace")
      .attr("dy", 63)
      .attr("text-anchor", "middle")
      .attr("fill", "#000");
    
    // Arrow marker
    defs.append("marker")
      .attr("id", "arrow-bayes")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 40)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#000");
    
    simulation.on("tick", () => {
      link.select("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      
      link.select("text")
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 5);
      
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);
    
  }, []);
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">BAYESIAN BELIEF PROPAGATION</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Probabilistic inference network • Prior/posterior distributions • Conditional dependencies
        </p>
      </div>
      
      <div className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
        
        <div className="absolute top-4 right-4 bg-white border border-gray-300 p-3 font-mono text-[10px] space-y-2">
          <div className="font-bold">NOTATION</div>
          <div>π = Prior probability</div>
          <div>P = Posterior probability</div>
          <div>Edge weight = P(Y|X)</div>
          <div className="pt-2 border-t border-gray-300">
            <div className="font-bold mb-1">INFERENCE</div>
            <div className="text-gray-600">Message passing</div>
            <div className="text-gray-600">Belief updates</div>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 bg-white border border-gray-300 p-3 font-mono text-[10px]">
          <div className="font-bold">CONVERGENCE METRICS</div>
          <div className="mt-2 space-y-1 text-gray-600">
            <div>Iterations: 47</div>
            <div>ε-tolerance: 0.001</div>
            <div>Max Δ belief: 0.003</div>
            <div>Status: CONVERGED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
