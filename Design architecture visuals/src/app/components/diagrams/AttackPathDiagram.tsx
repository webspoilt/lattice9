import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface GraphNode {
  id: string;
  label: string;
  type: "entry" | "pivot" | "target" | "lateral";
  criticality: number;
}

interface GraphLink {
  source: string;
  target: string;
  weight: number;
  method: string;
}

export function AttackPathDiagram() {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const nodes: GraphNode[] = [
      { id: "n1", label: "WEB-01", type: "entry", criticality: 0.3 },
      { id: "n2", label: "APP-02", type: "pivot", criticality: 0.5 },
      { id: "n3", label: "DB-03", type: "pivot", criticality: 0.7 },
      { id: "n4", label: "AD-CTRL", type: "target", criticality: 0.95 },
      { id: "n5", label: "FILE-SRV", type: "lateral", criticality: 0.6 },
      { id: "n6", label: "JUMP-01", type: "lateral", criticality: 0.4 },
      { id: "n7", label: "MGMT-NET", type: "pivot", criticality: 0.8 },
      { id: "n8", label: "BACKUP-01", type: "lateral", criticality: 0.55 },
      { id: "n9", label: "DNS-01", type: "pivot", criticality: 0.65 },
      { id: "n10", label: "VPN-GW", type: "entry", criticality: 0.35 },
    ];
    
    const links: GraphLink[] = [
      { source: "n1", target: "n2", weight: 0.8, method: "SQLi" },
      { source: "n2", target: "n3", weight: 0.9, method: "Cred-Reuse" },
      { source: "n2", target: "n5", weight: 0.6, method: "SMB-Relay" },
      { source: "n3", target: "n4", weight: 0.95, method: "Pass-Hash" },
      { source: "n5", target: "n6", weight: 0.7, method: "Token-Theft" },
      { source: "n6", target: "n7", weight: 0.85, method: "RDP" },
      { source: "n7", target: "n4", weight: 0.9, method: "DCSync" },
      { source: "n1", target: "n9", weight: 0.5, method: "DNS-Poison" },
      { source: "n9", target: "n8", weight: 0.6, method: "AXFR" },
      { source: "n10", target: "n6", weight: 0.75, method: "VPN-Exploit" },
      { source: "n8", target: "n7", weight: 0.7, method: "Backup-Creds" },
    ];
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    svg.selectAll("*").remove();
    
    const g = svg.append("g");
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));
    
    // Draw links
    const link = g.append("g")
      .selectAll("g")
      .data(links)
      .join("g");
    
    link.append("line")
      .attr("stroke", "#000")
      .attr("stroke-width", (d) => d.weight * 2)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrowhead)");
    
    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    node.append("circle")
      .attr("r", (d) => 8 + d.criticality * 12)
      .attr("fill", (d) => {
        if (d.type === "entry") return "#fff";
        if (d.type === "target") return "#000";
        if (d.type === "pivot") return "#666";
        return "#ccc";
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 2);
    
    node.append("text")
      .text((d) => d.label)
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("dy", -20)
      .attr("text-anchor", "middle")
      .attr("fill", "#000");
    
    // Add criticality labels
    node.append("text")
      .text((d) => `C:${d.criticality.toFixed(2)}`)
      .attr("font-size", "7px")
      .attr("font-family", "monospace")
      .attr("dy", 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#666");
    
    // Arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
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
      
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);
    
  }, []);
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">ATTACK PATH ANALYSIS</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Graph-based lateral movement topology • Criticality scoring • Optimal attack vectors
        </p>
      </div>
      
      <div className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
        
        <div className="absolute top-4 right-4 bg-white border border-gray-300 p-3 font-mono text-[10px] space-y-1">
          <div className="font-bold mb-2">LEGEND</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-black bg-white rounded-full" />
            <span>Entry Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-black bg-gray-400 rounded-full" />
            <span>Pivot Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-black bg-black rounded-full" />
            <span>Target Asset</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-black bg-gray-200 rounded-full" />
            <span>Lateral Host</span>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 bg-white border border-gray-300 p-3 font-mono text-[10px]">
          <div>METRICS</div>
          <div className="mt-2 space-y-1 text-gray-600">
            <div>Nodes: 10</div>
            <div>Edges: 11</div>
            <div>Avg Criticality: 0.62</div>
            <div>Max Path Length: 4</div>
          </div>
        </div>
      </div>
    </div>
  );
}
