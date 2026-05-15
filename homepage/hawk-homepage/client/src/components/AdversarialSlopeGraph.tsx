import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface DataPoint {
  id: string;
  label: string;
  start: number;
  end: number;
  color: string;
  equation: string;
}

const colors = {
  blue: '#4a9eff',
  teal: '#00d9ff',
  amber: '#d4a574',
  red: '#ff4444',
  graphite: '#1a1a1c'
};

export function AdversarialSlopeGraph() {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const data: DataPoint[] = useMemo(() => [
    { 
      id: 'recon', 
      label: 'RECON_VULNERABILITY', 
      start: 0.2, 
      end: 0.85, 
      color: colors.teal,
      equation: 'm_1 = \\frac{\\Delta V}{\\Delta t} = 0.65'
    },
    { 
      id: 'entropy', 
      label: 'SYSTEM_ENTROPY', 
      start: 0.4, 
      end: 0.35, 
      color: colors.amber,
      equation: 'm_2 = \\frac{\\Delta H}{\\Delta t} = -0.05'
    },
    { 
      id: 'surface', 
      label: 'ATTACK_SURFACE', 
      start: 0.7, 
      end: 0.92, 
      color: colors.blue,
      equation: 'm_3 = \\frac{\\Delta S}{\\Delta t} = 0.22'
    },
    { 
      id: 'risk', 
      label: 'CRITICAL_RISK', 
      start: 0.1, 
      end: 0.75, 
      color: colors.red,
      equation: 'm_4 = \\frac{\\Delta R}{\\Delta t} = 0.65'
    },
  ], []);

  const width = 400;
  const height = 300;
  const padding = 60;

  const getY = (v: number) => height - padding - (v * (height - 2 * padding));

  return (
    <div className="relative w-full max-w-2xl mx-auto p-8 bg-[#0a0a0b] border border-[#1e1e20] rounded-lg shadow-2xl overflow-hidden">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#4a9eff] animate-pulse" />
        <span className="telemetry-text text-[#555] text-[10px]">PREDICTIVE_SLOPE_ANALYSIS_v2.0</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Grid Lines */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1e1e20" strokeWidth="1" strokeDasharray="4 4" />
        <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} stroke="#1e1e20" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* X-Axis Labels */}
        <text x={padding} y={height - padding + 20} fill="#444" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle">T₀ (BASELINE)</text>
        <text x={width - padding} y={height - padding + 20} fill="#444" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle">T₁ (PREDICTED)</text>

        {/* Data Lines */}
        {data.map((d) => (
          <g key={d.id} onMouseEnter={() => setHoverId(d.id)} onMouseLeave={() => setHoverId(null)}>
            <motion.line
              x1={padding} y1={getY(d.start)}
              x2={width - padding} y2={getY(d.end)}
              stroke={d.color}
              strokeWidth={hoverId === d.id ? 3 : 1.5}
              strokeOpacity={hoverId && hoverId !== d.id ? 0.1 : 0.6}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: hoverId && hoverId !== d.id ? 0.1 : 0.6 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ cursor: 'pointer' }}
            />
            
            {/* End Points */}
            <circle cx={padding} cy={getY(d.start)} r="3" fill={d.color} opacity={hoverId && hoverId !== d.id ? 0.1 : 0.8} />
            <circle cx={width - padding} cy={getY(d.end)} r="3" fill={d.color} opacity={hoverId && hoverId !== d.id ? 0.1 : 0.8} />

            {/* Direct Labels (Best Practice) */}
            {(!hoverId || hoverId === d.id) && (
              <motion.text
                x={width - padding + 10} y={getY(d.end) + 4}
                fill={d.color}
                fontSize="9"
                fontFamily="IBM Plex Mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: hoverId === d.id ? 1 : 0.4 }}
                className="pointer-events-none"
              >
                {d.label}
              </motion.text>
            )}
          </g>
        ))}
      </svg>

      {/* Interactive KaTeX Formula Overlay */}
      <div className="absolute inset-x-8 bottom-8 flex justify-center pointer-events-none h-12">
        <AnimatePresence mode="wait">
          {hoverId && (
            <motion.div
              key={hoverId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#0f0f10] border border-[#4a9eff]/30 px-4 py-2 rounded-sm backdrop-blur-md shadow-lg"
              dangerouslySetInnerHTML={{ 
                __html: katex.renderToString(data.find(d => d.id === hoverId)?.equation || '', { displayMode: true }) 
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 border-t border-[#1e1e20] pt-4 flex justify-between items-center px-2">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.teal }} />
            <span className="telemetry-text text-[9px] text-[#666]">POSITIVE_YIELD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.amber }} />
            <span className="telemetry-text text-[9px] text-[#666]">STABILIZATION</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="telemetry-text text-[9px] text-[#444]">CALCULATING_DERIVATIVES...</span>
          <div className="w-12 h-1 bg-[#1e1e20] relative overflow-hidden">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-[#4a9eff]"
              animate={{ x: [-48, 48] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
