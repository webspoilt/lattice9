import { motion } from 'framer-motion';

/**
 * SectionDivider Component
 * Renders an elegant SVG divider between sections with spectral gradient
 * 
 * Design: Scientific Instrumentalism
 * - Subtle wave pattern suggesting topology
 * - Spectral gradient from cyan to amber
 * - Minimal height for restrained design
 */

interface SectionDividerProps {
  variant?: 'top' | 'bottom';
  className?: string;
}

export function SectionDivider({ variant = 'bottom', className = '' }: SectionDividerProps) {
  return (
    <motion.div
      className={`relative h-16 overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{
          transform: variant === 'top' ? 'scaleY(-1)' : 'scaleY(1)',
        }}
      >
        <defs>
          <linearGradient id="divider-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00d9ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#d4a574" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Wave pattern */}
        <path
          d="M0,40 Q300,20 600,40 T1200,40 L1200,120 L0,120 Z"
          fill="url(#divider-gradient)"
        />
        
        {/* Subtle mesh lines */}
        <line x1="0" y1="60" x2="1200" y2="60" stroke="rgba(74, 158, 255, 0.1)" strokeWidth="1" />
        <line x1="0" y1="80" x2="1200" y2="80" stroke="rgba(74, 158, 255, 0.05)" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}
