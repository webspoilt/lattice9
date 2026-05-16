import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Radar, ChevronDown, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelligenceNavigator } from '@/components/IntelligenceNavigator';
import { TelemetryBar } from '@/components/TelemetryBar';
import { CoreSections } from '@/components/CoreSections';
import { PretextLog } from '@/components/PretextLog';
import { BackgroundField } from '@/components/BackgroundField';
import { AdversarialSlopeGraph } from '@/components/AdversarialSlopeGraph';

const MOCK_INTELLIGENCE = {
  entities: [
    { id: '1', label: 'prod-api.lattice9.io', type: 'asset' },
    { id: '2', label: 'admin-console', type: 'asset' },
    { id: '3', label: 'svc_deployer', type: 'identity' },
    { id: '4', label: 'CVE-2024-JWT-BYPASS', type: 'vuln' },
    { id: '5', label: 'SSO-Gateway', type: 'service' },
  ],
  inferences: [
    { sourceId: '1', targetEntityId: '5', type: 'contains' },
    { sourceId: '5', targetEntityId: '4', type: 'exploits' },
    { sourceId: '4', targetEntityId: '3', type: 'identifies' },
    { sourceId: '3', targetEntityId: '2', type: 'auths' },
  ]
};

export default function Home() {
  const [globalEntropy, setGlobalEntropy] = useState(0.2);

  useEffect(() => {
    console.log("LATTICE9_INIT: Offensive Intelligence Interface active.");
    
    // Simulate global entropy fluctuations
    const interval = setInterval(() => {
      setGlobalEntropy(prev => {
        const target = Math.random() > 0.8 ? 0.6 : 0.2;
        return prev + (target - prev) * 0.1;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] } },
  };
  const fadeIn = (i: number) => ({
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] } },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-20">
      <h1 className="text-4xl font-bold mb-4">LATTICE9_DIAGNOSTIC_MODE</h1>
      <p className="text-indigo-400 font-mono">If you can see this, the React root is mounted and rendering.</p>
      <div className="mt-8 p-4 border border-[#1e1e20] bg-[#0e0e10] font-mono text-xs text-[#666]">
        STATUS: OPERATIONAL <br />
        ENTROPY: {globalEntropy.toFixed(4)} <br />
        INIT_LOG: CHECK_CONSOLE
      </div>
      
      {/* Temporarily disabled to isolate crash
      <BackgroundField entropy={globalEntropy} />
      <nav ... />
      <IntelligenceNavigator ... />
      ...
      */}
    </div>
  );
}
