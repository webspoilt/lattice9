export function TemporalMutationDiagram() {
  const timeframes = [
    { t: "T0", state: "initial", nodes: 45, edges: 82, entropy: 0.23 },
    { t: "T1", state: "mutation", nodes: 52, edges: 97, entropy: 0.41 },
    { t: "T2", state: "expansion", nodes: 68, edges: 134, entropy: 0.67 },
    { t: "T3", state: "consolidation", nodes: 71, edges: 142, entropy: 0.58 },
    { t: "T4", state: "fragmentation", nodes: 64, edges: 118, entropy: 0.74 },
  ];
  
  const mutations = [
    { type: "NODE_ADDITION", count: 12, impact: 0.34 },
    { type: "NODE_REMOVAL", count: 7, impact: 0.21 },
    { type: "EDGE_REWIRING", count: 28, impact: 0.56 },
    { type: "ATTRIBUTE_CHANGE", count: 43, impact: 0.45 },
    { type: "TOPOLOGY_SHIFT", count: 5, impact: 0.89 },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">TEMPORAL MUTATION ANALYSIS</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Time-series graph evolution • Structural dynamics • Mutation tracking
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Timeline */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-6">TEMPORAL EVOLUTION</div>
            
            <div className="relative">
              {/* Timeline axis */}
              <div className="absolute top-40 left-0 right-0 h-[2px] bg-black" />
              
              <div className="flex justify-between items-start relative pb-20">
                {timeframes.map((tf, i) => (
                  <div key={tf.t} className="flex flex-col items-center w-32">
                    {/* Graph state visualization */}
                    <div className="w-24 h-24 border-2 border-black relative bg-white mb-4">
                      {/* Draw simplified graph based on metrics */}
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Edges */}
                        {Array.from({ length: Math.min(tf.edges / 10, 15) }).map((_, j) => {
                          const x1 = 20 + (j * 13) % 60;
                          const y1 = 20 + (j * 17) % 60;
                          const x2 = 30 + (j * 19) % 50;
                          const y2 = 30 + (j * 23) % 50;
                          return (
                            <line 
                              key={j} 
                              x1={x1} 
                              y1={y1} 
                              x2={x2} 
                              y2={y2} 
                              stroke="black" 
                              strokeWidth="1"
                              opacity={0.3}
                            />
                          );
                        })}
                        
                        {/* Nodes */}
                        {Array.from({ length: Math.min(tf.nodes / 5, 12) }).map((_, j) => {
                          const x = 20 + (j * 17) % 60;
                          const y = 20 + (j * 13) % 60;
                          const size = 2 + (tf.entropy * 3);
                          return (
                            <circle 
                              key={j} 
                              cx={x} 
                              cy={y} 
                              r={size} 
                              fill="white"
                              stroke="black"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                      </svg>
                    </div>
                    
                    {/* Timeline marker */}
                    <div className="w-3 h-3 bg-black border-2 border-white relative z-10" style={{ marginTop: '18px' }} />
                    
                    {/* Time label */}
                    <div className="font-mono text-xs font-bold mt-6">{tf.t}</div>
                    <div className="font-mono text-[10px] text-gray-600 mt-1">{tf.state}</div>
                    
                    {/* Metrics */}
                    <div className="mt-3 text-[9px] font-mono text-gray-600 space-y-1">
                      <div>n={tf.nodes}</div>
                      <div>e={tf.edges}</div>
                      <div>H={tf.entropy.toFixed(2)}</div>
                    </div>
                    
                    {/* Mutation arrow */}
                    {i < timeframes.length - 1 && (
                      <div className="absolute" style={{ left: '50%', top: '160px', transform: 'translateX(50%)' }}>
                        <svg width="60" height="20">
                          <defs>
                            <marker id="arrow-temporal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
                            </marker>
                          </defs>
                          <line x1="0" y1="10" x2="55" y2="10" stroke="black" strokeWidth="2" markerEnd="url(#arrow-temporal)" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mutation Types */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">MUTATION TYPES</div>
              <div className="space-y-3">
                {mutations.map((mut) => (
                  <div key={mut.type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[10px] font-bold">{mut.type}</span>
                      <span className="font-mono text-[10px] text-gray-600">{mut.count} ops</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200">
                        <div 
                          className="h-full bg-black" 
                          style={{ width: `${mut.impact * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] w-12 text-right">
                        {mut.impact.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Growth Metrics */}
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">GROWTH METRICS</div>
              
              <div className="h-48">
                <svg className="w-full h-full" viewBox="0 0 300 180">
                  {/* Grid */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line 
                      key={`h${i}`}
                      x1="40" 
                      y1={20 + i * 35} 
                      x2="280" 
                      y2={20 + i * 35} 
                      stroke="#e5e7eb" 
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Axes */}
                  <line x1="40" y1="20" x2="40" y2="160" stroke="black" strokeWidth="2" />
                  <line x1="40" y1="160" x2="280" y2="160" stroke="black" strokeWidth="2" />
                  
                  {/* Node count line */}
                  <polyline
                    points={timeframes.map((tf, i) => {
                      const x = 40 + (i * 60);
                      const y = 160 - (tf.nodes / 100 * 140);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="black"
                    strokeWidth="2"
                  />
                  
                  {/* Edge count line */}
                  <polyline
                    points={timeframes.map((tf, i) => {
                      const x = 40 + (i * 60);
                      const y = 160 - (tf.edges / 200 * 140);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="black"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  
                  {/* Labels */}
                  <text x="10" y="25" fontSize="10" fontFamily="monospace" fill="black">100</text>
                  <text x="10" y="95" fontSize="10" fontFamily="monospace" fill="black">50</text>
                  <text x="10" y="165" fontSize="10" fontFamily="monospace" fill="black">0</text>
                  
                  {timeframes.map((tf, i) => (
                    <text 
                      key={tf.t}
                      x={40 + i * 60} 
                      y="175" 
                      fontSize="10" 
                      fontFamily="monospace" 
                      fill="black"
                      textAnchor="middle"
                    >
                      {tf.t}
                    </text>
                  ))}
                </svg>
              </div>
              
              <div className="mt-4 flex gap-4 text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[2px] bg-black" />
                  <span>Nodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[2px] bg-black" style={{ backgroundImage: 'repeating-linear-gradient(90deg, black 0, black 4px, transparent 4px, transparent 8px)' }} />
                  <span>Edges</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Change Detection */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">CHANGE DETECTION MATRIX</div>
            
            <div className="grid grid-cols-5 gap-2 font-mono text-[10px]">
              <div className="font-bold">ΔSTATE</div>
              <div className="font-bold text-center">NODES Δ</div>
              <div className="font-bold text-center">EDGES Δ</div>
              <div className="font-bold text-center">ENTROPY Δ</div>
              <div className="font-bold text-center">SIGNIFICANCE</div>
              
              {[
                { from: "T0→T1", nodes: "+7", edges: "+15", entropy: "+0.18", sig: "MODERATE" },
                { from: "T1→T2", nodes: "+16", edges: "+37", entropy: "+0.26", sig: "HIGH" },
                { from: "T2→T3", nodes: "+3", edges: "+8", entropy: "-0.09", sig: "LOW" },
                { from: "T3→T4", nodes: "-7", edges: "-24", entropy: "+0.16", sig: "MODERATE" },
              ].map((delta, i) => (
                <div key={i} className="contents">
                  <div className="py-2 border-t border-gray-200">{delta.from}</div>
                  <div className="py-2 border-t border-gray-200 text-center">{delta.nodes}</div>
                  <div className="py-2 border-t border-gray-200 text-center">{delta.edges}</div>
                  <div className="py-2 border-t border-gray-200 text-center">{delta.entropy}</div>
                  <div className={`py-2 border-t border-gray-200 text-center font-bold ${
                    delta.sig === "HIGH" ? "text-black" : delta.sig === "MODERATE" ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {delta.sig}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Temporal Patterns */}
          <div className="grid grid-cols-3 gap-6">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-3">PERIODICITY</div>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dominant period</span>
                  <span className="font-bold">~2.4 units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Autocorrelation</span>
                  <span className="font-bold">0.67</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stationarity</span>
                  <span className="font-bold">Non-stationary</span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-3">VOLATILITY</div>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">Std deviation</span>
                  <span className="font-bold">11.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max change rate</span>
                  <span className="font-bold">+37 Δe/Δt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stability index</span>
                  <span className="font-bold">0.42</span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-3">PREDICTION</div>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">T5 nodes (pred)</span>
                  <span className="font-bold">58 ± 6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">T5 edges (pred)</span>
                  <span className="font-bold">104 ± 14</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-bold">73%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
