import { motion } from 'framer-motion';

/**
 * ResearchCard Component
 * Displays mathematical principles and formulas with research-layer styling
 * 
 * Design: Scientific Instrumentalism
 * - Dark card with subtle border
 * - Formula displayed in monospace with accent color
 * - Hover effects with spectral gradient
 * - Faint mathematical annotations
 */

interface ResearchCardProps {
  title: string;
  formula: string;
  description: string;
  index?: number;
}

export function ResearchCard({ title, formula, description, index = 0 }: ResearchCardProps) {
  return (
    <motion.div
      className="p-6 rounded-lg bg-card border border-border hover:border-accent/50 transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.23, 1, 0.32, 1],
      }}
      whileHover={{ y: -2 }}
    >
      <div className="space-y-4">
        {/* Title */}
        <h3 className="heading-sm text-foreground group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>

        {/* Formula with spectral gradient effect */}
        <motion.div
          className="relative"
          initial={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mono-md text-accent opacity-70 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
            {formula}
          </div>
          {/* Subtle glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-spectral opacity-0 group-hover:opacity-10 blur-sm rounded transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.1 }}
          />
        </motion.div>

        {/* Description */}
        <p className="body-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Decorative equation annotation */}
        <div className="pt-2 border-t border-border/30">
          <p className="equation-annotation text-muted-foreground/50">
            Research-layer annotation
          </p>
        </div>
      </div>
    </motion.div>
  );
}
