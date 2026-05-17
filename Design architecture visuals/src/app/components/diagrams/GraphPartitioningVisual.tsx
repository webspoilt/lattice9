import { useEffect, useRef } from "react";

export function GraphPartitioningVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    
    // Draw partitioned graph
    const partitions = [
      { x: 100, y: 100, nodes: 24, color: "#000", cut: 5 },
      { x: 350, y: 100, nodes: 28, color: "#333", cut: 7 },
      { x: 600, y: 100, nodes: 21, color: "#666", cut: 4 },
      { x: 100, y: 300, nodes: 26, color: "#444", cut: 6 },
      { x: 350, y: 300, nodes: 31, color: "#222", cut: 8 },
      { x: 600, y: 300, nodes: 19, color: "#555", cut: 3 },
    ];
    
    // Draw edges between partitions (cut edges)
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    const connections = [
      [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5]
    ];
    
    connections.forEach(([a, b]) => {
      const p1 = partitions[a];
      const p2 = partitions[b];
      const cuts = Math.min(p1.cut, p2.cut);
      
      for (let i = 0; i < cuts; i++) {
        const offset = (i - cuts / 2) * 5;
        ctx.beginPath();
        ctx.moveTo(p1.x + offset, p1.y + offset);
        ctx.lineTo(p2.x + offset, p2.y + offset);
        ctx.stroke();
      }
    });
    
    ctx.setLineDash([]);
    
    // Draw partitions
    partitions.forEach((partition, idx) => {
      const size = 80;
      
      // Draw partition boundary
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(partition.x - size/2, partition.y - size/2, size, size);
      
      // Draw nodes within partition
      const gridSize = Math.ceil(Math.sqrt(partition.nodes));
      const nodeSpacing = (size - 20) / gridSize;
      
      for (let i = 0; i < partition.nodes; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = partition.x - size/2 + 10 + col * nodeSpacing;
        const y = partition.y - size/2 + 10 + row * nodeSpacing;
        
        ctx.fillStyle = partition.color;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw partition label
      ctx.fillStyle = "#000";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`P${idx}`, partition.x, partition.y - size/2 - 8);
      
      // Draw node count
      ctx.font = "8px monospace";
      ctx.fillStyle = "#666";
      ctx.fillText(`n=${partition.nodes}`, partition.x, partition.y + size/2 + 12);
    });
    
  }, []);
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">GRAPH PARTITIONING</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Min-cut algorithms • Load balancing • Edge-cut minimization
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Main partitioning visualization */}
          <div className="border border-gray-300">
            <div className="border-b border-gray-300 p-3 font-mono text-xs">
              K-WAY PARTITIONING (k=6)
            </div>
            <div className="p-6">
              <canvas ref={canvasRef} className="w-full h-96 border border-gray-200" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Partition Metrics */}
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">PARTITION METRICS</div>
              <div className="space-y-3 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total nodes</span>
                  <span className="font-bold">149</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Partitions</span>
                  <span className="font-bold">6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Edge cut</span>
                  <span className="font-bold">33</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cut ratio</span>
                  <span className="font-bold">0.083</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Imbalance</span>
                  <span className="font-bold">1.04</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modularity</span>
                  <span className="font-bold">0.612</span>
                </div>
              </div>
            </div>
            
            {/* Partitioning Algorithm */}
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">ALGORITHM</div>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="border-b border-gray-200 pb-2">
                  <div className="font-bold">METIS</div>
                  <div className="text-gray-600">Multilevel k-way</div>
                </div>
                <div className="space-y-1 text-gray-600">
                  <div>1. Coarsening phase</div>
                  <div>2. Initial partitioning</div>
                  <div>3. Uncoarsening + refinement</div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Runtime</span>
                    <span className="font-bold">247ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Iterations</span>
                    <span className="font-bold">18</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Load Balance */}
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">LOAD DISTRIBUTION</div>
              <div className="space-y-2">
                {[
                  { id: "P0", load: 0.89 },
                  { id: "P1", load: 0.95 },
                  { id: "P2", load: 0.78 },
                  { id: "P3", load: 0.92 },
                  { id: "P4", load: 1.00 },
                  { id: "P5", load: 0.71 },
                ].map((p) => (
                  <div key={p.id}>
                    <div className="flex justify-between mb-1 text-[10px] font-mono">
                      <span className="font-bold">{p.id}</span>
                      <span className="text-gray-600">{(p.load * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: `${p.load * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Comparison Table */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">ALGORITHM COMPARISON</div>
            <table className="w-full font-mono text-[10px]">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">ALGORITHM</th>
                  <th className="text-right py-2">EDGE CUT</th>
                  <th className="text-right py-2">IMBALANCE</th>
                  <th className="text-right py-2">RUNTIME</th>
                  <th className="text-right py-2">QUALITY</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-bold">METIS (k-way)</td>
                  <td className="text-right">33</td>
                  <td className="text-right">1.04</td>
                  <td className="text-right">247ms</td>
                  <td className="text-right">★★★★★</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2">Spectral</td>
                  <td className="text-right">41</td>
                  <td className="text-right">1.12</td>
                  <td className="text-right">512ms</td>
                  <td className="text-right">★★★★☆</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2">Kernighan-Lin</td>
                  <td className="text-right">38</td>
                  <td className="text-right">1.08</td>
                  <td className="text-right">1834ms</td>
                  <td className="text-right">★★★★☆</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2">Greedy</td>
                  <td className="text-right">56</td>
                  <td className="text-right">1.23</td>
                  <td className="text-right">89ms</td>
                  <td className="text-right">★★★☆☆</td>
                </tr>
                <tr>
                  <td className="py-2">Random</td>
                  <td className="text-right">94</td>
                  <td className="text-right">1.47</td>
                  <td className="text-right">12ms</td>
                  <td className="text-right">★☆☆☆☆</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Optimization Objectives */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">OBJECTIVE FUNCTION</div>
              <div className="bg-gray-50 p-3 font-mono text-[10px] border border-gray-300">
                <div className="mb-2">minimize:</div>
                <div className="pl-4 space-y-1 text-gray-700">
                  <div>cut(V₁, V₂, ..., Vₖ)</div>
                  <div>+ α · imbalance(V₁, V₂, ..., Vₖ)</div>
                  <div>+ β · communication_cost</div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-300">
                  <div>subject to:</div>
                  <div className="pl-4 mt-1">
                    <div>|Vᵢ| ≤ (1 + ε) · |V| / k</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">CONSTRAINTS</div>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-black" />
                  </div>
                  <div>
                    <div className="font-bold">Balance constraint</div>
                    <div className="text-gray-600">Max partition size ≤ 1.05 · average</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-black" />
                  </div>
                  <div>
                    <div className="font-bold">Connectivity</div>
                    <div className="text-gray-600">Each partition must be connected</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-black" />
                  </div>
                  <div>
                    <div className="font-bold">Min-cut objective</div>
                    <div className="text-gray-600">Minimize inter-partition edges</div>
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
