import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Event {
  id: string;
  type: string;
  timestamp: number;
  severity: number;
  propagation: number;
}

export function EventDrivenPropagation() {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const events: Event[] = [
      { id: "e1", type: "INTRUSION_DETECT", timestamp: 0, severity: 0.78, propagation: 0.3 },
      { id: "e2", type: "AUTH_FAILURE", timestamp: 120, severity: 0.45, propagation: 0.5 },
      { id: "e3", type: "LATERAL_MOVE", timestamp: 340, severity: 0.92, propagation: 0.8 },
      { id: "e4", type: "DATA_ACCESS", timestamp: 580, severity: 0.67, propagation: 0.6 },
      { id: "e5", type: "EXFIL_ATTEMPT", timestamp: 820, severity: 0.95, propagation: 0.9 },
      { id: "e6", type: "C2_CALLBACK", timestamp: 1100, severity: 0.88, propagation: 0.7 },
    ];
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    svg.selectAll("*").remove();
    
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(events, d => d.timestamp) || 1200])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);
    
    // Grid
    const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
    g.selectAll("line.grid-y")
      .data(yTicks)
      .join("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1);
    
    // Axes
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", innerHeight)
      .attr("y2", innerHeight)
      .attr("stroke", "#000")
      .attr("stroke-width", 2);
    
    g.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#000")
      .attr("stroke-width", 2);
    
    // Propagation waves
    events.forEach((event, i) => {
      const cx = xScale(event.timestamp);
      const cy = yScale(event.severity);
      
      // Outer propagation circle
      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", event.propagation * 40)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.3);
      
      // Event node
      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 6 + event.severity * 8)
        .attr("fill", event.severity > 0.8 ? "#000" : "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
      
      // Event label
      g.append("text")
        .attr("x", cx)
        .attr("y", cy - (6 + event.severity * 8) - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-family", "monospace")
        .attr("fill", "#000")
        .text(event.type);
      
      // Propagation arrows
      if (i < events.length - 1) {
        const nextEvent = events[i + 1];
        const nextCx = xScale(nextEvent.timestamp);
        const nextCy = yScale(nextEvent.severity);
        
        g.append("line")
          .attr("x1", cx)
          .attr("y1", cy)
          .attr("x2", nextCx)
          .attr("y2", nextCy)
          .attr("stroke", "#000")
          .attr("stroke-width", 2)
          .attr("opacity", 0.4)
          .attr("marker-end", "url(#arrow-event)");
      }
    });
    
    // Arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrow-event")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#000");
    
    // Axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .attr("fill", "#000")
      .text("TIME (seconds)");
    
    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .attr("fill", "#000")
      .attr("transform", `rotate(-90, -${innerHeight / 2}, -40)`)
      .text("SEVERITY");
    
    // Tick labels
    yTicks.forEach(tick => {
      g.append("text")
        .attr("x", -10)
        .attr("y", yScale(tick) + 4)
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("font-family", "monospace")
        .attr("fill", "#000")
        .text(tick.toFixed(2));
    });
    
    [0, 300, 600, 900, 1200].forEach(tick => {
      g.append("text")
        .attr("x", xScale(tick))
        .attr("y", innerHeight + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-family", "monospace")
        .attr("fill", "#000")
        .text(tick);
    });
    
  }, []);
  
  const eventChain = [
    { source: "INTRUSION_DETECT", target: "AUTH_FAILURE", delay: "120s", probability: 0.82 },
    { source: "AUTH_FAILURE", target: "LATERAL_MOVE", delay: "220s", probability: 0.91 },
    { source: "LATERAL_MOVE", target: "DATA_ACCESS", delay: "240s", probability: 0.76 },
    { source: "DATA_ACCESS", target: "EXFIL_ATTEMPT", delay: "240s", probability: 0.88 },
    { source: "EXFIL_ATTEMPT", target: "C2_CALLBACK", delay: "280s", probability: 0.79 },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">EVENT-DRIVEN PROPAGATION</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Temporal event sequencing • Causal propagation • Severity escalation
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Event Timeline */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">EVENT PROPAGATION TIMELINE</div>
            <svg ref={svgRef} className="w-full h-96" />
          </div>
          
          {/* Event Chain */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">CAUSAL EVENT CHAIN</div>
            
            <table className="w-full font-mono text-[10px]">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">SOURCE EVENT</th>
                  <th className="text-center py-2">PROPAGATION</th>
                  <th className="text-left py-2">TARGET EVENT</th>
                  <th className="text-right py-2">DELAY</th>
                  <th className="text-right py-2">P(CAUSAL)</th>
                </tr>
              </thead>
              <tbody>
                {eventChain.map((chain, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-3">{chain.source}</td>
                    <td className="text-center">
                      <svg width="80" height="20">
                        <defs>
                          <marker id={`arrow-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
                          </marker>
                        </defs>
                        <line x1="5" y1="10" x2="70" y2="10" stroke="black" strokeWidth="2" markerEnd={`url(#arrow-${i})`} />
                      </svg>
                    </td>
                    <td className="py-3">{chain.target}</td>
                    <td className="text-right">{chain.delay}</td>
                    <td className="text-right font-bold">{chain.probability.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Event Statistics */}
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">EVENT STATISTICS</div>
              
              <div className="space-y-3 text-[10px] font-mono">
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Total events</span>
                  <span className="font-bold">6</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Event chain length</span>
                  <span className="font-bold">5 hops</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Total duration</span>
                  <span className="font-bold">1100s</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Avg propagation delay</span>
                  <span className="font-bold">220s</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Avg severity</span>
                  <span className="font-bold">0.78</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chain probability</span>
                  <span className="font-bold">0.42</span>
                </div>
              </div>
            </div>
            
            {/* Propagation Patterns */}
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">PROPAGATION PATTERNS</div>
              
              <div className="space-y-4">
                {[
                  { pattern: "Linear cascade", frequency: 0.68, example: "A→B→C→D" },
                  { pattern: "Fan-out", frequency: 0.23, example: "A→[B,C,D]" },
                  { pattern: "Convergent", frequency: 0.15, example: "[A,B]→C" },
                  { pattern: "Cyclic", frequency: 0.09, example: "A→B→A" },
                ].map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-[10px]">{p.pattern}</span>
                      <span className="text-[10px] text-gray-600">{(p.frequency * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-200">
                        <div className="h-full bg-black" style={{ width: `${p.frequency * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-gray-600">{p.example}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Event Correlation Matrix */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">EVENT CORRELATION MATRIX</div>
            
            <div className="overflow-x-auto">
              <div className="inline-grid font-mono text-[9px]" style={{ gridTemplateColumns: 'auto repeat(6, 1fr)' }}>
                <div className="p-2"></div>
                {["INTRU", "AUTH", "LATER", "DATA", "EXFIL", "C2"].map((label) => (
                  <div key={label} className="p-2 font-bold text-center">{label}</div>
                ))}
                
                {[
                  ["-", 0.82, 0.34, 0.21, 0.18, 0.12],
                  [0.15, "-", 0.91, 0.42, 0.38, 0.28],
                  [0.08, 0.23, "-", 0.76, 0.68, 0.45],
                  [0.05, 0.12, 0.31, "-", 0.88, 0.62],
                  [0.03, 0.09, 0.18, 0.35, "-", 0.79],
                  [0.11, 0.16, 0.24, 0.29, 0.41, "-"],
                ].map((row, i) => (
                  <div key={i} className="contents">
                    <div className="p-2 font-bold">
                      {["INTRU", "AUTH", "LATER", "DATA", "EXFIL", "C2"][i]}
                    </div>
                    {row.map((val, j) => {
                      const numVal = typeof val === 'number' ? val : 0;
                      const intensity = val === "-" ? 0 : numVal * 255;
                      return (
                        <div 
                          key={j} 
                          className="p-2 text-center border border-gray-200"
                          style={{ 
                            backgroundColor: val === "-" ? "#f3f4f6" : `rgb(${255 - intensity}, ${255 - intensity}, ${255 - intensity})`
                          }}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 text-[10px] font-mono text-gray-600">
              Values represent P(row event | column event occurred)
            </div>
          </div>
          
          {/* Real-time Event Stream */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">SIMULATED EVENT STREAM</div>
            
            <div className="bg-black text-green-500 p-4 font-mono text-[10px] h-48 overflow-y-auto">
              {[
                "[T+0000] EVENT: INTRUSION_DETECT | SRC: 10.0.2.45 | SEVERITY: 0.78 | PROPAGATE: YES",
                "[T+0012] ALERT: Pattern match on known IOC | Confidence: HIGH",
                "[T+0120] EVENT: AUTH_FAILURE | SRC: 10.0.2.45 | USER: admin | ATTEMPTS: 5",
                "[T+0134] CORRELATION: Event chain detected (INTRUSION→AUTH) P=0.82",
                "[T+0340] EVENT: LATERAL_MOVE | SRC: 10.0.2.45 | DST: 10.0.3.12 | PROTO: SMB",
                "[T+0355] ALERT: Abnormal lateral movement detected | SEVERITY: 0.92",
                "[T+0580] EVENT: DATA_ACCESS | USER: admin | FILE: /etc/shadow | ACCESS: READ",
                "[T+0594] CORRELATION: Multi-stage attack confirmed | Chain P=0.56",
                "[T+0820] EVENT: EXFIL_ATTEMPT | DST: 185.220.101.45 | SIZE: 2.4GB | BLOCKED: NO",
                "[T+0835] ALERT: Critical data exfiltration in progress | SEVERITY: 0.95",
                "[T+1100] EVENT: C2_CALLBACK | DST: 185.220.101.45 | FREQ: 60s | ENCRYPTED: YES",
                "[T+1112] CORRELATION: Full kill chain executed | Total duration: 1100s",
              ].map((line, i) => (
                <div key={i} className="mb-1 text-white">{line}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
