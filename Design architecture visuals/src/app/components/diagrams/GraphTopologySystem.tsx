export function GraphTopologySystem() {
  const topologies = [
    { name: "Star", centrality: 0.95, resistance: 0.12, clustering: 0.0 },
    { name: "Mesh", centrality: 0.25, resistance: 0.88, clustering: 0.92 },
    { name: "Ring", centrality: 0.33, resistance: 0.45, clustering: 0.67 },
    { name: "Tree", centrality: 0.71, resistance: 0.34, clustering: 0.42 },
    { name: "Scale-Free", centrality: 0.82, resistance: 0.19, clustering: 0.58 },
    { name: "Random", centrality: 0.41, resistance: 0.61, clustering: 0.38 },
  ];
  
  const metrics = [
    { label: "Avg Degree", value: "8.4" },
    { label: "Diameter", value: "5" },
    { label: "Avg Path Length", value: "2.73" },
    { label: "Clustering Coef", value: "0.521" },
    { label: "Assortativity", value: "-0.143" },
    { label: "Modularity", value: "0.384" },
    { label: "Betweenness Centrality", value: "0.267" },
    { label: "Eigenvector Centrality", value: "0.412" },
  ];
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-300 p-4">
        <h2 className="font-mono tracking-tight">GRAPH TOPOLOGY ANALYSIS</h2>
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          Structural characterization • Centrality measures • Resilience metrics
        </p>
      </div>
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-2 gap-8 max-w-6xl">
          {/* Topology Comparison Matrix */}
          <div className="col-span-2">
            <div className="border border-gray-300 p-4">
              <div className="font-mono text-xs mb-4">TOPOLOGY COMPARISON MATRIX</div>
              <table className="w-full font-mono text-[10px]">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2">TOPOLOGY</th>
                    <th className="text-right py-2">CENTRALITY</th>
                    <th className="text-right py-2">RESISTANCE</th>
                    <th className="text-right py-2">CLUSTERING</th>
                    <th className="text-left py-2 pl-4">STRUCTURE</th>
                  </tr>
                </thead>
                <tbody>
                  {topologies.map((topo, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-3 font-bold">{topo.name}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-200">
                            <div 
                              className="h-full bg-black" 
                              style={{ width: `${topo.centrality * 100}%` }}
                            />
                          </div>
                          <span>{topo.centrality.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-200">
                            <div 
                              className="h-full bg-black" 
                              style={{ width: `${topo.resistance * 100}%` }}
                            />
                          </div>
                          <span>{topo.resistance.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-200">
                            <div 
                              className="h-full bg-black" 
                              style={{ width: `${topo.clustering * 100}%` }}
                            />
                          </div>
                          <span>{topo.clustering.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="pl-4">
                        <svg width="80" height="30" className="inline-block">
                          {topo.name === "Star" && (
                            <>
                              <circle cx="40" cy="15" r="3" fill="black" />
                              <line x1="40" y1="15" x2="20" y2="5" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="15" x2="60" y2="5" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="15" x2="20" y2="25" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="15" x2="60" y2="25" stroke="black" strokeWidth="1" />
                              <circle cx="20" cy="5" r="2" fill="white" stroke="black" />
                              <circle cx="60" cy="5" r="2" fill="white" stroke="black" />
                              <circle cx="20" cy="25" r="2" fill="white" stroke="black" />
                              <circle cx="60" cy="25" r="2" fill="white" stroke="black" />
                            </>
                          )}
                          {topo.name === "Mesh" && (
                            <>
                              <line x1="20" y1="10" x2="60" y2="10" stroke="black" strokeWidth="1" />
                              <line x1="20" y1="20" x2="60" y2="20" stroke="black" strokeWidth="1" />
                              <line x1="20" y1="10" x2="20" y2="20" stroke="black" strokeWidth="1" />
                              <line x1="60" y1="10" x2="60" y2="20" stroke="black" strokeWidth="1" />
                              <line x1="20" y1="10" x2="60" y2="20" stroke="black" strokeWidth="1" />
                              <line x1="60" y1="10" x2="20" y2="20" stroke="black" strokeWidth="1" />
                              <circle cx="20" cy="10" r="2" fill="white" stroke="black" />
                              <circle cx="60" cy="10" r="2" fill="white" stroke="black" />
                              <circle cx="20" cy="20" r="2" fill="white" stroke="black" />
                              <circle cx="60" cy="20" r="2" fill="white" stroke="black" />
                            </>
                          )}
                          {topo.name === "Ring" && (
                            <>
                              <circle cx="40" cy="15" r="12" fill="none" stroke="black" strokeWidth="1" />
                              <circle cx="40" cy="3" r="2" fill="white" stroke="black" />
                              <circle cx="52" cy="15" r="2" fill="white" stroke="black" />
                              <circle cx="40" cy="27" r="2" fill="white" stroke="black" />
                              <circle cx="28" cy="15" r="2" fill="white" stroke="black" />
                            </>
                          )}
                          {topo.name === "Tree" && (
                            <>
                              <line x1="40" y1="5" x2="30" y2="15" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="5" x2="50" y2="15" stroke="black" strokeWidth="1" />
                              <line x1="30" y1="15" x2="25" y2="25" stroke="black" strokeWidth="1" />
                              <line x1="30" y1="15" x2="35" y2="25" stroke="black" strokeWidth="1" />
                              <circle cx="40" cy="5" r="2" fill="black" />
                              <circle cx="30" cy="15" r="2" fill="white" stroke="black" />
                              <circle cx="50" cy="15" r="2" fill="white" stroke="black" />
                              <circle cx="25" cy="25" r="2" fill="white" stroke="black" />
                              <circle cx="35" cy="25" r="2" fill="white" stroke="black" />
                            </>
                          )}
                          {topo.name === "Scale-Free" && (
                            <>
                              <circle cx="40" cy="15" r="4" fill="black" />
                              <line x1="40" y1="15" x2="25" y2="8" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="15" x2="55" y2="8" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="15" x2="30" y2="25" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="15" x2="50" y2="25" stroke="black" strokeWidth="1" />
                              <line x1="40" y1="15" x2="20" y2="20" stroke="black" strokeWidth="1" />
                              <circle cx="25" cy="8" r="2" fill="white" stroke="black" />
                              <circle cx="55" cy="8" r="2" fill="white" stroke="black" />
                              <circle cx="30" cy="25" r="2" fill="white" stroke="black" />
                              <circle cx="50" cy="25" r="2" fill="white" stroke="black" />
                              <circle cx="20" cy="20" r="1.5" fill="white" stroke="black" />
                            </>
                          )}
                          {topo.name === "Random" && (
                            <>
                              <line x1="20" y1="10" x2="35" y2="20" stroke="black" strokeWidth="1" />
                              <line x1="35" y1="20" x2="60" y2="15" stroke="black" strokeWidth="1" />
                              <line x1="20" y1="10" x2="50" y2="5" stroke="black" strokeWidth="1" />
                              <line x1="60" y1="15" x2="45" y2="25" stroke="black" strokeWidth="1" />
                              <circle cx="20" cy="10" r="2" fill="white" stroke="black" />
                              <circle cx="50" cy="5" r="2" fill="white" stroke="black" />
                              <circle cx="35" cy="20" r="2" fill="white" stroke="black" />
                              <circle cx="60" cy="15" r="2" fill="white" stroke="black" />
                              <circle cx="45" cy="25" r="2" fill="white" stroke="black" />
                            </>
                          )}
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Graph Metrics */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">STRUCTURAL METRICS</div>
            <div className="space-y-3">
              {metrics.map((metric, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-gray-600">{metric.label}</span>
                  <span className="font-bold">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Degree Distribution */}
          <div className="border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">DEGREE DISTRIBUTION</div>
            <div className="space-y-2">
              {[
                { degree: "k=1", count: 12, freq: 0.15 },
                { degree: "k=2", count: 18, freq: 0.23 },
                { degree: "k=3-5", count: 28, freq: 0.35 },
                { degree: "k=6-10", count: 15, freq: 0.19 },
                { degree: "k>10", count: 6, freq: 0.08 },
              ].map((d, i) => (
                <div key={i} className="text-[10px] font-mono">
                  <div className="flex justify-between mb-1">
                    <span>{d.degree}</span>
                    <span className="text-gray-600">{d.count} nodes</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200">
                    <div className="h-full bg-black" style={{ width: `${d.freq * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Spectral Properties */}
          <div className="col-span-2 border border-gray-300 p-4">
            <div className="font-mono text-xs mb-4">SPECTRAL ANALYSIS</div>
            <div className="grid grid-cols-3 gap-4 text-[10px] font-mono">
              <div>
                <div className="text-gray-600 mb-2">Eigenvalue Spectrum</div>
                <div className="flex items-end gap-1 h-32">
                  {[28, 45, 82, 95, 100, 88, 71, 54, 38, 22, 15, 8].map((h, i) => (
                    <div key={i} className="flex-1 bg-black" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="text-gray-600 text-[8px] mt-1">λ₁ to λₙ</div>
              </div>
              
              <div>
                <div className="text-gray-600 mb-2">Laplacian Matrix</div>
                <div className="grid grid-cols-8 gap-[1px] bg-gray-300">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const val = Math.abs(Math.sin(i * 0.5)) * Math.abs(Math.cos(i * 0.3));
                    return (
                      <div 
                        key={i} 
                        className="aspect-square"
                        style={{ backgroundColor: `rgb(${255 - val * 255}, ${255 - val * 255}, ${255 - val * 255})` }}
                      />
                    );
                  })}
                </div>
              </div>
              
              <div>
                <div className="text-gray-600 mb-2">Spectral Gap</div>
                <div className="space-y-2 mt-4">
                  <div>λ₁ (largest): <span className="font-bold">14.732</span></div>
                  <div>λ₂ (Fiedler): <span className="font-bold">2.184</span></div>
                  <div>Spectral gap: <span className="font-bold">12.548</span></div>
                  <div className="pt-2 border-t border-gray-300 text-gray-600">
                    Indicates strong connectivity with potential bottlenecks
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
