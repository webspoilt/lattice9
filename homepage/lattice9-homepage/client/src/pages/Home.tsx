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
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] selection:bg-indigo-500/20 relative">

      <span id="lattice9-diag" className="sr-only">MOUNTED</span>
      {/* Background Layers - Keeping disabled for now */}
      {/* <BackgroundField entropy={globalEntropy} /> */}

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e20] bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-none bg-indigo-600 flex items-center justify-center">
              <Radar className="w-4 h-4 text-[#0a0a0b]" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Lattice9</span>
            <span className="hidden sm:inline text-[10px] font-mono text-[#444] ml-2 tracking-widest lowercase">system.intelligence_v5.0.0</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Topology', 'Entropy', 'Inference'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-[10px] font-mono text-[#555] hover:text-indigo-400 transition-colors tracking-widest uppercase">{l}</a>
            ))}
          </div>
          <a href="https://github.com/webspoilt/lattice9" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] font-mono tracking-widest h-7 px-4 rounded-none lowercase gap-2">
              <Github className="w-3 h-3" /> github
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero: Active Intelligence Environment */}
      <section className="relative pt-24 min-h-screen flex flex-col overflow-hidden bg-transparent">
        
        <div className="container relative z-10 py-12 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-center lg:text-left">
            <div className="space-y-10 max-w-2xl mx-auto lg:mx-0">
              <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="visible">
                <motion.div className="flex items-center gap-3 justify-center lg:justify-start" variants={fadeUp}>
                  <div className="h-px w-12 bg-indigo-500/30" />
                  <span className="text-[10px] font-mono text-indigo-400 tracking-[0.4em] uppercase">Intelligence_Reasoning_Active</span>
                </motion.div>
                
                <motion.h1 className="text-6xl lg:text-8xl font-bold leading-[0.95] tracking-tighter lowercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }} variants={fadeUp}>
                  Reasoning <br />
                  <span className="text-indigo-500">Over</span> <br />
                  Orchestration.
                </motion.h1>

                <motion.p className="text-base lg:text-lg leading-relaxed text-[#666] max-w-md font-light mx-auto lg:mx-0" variants={fadeUp}>
                  Lattice9 generates normalized attack surface graphs using probabilistic inference. We solve for exploitability by deriving truth from high-entropy adversarial noise.
                </motion.p>

                <motion.div className="flex items-center gap-4 pt-4 justify-center lg:justify-start" variants={fadeUp}>
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-500 gap-2 text-xs font-mono tracking-wider h-11 px-6 rounded-none">
                    Initialize Engine <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" className="border-[#2a2a2d] text-[#888] hover:bg-[#151517] text-xs font-mono tracking-wider h-11 px-6 rounded-none">Documentation</Button>
                </motion.div>
              </motion.div>
            </div>

            {/* 3D Intelligence Navigator - Positioned towards center-right (Keep disabled) */}
            {/* 
            <motion.div 
              className="hidden lg:block relative z-20" 
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              ...
            </motion.div>
            */}
          </div>
        </div>

        {/* Side annotations */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 pointer-events-none">
          <div className="telemetry-text text-[#2a2a2d]" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>LATTICE9_SURFACE_TOPOLOGY_v5.0.0</div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 pointer-events-none">
          {['PROB', 'GRAPH', 'BAYES', 'ENTROPY'].map((l, i) => (
            <div key={l} className="flex items-center gap-1.5 justify-end">
              <span className="telemetry-text text-[#2a2a2d]">{l}</span>
              <div className="w-1 h-1 rounded-none" style={{ background: ['#6366f1', '#6366f1', '#d4a574', '#6366f1'][i], opacity: 0.4 }} />
            </div>
          ))}
        </div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown className="w-4 h-4 text-[#444]" />
        </motion.div>
      </section>

      {/* Telemetry Bar */}
      <TelemetryBar />
    </div>
  );
}
