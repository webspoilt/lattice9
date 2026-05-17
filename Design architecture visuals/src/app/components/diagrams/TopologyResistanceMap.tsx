import { useEffect, useRef } from "react";

export function TopologyResistanceMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width / 2, height / 2);
    
    // Draw network topology with vulnerability zones
    const centerX = width / 4;
    const centerY = height / 4;
    const layers = [
      { radius: 40, nodes: 4, label: "CORE", resistance: 0.95 },
      { radius: 90, nodes: 8, label: "DIST", resistance: 0.72 },
      { radius: 140, nodes: 16, label: "ACCESS", resistance: 0.45 },
      { radius: 190, nodes: 24, label: "EDGE", resistance: 0.23 },
    ];
    
    // Draw vulnerability heat zones
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    
    layers.forEach((layer, layerIdx) => {
      // Draw layer circle
      const alpha = layer.resistance * 0.2;
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, layer.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Draw nodes
      for (let i = 0; i < layer.nodes; i++) {
        const angle = (i / layer.nodes) * 2 * Math.PI;
        const x = centerX + layer.radius * Math.cos(angle);
        const y = centerY + layer.radius * Math.sin(angle);
        
        // Node
        ctx.fillStyle = layer.resistance > 0.7 ? "#000" : "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Connections to inner layer
        if (layerIdx > 0) {
          const innerLayer = layers[layerIdx - 1];
          const innerNodeIdx = Math.floor(i / 2) % innerLayer.nodes;
          const innerAngle = (innerNodeIdx / innerLayer.nodes) * 2 * Math.PI;
          const innerX = centerX + innerLayer.radius * Math.cos(innerAngle);
          const innerY = centerY + innerLayer.radius * Math.sin(innerAngle);
          
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(innerX, innerY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      
      // Layer label
      ctx.fillStyle = "#000";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      const labelX = centerX + layer.radius * Math.cos(Math.PI / 4);
      const labelY = centerY + layer.radius * Math.sin(Math.PI / 4);
      ctx.fillText(layer.label, labelX, labelY);
    });
    
  }, []);
  
  const vulnerabilities = [
    { type: "Single Point of Failure", severity: 0.92, location: "Core Router", mitigation: "Redundancy" },
    { type: "Unpatched Systems", severity: 0.78, location: "Access Layer", mitigation: "Patch Mgmt" },
    { type: "Weak Authentication", severity: 0.85, location: "Edge Devices", mitigation: "MFA" },
    { type: "Lateral Movement Path", severity: 0.71, location: "Distribution", mitigation: "Segmentation" },
  ];
  
  const resistanceMetrics = [
    { metric: "Redundancy Factor", value: "2.4", target: "≥3.0" },
    { metric: "Isolation Score", value: "0.67", target: "≥0.80" },
    { metric: "Recovery Time", value: "142s", target: "≤120s" },
    { metric: "Path Diversity", value: "3.2", target: "≥4.0" },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">TOPOLOGY RESISTANCE ANALYSIS</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Vulnerability mapping • Attack surface reduction • Resilience scoring
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Main Topology Map */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">NETWORK TOPOLOGY RESISTANCE MAP</div>
              <canvas ref={canvasRef} className="w-full h-96 border border-gray-200" />
              
              <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] font-mono">
                {[
                  { label: "CORE", res: "0.95" },
                  { label: "DIST", res: "0.72" },
                  { label: "ACCESS", res: "0.45" },
                  { label: "EDGE", res: "0.23" },
                ].map((l, i) => (
                  <div key={i} className="text-center">
                    <div className="font-bold">{l.label}</div>
                    <div className="text-gray-600">R={l.res}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">VULNERABILITY ASSESSMENT</div>
              
              <div className="space-y-4">
                {vulnerabilities.map((vuln, i) => (
                  <div key={i} className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-[10px] font-bold">{vuln.type}</div>
                      <div className="font-mono text-[10px] text-gray-600">
                        {(vuln.severity * 10).toFixed(1)}/10
                      </div>
                    </div>
                    
                    <div className="w-full h-2 bg-gray-200 mb-2">
                      <div 
                        className="h-full bg-black" 
                        style={{ width: `${vuln.severity * 100}%` }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-600">
                      <div>
                        <span className="text-black">Location:</span> {vuln.location}
                      </div>
                      <div>
                        <span className="text-black">Mitigation:</span> {vuln.mitigation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 border border-gray-300 bg-gray-50">
                <div className="font-mono text-[10px]">
                  <div className="font-bold mb-2">OVERALL RESISTANCE SCORE</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: '62%' }} />
                    </div>
                    <div className="font-bold">6.2/10</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Attack Surface Analysis */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-4">ATTACK SURFACE ANALYSIS</div>
            
            <div className="grid grid-cols-4 gap-6">
              {[
                { category: "NETWORK", exposed: 47, hardened: 12, ratio: 0.74 },
                { category: "APPLICATION", exposed: 128, hardened: 34, ratio: 0.79 },
                { category: "IDENTITY", exposed: 89, hardened: 56, ratio: 0.61 },
                { category: "DATA", exposed: 234, hardened: 187, ratio: 0.20 },
              ].map((surface, i) => (
                <div key={i} className="border border-gray-300 p-3">
                  <div className="font-mono text-[10px] font-bold mb-3">{surface.category}</div>
                  
                  <div className="space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exposed</span>
                      <span>{surface.exposed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hardened</span>
                      <span>{surface.hardened}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-300 pt-2 mt-2">
                      <span>Risk Ratio</span>
                      <span>{surface.ratio.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 h-20">
                    <svg className="w-full h-full" viewBox="0 0 100 80">
                      <rect x="10" y={60 - surface.ratio * 50} width="35" height={surface.ratio * 50} fill="black" />
                      <rect x="55" y={60 - (1 - surface.ratio) * 50} width="35" height={(1 - surface.ratio) * 50} fill="#ccc" stroke="black" strokeWidth="1" />
                      
                      <text x="27" y="75" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="black">
                        EXP
                      </text>
                      <text x="72" y="75" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="black">
                        HARD
                      </text>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resilience Metrics */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">RESILIENCE METRICS</div>
              
              <div className="space-y-3">
                {resistanceMetrics.map((metric, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1 text-[10px] font-mono">
                      <span className="font-bold">{metric.metric}</span>
                      <span className="text-gray-600">Target: {metric.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200">
                        <div 
                          className={`h-full ${parseFloat(metric.value) >= parseFloat(metric.target.replace(/[^0-9.]/g, '')) ? 'bg-black' : 'bg-gray-400'}`}
                          style={{ width: '65%' }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold w-16 text-right">
                        {metric.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">FAILURE MODE ANALYSIS</div>
              
              <table className="w-full font-mono text-[10px]">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2">FAILURE MODE</th>
                    <th className="text-right py-2">MTBF</th>
                    <th className="text-right py-2">IMPACT</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { mode: "Node failure", mtbf: "8760h", impact: "LOW" },
                    { mode: "Link failure", mtbf: "4380h", impact: "MED" },
                    { mode: "Zone failure", mtbf: "17520h", impact: "HIGH" },
                    { mode: "Cascading", mtbf: "35040h", impact: "CRIT" },
                  ].map((failure, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2">{failure.mode}</td>
                      <td className="text-right">{failure.mtbf}</td>
                      <td className="text-right">
                        <span className={`font-bold ${
                          failure.impact === "CRIT" ? "text-black" :
                          failure.impact === "HIGH" ? "text-gray-700" :
                          failure.impact === "MED" ? "text-gray-500" : "text-gray-400"
                        }`}>
                          {failure.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Hardening Recommendations */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">HARDENING RECOMMENDATIONS</div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  priority: "P0 - CRITICAL",
                  items: [
                    "Implement core redundancy",
                    "Deploy network segmentation",
                    "Enable multi-path routing"
                  ]
                },
                {
                  priority: "P1 - HIGH",
                  items: [
                    "Patch access layer systems",
                    "Strengthen authentication",
                    "Add intrusion detection"
                  ]
                },
                {
                  priority: "P2 - MEDIUM",
                  items: [
                    "Improve monitoring coverage",
                    "Update security policies",
                    "Conduct penetration tests"
                  ]
                }
              ].map((rec, i) => (
                <div key={i} className="border border-gray-300 p-3">
                  <div className="font-mono text-[10px] font-bold mb-3 pb-2 border-b border-gray-300">
                    {rec.priority}
                  </div>
                  <ul className="space-y-2 text-[10px] font-mono">
                    {rec.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-black mt-1.5 flex-shrink-0" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
