export function OperationalCognitionWorkflow() {
  const cognitionLayers = [
    { layer: "PERCEPTION", processes: ["Signal Detection", "Pattern Recognition", "Anomaly Identification"], latency: "12ms" },
    { layer: "COMPREHENSION", processes: ["Context Analysis", "Threat Classification", "Impact Assessment"], latency: "45ms" },
    { layer: "PROJECTION", processes: ["Behavior Prediction", "Attack Forecasting", "Risk Modeling"], latency: "128ms" },
    { layer: "DECISION", processes: ["Strategy Selection", "Resource Allocation", "Action Planning"], latency: "67ms" },
    { layer: "EXECUTION", processes: ["Countermeasure Deploy", "System Hardening", "Response Coordination"], latency: "34ms" },
  ];
  
  const cognitiveLoop = [
    { stage: "OBSERVE", input: "Network telemetry", output: "Event stream", cycles: 1847 },
    { stage: "ORIENT", input: "Event stream", output: "Threat model", cycles: 1234 },
    { stage: "DECIDE", input: "Threat model", output: "Action plan", cycles: 892 },
    { stage: "ACT", input: "Action plan", output: "Countermeasures", cycles: 1156 },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">OPERATIONAL COGNITION WORKFLOW</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Decision-making architecture • OODA loop implementation • Cognitive layering
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Cognitive Architecture */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-6">COGNITIVE ARCHITECTURE STACK</div>
            
            <div className="space-y-3">
              {cognitionLayers.map((layer, i) => (
                <div key={i} className="relative">
                  <div className="border-2 border-black p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono text-xs font-bold">
                        L{cognitionLayers.length - i}: {layer.layer}
                      </div>
                      <div className="font-mono text-[10px] text-gray-600">
                        τ = {layer.latency}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {layer.processes.map((process, j) => (
                        <div 
                          key={j} 
                          className="border border-gray-300 p-2 text-center font-mono text-[10px] bg-white"
                        >
                          {process}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {i < cognitionLayers.length - 1 && (
                    <div className="flex justify-center my-2">
                      <svg width="20" height="20">
                        <line x1="10" y1="0" x2="10" y2="15" stroke="black" strokeWidth="2" />
                        <polygon points="10,20 6,12 14,12" fill="black" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 border-t border-gray-300 pt-4 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Total cognitive latency:</span>
                <span className="font-bold">286ms</span>
              </div>
            </div>
          </div>
          
          {/* OODA Loop */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-6">OODA LOOP IMPLEMENTATION</div>
            
            <div className="relative">
              <svg className="w-full h-80" viewBox="0 0 800 320">
                {/* Central loop structure */}
                <defs>
                  <marker id="arrow-ooda" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
                  </marker>
                </defs>
                
                {/* Loop arrows */}
                <path 
                  d="M 400 80 A 100 100 0 0 1 500 180" 
                  fill="none" 
                  stroke="black" 
                  strokeWidth="3"
                  markerEnd="url(#arrow-ooda)"
                />
                <path 
                  d="M 500 180 A 100 100 0 0 1 400 280" 
                  fill="none" 
                  stroke="black" 
                  strokeWidth="3"
                  markerEnd="url(#arrow-ooda)"
                />
                <path 
                  d="M 400 280 A 100 100 0 0 1 300 180" 
                  fill="none" 
                  stroke="black" 
                  strokeWidth="3"
                  markerEnd="url(#arrow-ooda)"
                />
                <path 
                  d="M 300 180 A 100 100 0 0 1 400 80" 
                  fill="none" 
                  stroke="black" 
                  strokeWidth="3"
                  markerEnd="url(#arrow-ooda)"
                />
                
                {/* Loop stages */}
                {[
                  { x: 400, y: 40, label: "OBSERVE", sublabel: "Data Collection" },
                  { x: 540, y: 180, label: "ORIENT", sublabel: "Situation Analysis" },
                  { x: 400, y: 320, label: "DECIDE", sublabel: "Action Selection" },
                  { x: 260, y: 180, label: "ACT", sublabel: "Execute Response" },
                ].map((stage, i) => (
                  <g key={i}>
                    <rect 
                      x={stage.x - 60} 
                      y={stage.y - 20} 
                      width="120" 
                      height="40" 
                      fill="white"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <text 
                      x={stage.x} 
                      y={stage.y - 2} 
                      textAnchor="middle" 
                      fontSize="12" 
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="black"
                    >
                      {stage.label}
                    </text>
                    <text 
                      x={stage.x} 
                      y={stage.y + 12} 
                      textAnchor="middle" 
                      fontSize="9" 
                      fontFamily="monospace"
                      fill="gray"
                    >
                      {stage.sublabel}
                    </text>
                  </g>
                ))}
                
                {/* External inputs */}
                {[
                  { x: 50, y: 40, label: "Threat Intel", targetX: 340, targetY: 40 },
                  { x: 650, y: 40, label: "Context Data", targetX: 460, targetY: 40 },
                  { x: 650, y: 320, label: "Feedback Loop", targetX: 460, targetY: 320 },
                ].map((input, i) => (
                  <g key={i}>
                    <rect 
                      x={input.x - 50} 
                      y={input.y - 15} 
                      width="100" 
                      height="30" 
                      fill="white"
                      stroke="black"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <text 
                      x={input.x} 
                      y={input.y + 5} 
                      textAnchor="middle" 
                      fontSize="9" 
                      fontFamily="monospace"
                      fill="gray"
                    >
                      {input.label}
                    </text>
                    <line 
                      x1={input.x > 400 ? input.x - 50 : input.x + 50} 
                      y1={input.y} 
                      x2={input.targetX} 
                      y2={input.targetY} 
                      stroke="gray"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      markerEnd="url(#arrow-ooda)"
                    />
                  </g>
                ))}
                
                {/* Center label */}
                <text x="400" y="175" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="black">
                  COGNITIVE
                </text>
                <text x="400" y="195" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="black">
                  LOOP
                </text>
              </svg>
            </div>
            
            <div className="mt-6 grid grid-cols-4 gap-4 font-mono text-[10px]">
              {cognitiveLoop.map((stage, i) => (
                <div key={i} className="border border-gray-300 p-3">
                  <div className="font-bold mb-2">{stage.stage}</div>
                  <div className="space-y-1 text-gray-600">
                    <div>In: {stage.input}</div>
                    <div>Out: {stage.output}</div>
                    <div className="border-t border-gray-300 pt-1 mt-2">
                      <div className="text-black font-bold">{stage.cycles.toLocaleString()} cycles/hr</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Decision Tree */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">DECISION TREE</div>
              
              <div className="space-y-2 font-mono text-[10px]">
                <div className="border-2 border-black p-2 bg-white">
                  <div className="font-bold">ROOT: Threat Detected</div>
                </div>
                
                <div className="ml-4 space-y-2">
                  <div className="border border-black p-2">
                    <div className="font-bold">Severity &gt; 0.7?</div>
                  </div>
                  
                  <div className="ml-4 space-y-2">
                    <div className="border border-gray-300 p-2 bg-gray-50">
                      <div className="text-gray-600">YES → Immediate Response</div>
                      <div className="ml-3 mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-black" />
                          <span>Isolate affected nodes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-black" />
                          <span>Alert security team</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-black" />
                          <span>Capture forensics</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-300 p-2 bg-gray-50">
                      <div className="text-gray-600">NO → Analyze Pattern</div>
                      <div className="ml-3 mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400" />
                          <span>Correlate events</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400" />
                          <span>Monitor progression</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400" />
                          <span>Update threat model</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">WORKFLOW METRICS</div>
              
              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[10px] text-gray-600 mb-2">Decision Accuracy</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: '87%' }} />
                    </div>
                    <span className="font-mono text-[10px] font-bold w-12">87%</span>
                  </div>
                </div>
                
                <div>
                  <div className="font-mono text-[10px] text-gray-600 mb-2">Response Time (p95)</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: '68%' }} />
                    </div>
                    <span className="font-mono text-[10px] font-bold w-12">342ms</span>
                  </div>
                </div>
                
                <div>
                  <div className="font-mono text-[10px] text-gray-600 mb-2">Automation Level</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: '76%' }} />
                    </div>
                    <span className="font-mono text-[10px] font-bold w-12">76%</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-300 pt-3 mt-3 space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">True Positives</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">False Positives</span>
                    <span className="font-bold">183</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precision</span>
                    <span className="font-bold">0.872</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recall</span>
                    <span className="font-bold">0.894</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Knowledge Base */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">KNOWLEDGE BASE INTEGRATION</div>
            
            <div className="grid grid-cols-4 gap-4">
              {[
                { source: "MITRE ATT&CK", techniques: 187, coverage: 0.84 },
                { source: "Threat Intel Feeds", indicators: 45823, freshness: 0.92 },
                { source: "Historical Incidents", cases: 1247, relevance: 0.78 },
                { source: "ML Models", models: 12, accuracy: 0.89 },
              ].map((kb, i) => (
                <div key={i} className="border border-gray-300 p-3">
                  <div className="font-mono text-[10px] font-bold mb-3 pb-2 border-b border-gray-300">
                    {kb.source}
                  </div>
                  <div className="space-y-2 text-[10px] font-mono">
                    {Object.entries(kb).filter(([key]) => key !== 'source').map(([key, value], j) => (
                      <div key={j} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className="font-bold">
                          {typeof value === 'number' && value < 1 
                            ? (value * 100).toFixed(0) + '%'
                            : typeof value === 'number'
                            ? value.toLocaleString()
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Response Playbook */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">AUTOMATED RESPONSE PLAYBOOK</div>
            
            <table className="w-full font-mono text-[10px]">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">TRIGGER CONDITION</th>
                  <th className="text-left py-2">RESPONSE ACTION</th>
                  <th className="text-right py-2">CONFIDENCE</th>
                  <th className="text-right py-2">AUTO</th>
                  <th className="text-right py-2">EXECUTIONS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { trigger: "Malware detected", action: "Isolate host + scan neighbors", confidence: 0.95, auto: true, count: 247 },
                  { trigger: "Privilege escalation", action: "Revoke credentials + alert SOC", confidence: 0.88, auto: true, count: 89 },
                  { trigger: "Data exfiltration", action: "Block egress + preserve evidence", confidence: 0.92, auto: true, count: 34 },
                  { trigger: "Lateral movement", action: "Segment network + monitor flows", confidence: 0.79, auto: false, count: 156 },
                  { trigger: "C2 communication", action: "DNS sinkhole + capture traffic", confidence: 0.91, auto: true, count: 67 },
                ].map((playbook, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2">{playbook.trigger}</td>
                    <td className="py-2 text-gray-600">{playbook.action}</td>
                    <td className="text-right">{playbook.confidence.toFixed(2)}</td>
                    <td className="text-right">
                      <span className={`font-bold ${playbook.auto ? 'text-black' : 'text-gray-400'}`}>
                        {playbook.auto ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="text-right">{playbook.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
