import { useEffect, useState } from 'react';

const items = [
  'BAYESIAN::α=0.87 | CONVERGENCE=2,341',
  'LAPLACIAN::λ₂=0.142 | SPECTRAL_GAP=0.142',
  'ENTROPY::H(X)=2.84bits | σ=0.41',
  'BELLMAN::V*(s₀)=0.94 | γ=0.95 | CONVERGED',
  'TOPOLOGY::|V|=143 | |E|=387 | C̄=0.34',
  'RECON::PHASE=3 | YIELD=0.73 | RATE=12.4/min',
  'CORRELATION::P(exploit|ctx)≥0.71 | CHAINS=23',
  'TEMPORAL::Δ=1,847 | WINDOW=72hr | DRIFT=0.034/hr',
];

export function TelemetryBar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 h-7 flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(0deg, rgba(10,10,11,0.98), rgba(10,10,11,0.9))',
        borderTop: '1px solid rgba(30,30,32,0.4)',
      }}
    >
      <div className="flex items-center h-full px-3 border-r border-[#1e1e20] mr-2 flex-shrink-0">
        <span className="status-dot status-active mr-2" />
        <span className="telemetry-text text-[#555]">TELEMETRY</span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="animate-telemetry-scroll whitespace-nowrap flex">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="telemetry-text text-[#444] mx-6">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
