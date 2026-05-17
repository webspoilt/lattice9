export function AttackEconomicsSystem() {
  const costBenefitNodes = [
    { id: "initial_access", cost: 2500, benefit: 3200, roi: 0.28, risk: 0.45 },
    { id: "privilege_esc", cost: 4800, benefit: 12400, roi: 1.58, risk: 0.62 },
    { id: "lateral_movement", cost: 3200, benefit: 8900, roi: 1.78, risk: 0.54 },
    { id: "persistence", cost: 1800, benefit: 15600, roi: 7.67, risk: 0.38 },
    { id: "data_exfil", cost: 6400, benefit: 48000, roi: 6.50, risk: 0.81 },
  ];
  
  const resourceAllocation = [
    { phase: "Reconnaissance", allocation: 15, hours: 120, cost: 3600 },
    { phase: "Weaponization", allocation: 8, hours: 64, cost: 1920 },
    { phase: "Delivery", allocation: 5, hours: 40, cost: 1200 },
    { phase: "Exploitation", allocation: 22, hours: 176, cost: 5280 },
    { phase: "Installation", allocation: 12, hours: 96, cost: 2880 },
    { phase: "C2", allocation: 18, hours: 144, cost: 4320 },
    { phase: "Actions", allocation: 20, hours: 160, cost: 4800 },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">ATTACK ECONOMICS ANALYSIS</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Cost-benefit modeling • Resource allocation • ROI optimization
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Cost-Benefit Matrix */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-4">COST-BENEFIT ANALYSIS MATRIX</div>
            
            <div className="relative h-96">
              <svg className="w-full h-full" viewBox="0 0 800 400">
                {/* Axes */}
                <line x1="100" y1="350" x2="750" y2="350" stroke="black" strokeWidth="2" />
                <line x1="100" y1="50" x2="100" y2="350" stroke="black" strokeWidth="2" />
                
                {/* Grid */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <g key={`grid-${i}`}>
                    <line 
                      x1="100" 
                      y1={350 - i * 60} 
                      x2="750" 
                      y2={350 - i * 60} 
                      stroke="#e5e7eb" 
                      strokeWidth="1"
                    />
                    <line 
                      x1={100 + i * 130} 
                      y1="350" 
                      x2={100 + i * 130} 
                      y2="50" 
                      stroke="#e5e7eb" 
                      strokeWidth="1"
                    />
                  </g>
                ))}
                
                {/* Risk zones */}
                <rect x="100" y="50" width="650" height="100" fill="black" opacity="0.05" />
                <text x="400" y="90" fontSize="10" fontFamily="monospace" fill="gray" textAnchor="middle">
                  HIGH RISK ZONE
                </text>
                
                {/* Data points */}
                {costBenefitNodes.map((node, i) => {
                  const x = 100 + (node.cost / 100);
                  const y = 350 - (node.benefit / 200);
                  const size = 30 + (node.roi * 10);
                  
                  return (
                    <g key={node.id}>
                      {/* Circle sized by ROI */}
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={size} 
                        fill="white"
                        stroke="black"
                        strokeWidth="2"
                        opacity={0.8}
                      />
                      
                      {/* Risk indicator */}
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={size * node.risk} 
                        fill="black"
                        opacity={0.2}
                      />
                      
                      {/* Label */}
                      <text 
                        x={x} 
                        y={y - size - 10} 
                        fontSize="9" 
                        fontFamily="monospace" 
                        fill="black"
                        textAnchor="middle"
                      >
                        {node.id.toUpperCase().replace(/_/g, ' ')}
                      </text>
                      
                      {/* ROI label */}
                      <text 
                        x={x} 
                        y={y + 4} 
                        fontSize="10" 
                        fontFamily="monospace" 
                        fill="black"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {node.roi.toFixed(1)}x
                      </text>
                    </g>
                  );
                })}
                
                {/* Axis labels */}
                <text x="425" y="385" fontSize="12" fontFamily="monospace" fill="black" textAnchor="middle">
                  COST ($K)
                </text>
                <text 
                  x="40" 
                  y="200" 
                  fontSize="12" 
                  fontFamily="monospace" 
                  fill="black"
                  textAnchor="middle"
                  transform="rotate(-90 40 200)"
                >
                  BENEFIT ($K)
                </text>
                
                {/* Axis tick labels */}
                {[0, 2, 4, 6, 8].map((val) => (
                  <text 
                    key={`x-${val}`}
                    x={100 + val * 81.25} 
                    y="370" 
                    fontSize="10" 
                    fontFamily="monospace" 
                    fill="black"
                    textAnchor="middle"
                  >
                    {val}
                  </text>
                ))}
                {[0, 10, 20, 30, 40, 50].map((val, i) => (
                  <text 
                    key={`y-${val}`}
                    x="85" 
                    y={355 - i * 60} 
                    fontSize="10" 
                    fontFamily="monospace" 
                    fill="black"
                    textAnchor="end"
                  >
                    {val}
                  </text>
                ))}
              </svg>
              
              <div className="absolute top-4 right-4 bg-white border border-gray-300 p-3 text-[10px] font-mono">
                <div className="font-bold mb-2">LEGEND</div>
                <div className="space-y-1">
                  <div>Circle size = ROI</div>
                  <div>Fill darkness = Risk</div>
                  <div>Position = Cost vs Benefit</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resource Allocation */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">RESOURCE ALLOCATION</div>
              
              <table className="w-full font-mono text-[10px]">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2">PHASE</th>
                    <th className="text-right py-2">%</th>
                    <th className="text-right py-2">HOURS</th>
                    <th className="text-right py-2">COST</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceAllocation.map((phase, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2">{phase.phase}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-200">
                            <div 
                              className="h-full bg-black" 
                              style={{ width: `${phase.allocation}%` }}
                            />
                          </div>
                          <span>{phase.allocation}%</span>
                        </div>
                      </td>
                      <td className="text-right">{phase.hours}h</td>
                      <td className="text-right font-bold">${phase.cost}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="py-2">TOTAL</td>
                    <td className="text-right">100%</td>
                    <td className="text-right">800h</td>
                    <td className="text-right">$24,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">OPTIMIZATION METRICS</div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-gray-600 mb-2">Efficiency Frontier</div>
                  <div className="h-32 border border-gray-200 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 120">
                      <path 
                        d="M 20 100 Q 80 80, 150 40 T 280 20" 
                        fill="none" 
                        stroke="black" 
                        strokeWidth="2"
                      />
                      <circle cx="80" cy="80" r="4" fill="black" />
                      <circle cx="150" cy="40" r="4" fill="black" />
                      <circle cx="220" cy="25" r="4" fill="black" />
                      
                      <text x="280" y="30" fontSize="8" fontFamily="monospace" fill="gray">
                        Optimal
                      </text>
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  <div>
                    <div className="text-gray-600">Total ROI</div>
                    <div className="font-bold">3.76x</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Payback Period</div>
                    <div className="font-bold">18.4 days</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Risk-Adj Return</div>
                    <div className="font-bold">2.14x</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Efficiency Score</div>
                    <div className="font-bold">0.82</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Economic Model */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-4">ECONOMIC MODEL</div>
            
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="font-mono text-[10px] font-bold mb-3">COST STRUCTURE</div>
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Infrastructure</span>
                    <span>$4,200</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Tools & Exploits</span>
                    <span>$8,600</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Labor (800h @ $30/h)</span>
                    <span>$24,000</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">OPSEC</span>
                    <span>$3,200</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Contingency (15%)</span>
                    <span>$6,000</span>
                  </div>
                  <div className="flex justify-between font-bold border-t-2 border-gray-300 pt-2 mt-2">
                    <span>TOTAL COST</span>
                    <span>$46,000</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-mono text-[10px] font-bold mb-3">REVENUE STREAMS</div>
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Data monetization</span>
                    <span>$84,000</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Ransomware</span>
                    <span>$120,000</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Access resale</span>
                    <span>$28,000</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Cryptojacking</span>
                    <span>$6,400</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Other</span>
                    <span>$4,800</span>
                  </div>
                  <div className="flex justify-between font-bold border-t-2 border-gray-300 pt-2 mt-2">
                    <span>TOTAL REVENUE</span>
                    <span>$243,200</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-mono text-[10px] font-bold mb-3">RISK FACTORS</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-[10px] font-mono">
                      <span className="text-gray-600">Detection Risk</span>
                      <span>62%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: '62%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-[10px] font-mono">
                      <span className="text-gray-600">Attribution Risk</span>
                      <span>34%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: '34%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-[10px] font-mono">
                      <span className="text-gray-600">Failure Risk</span>
                      <span>41%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: '41%' }} />
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-600">Expected Value</span>
                      <span className="font-bold">$143,088</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono mt-1">
                      <span className="text-gray-600">Risk-Adj ROI</span>
                      <span className="font-bold">2.11x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decision Matrix */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">STRATEGIC DECISION MATRIX</div>
            
            <table className="w-full font-mono text-[10px]">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">TARGET</th>
                  <th className="text-right py-2">COST</th>
                  <th className="text-right py-2">REVENUE</th>
                  <th className="text-right py-2">ROI</th>
                  <th className="text-right py-2">RISK</th>
                  <th className="text-right py-2">EFFORT</th>
                  <th className="text-right py-2">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { target: "Financial Services", cost: 46000, revenue: 243200, roi: 4.29, risk: 0.72, effort: 800, score: 8.4 },
                  { target: "Healthcare", cost: 32000, revenue: 156000, roi: 3.88, risk: 0.51, effort: 640, score: 8.9 },
                  { target: "Retail", cost: 24000, revenue: 98000, roi: 3.08, risk: 0.38, effort: 480, score: 7.6 },
                  { target: "Manufacturing", cost: 38000, revenue: 184000, roi: 3.84, risk: 0.64, effort: 720, score: 7.8 },
                  { target: "Energy", cost: 52000, revenue: 298000, roi: 4.73, risk: 0.81, effort: 960, score: 8.1 },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2 font-bold">{row.target}</td>
                    <td className="text-right">${(row.cost / 1000).toFixed(0)}K</td>
                    <td className="text-right">${(row.revenue / 1000).toFixed(0)}K</td>
                    <td className="text-right">{row.roi.toFixed(2)}x</td>
                    <td className="text-right">{(row.risk * 100).toFixed(0)}%</td>
                    <td className="text-right">{row.effort}h</td>
                    <td className="text-right font-bold">{row.score}/10</td>
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
