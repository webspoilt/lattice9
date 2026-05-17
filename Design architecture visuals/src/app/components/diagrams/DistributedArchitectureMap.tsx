export function DistributedArchitectureMap() {
  const clusters = [
    { id: "c1", name: "INGEST", nodes: 12, load: 0.67, latency: "12ms" },
    { id: "c2", name: "PROCESS", nodes: 24, load: 0.84, latency: "45ms" },
    { id: "c3", name: "ANALYZE", nodes: 16, load: 0.72, latency: "128ms" },
    { id: "c4", name: "STORE", nodes: 8, load: 0.45, latency: "8ms" },
    { id: "c5", name: "QUERY", nodes: 20, load: 0.91, latency: "34ms" },
  ];
  
  const partitions = [
    { id: "p1", range: "0x0000-0x3FFF", nodes: 4, replication: 3 },
    { id: "p2", range: "0x4000-0x7FFF", nodes: 4, replication: 3 },
    { id: "p3", range: "0x8000-0xBFFF", nodes: 4, replication: 3 },
    { id: "p4", range: "0xC000-0xFFFF", nodes: 4, replication: 3 },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">DISTRIBUTED ARCHITECTURE</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Multi-cluster topology • Partition distribution • Replication strategy
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* System Architecture Diagram */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-6">SYSTEM TOPOLOGY</div>
            
            <div className="flex items-center justify-between gap-8">
              {clusters.map((cluster, i) => (
                <div key={cluster.id} className="flex-1">
                  <div className="border-2 border-black p-4">
                    <div className="font-mono text-[10px] font-bold mb-3">{cluster.name}</div>
                    
                    {/* Node grid */}
                    <div className="grid grid-cols-4 gap-1 mb-3">
                      {Array.from({ length: Math.min(cluster.nodes, 16) }).map((_, j) => (
                        <div 
                          key={j} 
                          className={`aspect-square border border-black ${
                            j / cluster.nodes < cluster.load ? "bg-black" : "bg-white"
                          }`}
                        />
                      ))}
                    </div>
                    
                    <div className="font-mono text-[8px] space-y-1 text-gray-600">
                      <div>Nodes: {cluster.nodes}</div>
                      <div>Load: {(cluster.load * 100).toFixed(0)}%</div>
                      <div>Latency: {cluster.latency}</div>
                    </div>
                  </div>
                  
                  {i < clusters.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-8 h-[2px] bg-black" />
                      <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-black" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Hash Ring Partitioning */}
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-gray-300 p-6">
              <div className="font-mono text-xs mb-4">CONSISTENT HASH RING</div>
              
              <div className="relative w-80 h-80 mx-auto">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Ring */}
                  <circle cx="200" cy="200" r="150" fill="none" stroke="black" strokeWidth="2" />
                  <circle cx="200" cy="200" r="130" fill="none" stroke="black" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                  
                  {/* Partitions */}
                  {partitions.map((part, i) => {
                    const angle = (i / partitions.length) * 2 * Math.PI - Math.PI / 2;
                    const x = 200 + 150 * Math.cos(angle);
                    const y = 200 + 150 * Math.sin(angle);
                    const labelX = 200 + 180 * Math.cos(angle);
                    const labelY = 200 + 180 * Math.sin(angle);
                    
                    // Draw partition boundary
                    const nextAngle = ((i + 1) / partitions.length) * 2 * Math.PI - Math.PI / 2;
                    const arcX = 200 + 150 * Math.cos(nextAngle);
                    const arcY = 200 + 150 * Math.sin(nextAngle);
                    
                    return (
                      <g key={part.id}>
                        <line x1="200" y1="200" x2={x} y2={y} stroke="black" strokeWidth="1" />
                        <circle cx={x} cy={y} r="8" fill="black" />
                        <text 
                          x={labelX} 
                          y={labelY} 
                          textAnchor="middle" 
                          fontSize="10" 
                          fontFamily="monospace"
                          fill="black"
                        >
                          {part.id}
                        </text>
                        
                        {/* Arc for partition */}
                        <path
                          d={`M ${x} ${y} A 150 150 0 0 1 ${arcX} ${arcY}`}
                          fill="none"
                          stroke="black"
                          strokeWidth="3"
                          opacity="0.2"
                        />
                      </g>
                    );
                  })}
                  
                  {/* Center label */}
                  <text x="200" y="200" textAnchor="middle" fontSize="12" fontFamily="monospace" fill="black">
                    HASH
                  </text>
                  <text x="200" y="215" textAnchor="middle" fontSize="12" fontFamily="monospace" fill="black">
                    SPACE
                  </text>
                </svg>
              </div>
              
              <div className="mt-4 space-y-2 font-mono text-[10px]">
                {partitions.map(part => (
                  <div key={part.id} className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold">{part.id}</span>
                    <span className="text-gray-600">{part.range}</span>
                    <span>R={part.replication}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Replication Strategy */}
            <div className="border border-gray-300 p-6">
              <div className="font-mono text-xs mb-4">REPLICATION TOPOLOGY</div>
              
              <div className="space-y-6">
                {/* Primary-Replica Pattern */}
                <div>
                  <div className="font-mono text-[10px] text-gray-600 mb-2">PRIMARY-REPLICA</div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="border-2 border-black bg-black text-white p-3 font-mono text-[10px] text-center">
                        PRIMARY
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="border border-black p-2 font-mono text-[10px] text-center">
                        REPLICA-1
                      </div>
                      <div className="border border-black p-2 font-mono text-[10px] text-center">
                        REPLICA-2
                      </div>
                      <div className="border border-black p-2 font-mono text-[10px] text-center">
                        REPLICA-3
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quorum Configuration */}
                <div className="border border-gray-300 p-3">
                  <div className="font-mono text-[10px] mb-3">QUORUM CONFIG</div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                    <div>
                      <div className="text-gray-600">Replication Factor</div>
                      <div className="font-bold">N = 3</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Write Quorum</div>
                      <div className="font-bold">W = 2</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Read Quorum</div>
                      <div className="font-bold">R = 2</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Consistency</div>
                      <div className="font-bold">W + R > N</div>
                    </div>
                  </div>
                </div>
                
                {/* Failure Scenarios */}
                <div>
                  <div className="font-mono text-[10px] text-gray-600 mb-2">FAULT TOLERANCE</div>
                  <div className="space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span>Single node failure</span>
                      <span className="font-bold">TOLERATED</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span>Partition split</span>
                      <span className="font-bold">TOLERATED</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span>Quorum loss</span>
                      <span className="font-bold text-gray-600">DEGRADED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total cluster failure</span>
                      <span className="font-bold text-gray-600">UNAVAILABLE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Message Flow */}
          <div className="border border-gray-300 p-6">
            <div className="font-mono text-xs mb-4">MESSAGE FLOW TOPOLOGY</div>
            
            <div className="flex items-start gap-8">
              <div className="flex-1 space-y-4">
                <div className="font-mono text-[10px] text-gray-600">REQUEST PATH</div>
                {[
                  { step: "1. CLIENT", latency: "0ms", desc: "Request initiation" },
                  { step: "2. LOAD BALANCER", latency: "+2ms", desc: "L7 routing decision" },
                  { step: "3. API GATEWAY", latency: "+5ms", desc: "Auth & rate limiting" },
                  { step: "4. SERVICE MESH", latency: "+3ms", desc: "Service discovery" },
                  { step: "5. WORKER NODE", latency: "+45ms", desc: "Query processing" },
                  { step: "6. DATA PARTITION", latency: "+8ms", desc: "Storage access" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-40 border border-black p-2 font-mono text-[10px]">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-gray-600">{item.desc}</div>
                      <div className="text-[10px] font-mono font-bold">{item.latency}</div>
                    </div>
                    {i < 5 && (
                      <div className="flex flex-col items-center">
                        <div className="w-[2px] h-4 bg-black" />
                        <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-6 border-t-black" />
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="border-t border-gray-300 pt-3 mt-4 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Latency</span>
                    <span className="font-bold">63ms (p50)</span>
                  </div>
                </div>
              </div>
              
              <div className="w-64 border border-gray-300 p-4">
                <div className="font-mono text-[10px] mb-3">THROUGHPUT METRICS</div>
                <div className="space-y-3 text-[10px] font-mono">
                  <div>
                    <div className="text-gray-600 mb-1">Requests/sec</div>
                    <div className="font-bold">847,293</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Data ingested/sec</div>
                    <div className="font-bold">12.4 GB</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Graph ops/sec</div>
                    <div className="font-bold">3.2M</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Active connections</div>
                    <div className="font-bold">54,832</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
