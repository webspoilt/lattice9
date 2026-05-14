import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Network, Brain, Radar, Layers, TrendingUp, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroGraph } from '@/components/HeroGraph';
import { CapabilityCard } from '@/components/CapabilityCard';
import { ResearchCard } from '@/components/ResearchCard';
import { MathAnnotations } from '@/components/MathAnnotations';
import { SectionDivider } from '@/components/SectionDivider';

/**
 * Design Philosophy: Scientific Instrumentalism
 * - Dark graphite and tungsten palette
 * - Spectral cyan and amber accents
 * - Force-directed graph hero with orbital node behavior
 * - Faint mathematical overlays as research annotations
 * - Asymmetric layouts with left-aligned content
 * - Restrained animations (2-3s cycles)
 */

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
    },
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-spectral flex items-center justify-center">
              <Radar className="w-5 h-5 text-background" />
            </div>
            <span className="display-sm">HAWK</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="body-md text-muted-foreground hover:text-foreground transition">
              Features
            </a>
            <a href="#capabilities" className="body-md text-muted-foreground hover:text-foreground transition">
              Capabilities
            </a>
            <a href="#research" className="body-md text-muted-foreground hover:text-foreground transition">
              Research
            </a>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Access Platform
          </Button>
        </div>
      </nav>

      {/* Hero Section with Force-Directed Graph */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 mesh-background opacity-30" />

        {/* Mathematical annotations layer */}
        <MathAnnotations />

        {/* Hero graph visualization */}
        <div className="absolute inset-0 w-full h-full" style={{ height: '600px' }}>
          <HeroGraph />
        </div>

        {/* Hero content overlay */}
        <div className="relative container z-10">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Left: Content */}
            <motion.div className="space-y-8" variants={itemVariants}>
              <div className="space-y-4">
                <h1 className="display-lg leading-tight">
                  Autonomous Graph-Native Offensive Intelligence
                </h1>
                <p className="body-lg text-muted-foreground max-w-md">
                  Probabilistic attack surface analysis powered by Bayesian inference, graph theory, and distributed systems observability.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  Start Reconnaissance <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-border hover:bg-secondary">
                  View Documentation
                </Button>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
                <div>
                  <div className="mono-md text-accent">99.2%</div>
                  <div className="body-sm text-muted-foreground">Accuracy</div>
                </div>
                <div>
                  <div className="mono-md text-accent">2.4s</div>
                  <div className="body-sm text-muted-foreground">Avg Latency</div>
                </div>
                <div>
                  <div className="mono-md text-accent">∞</div>
                  <div className="body-sm text-muted-foreground">Scalability</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Mathematical annotations */}
            <motion.div
              className="relative h-96 hidden lg:flex items-center justify-center"
              variants={itemVariants}
            >
              <div className="absolute inset-0 flex flex-col justify-center gap-8 text-xs font-mono opacity-40">
                <div className="text-accent">P(A|B) = P(B|A)P(A) / P(B)</div>
                <div className="text-muted-foreground">H = -Σ pᵢ log pᵢ</div>
                <div className="text-accent">L = D - A</div>
                <div className="text-muted-foreground">V*(s) = max_a Σ P(s'|s,a)[R(s,a,s') + γV*(s')]</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section divider */}
      <SectionDivider />

      {/* Core Capabilities Section */}
      <section id="capabilities" className="py-20 border-t border-border">
        <div className="container">
          <motion.div
            className="space-y-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h2 className="display-md">Core Intelligence Capabilities</h2>
              <p className="body-lg text-muted-foreground max-w-2xl">
                Hawk combines graph-native architecture with probabilistic reasoning to deliver operationally intelligent attack surface analysis.
              </p>
            </div>

            {/* Capabilities grid - asymmetric layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: Network,
                  title: 'Attack Surface Intelligence',
                  description: 'Graph-based topology mapping with probabilistic edge weighting and latent-space clustering.',
                },
                {
                  icon: Zap,
                  title: 'Autonomous Recon Orchestration',
                  description: 'Self-directed reconnaissance workflows with Bayesian confidence propagation and temporal diffusion.',
                },
                {
                  icon: Brain,
                  title: 'Probabilistic Exploit Correlation',
                  description: 'Multi-evidence Bayesian updates correlating findings across heterogeneous data sources.',
                },
                {
                  icon: Layers,
                  title: 'Temporal Infrastructure Diffing',
                  description: 'Real-time attack surface evolution tracking with entropy-based anomaly detection.',
                },
                {
                  icon: TrendingUp,
                  title: 'Graph-Based Threat Reasoning',
                  description: 'Spectral graph analysis for identifying critical infrastructure chokepoints and attack paths.',
                },
                {
                  icon: Cpu,
                  title: 'Embedding Space Analysis',
                  description: 'Latent-space visualization of asset relationships and probabilistic threat clustering.',
                },
              ].map((capability, idx) => (
                <CapabilityCard key={idx} {...capability} index={idx} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section divider */}
      <SectionDivider />

      {/* Research Layer Section */}
      <section id="research" className="py-20 border-t border-border">
        <div className="container">
          <motion.div
            className="space-y-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h2 className="display-md">Mathematical Foundation</h2>
              <p className="body-lg text-muted-foreground max-w-2xl">
                Hawk's intelligence engine is built on rigorous mathematical principles from graph theory, Bayesian inference, and distributed systems.
              </p>
            </div>

            {/* Research principles grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Bayesian Inference',
                  formula: 'P(H|E) = P(E|H)P(H) / P(E)',
                  description: 'Multi-evidence probabilistic reasoning for attack path validation',
                },
                {
                  title: 'Graph Laplacian',
                  formula: 'L = D - A',
                  description: 'Spectral analysis for identifying infrastructure bottlenecks',
                },
                {
                  title: 'Information Entropy',
                  formula: 'H = -Σ pᵢ log pᵢ',
                  description: 'Uncertainty quantification in probabilistic threat models',
                },
              ].map((principle, idx) => (
                <ResearchCard key={idx} {...principle} index={idx} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section divider */}
      <SectionDivider />

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <motion.div
            className="max-w-2xl space-y-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h2 className="display-md">Ready to Deploy Autonomous Intelligence?</h2>
              <p className="body-lg text-muted-foreground">
                Integrate Hawk into your offensive security infrastructure and unlock graph-native attack surface analysis.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-spectral flex items-center justify-center">
                  <Radar className="w-4 h-4 text-background" />
                </div>
                <span className="heading-sm">HAWK</span>
              </div>
              <p className="body-sm text-muted-foreground">Autonomous offensive intelligence infrastructure.</p>
            </div>
            <div className="space-y-3">
              <h4 className="heading-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Documentation</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="heading-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">About</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="heading-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex items-center justify-between">
            <p className="body-sm text-muted-foreground">© 2026 Hawk. All rights reserved.</p>
            <p className="mono-sm text-muted-foreground opacity-60">v3.5 | Graph-Native Intelligence</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
