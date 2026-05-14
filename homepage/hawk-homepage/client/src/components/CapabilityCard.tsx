import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

/**
 * CapabilityCard Component
 * Displays individual Hawk capabilities with icon, title, and description
 * 
 * Design: Scientific Instrumentalism
 * - Dark card background with subtle border
 * - Icon in secondary color with background
 * - Hover effects with accent color transition
 * - Smooth motion animations
 */

interface CapabilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export function CapabilityCard({ icon: Icon, title, description, index = 0 }: CapabilityCardProps) {
  return (
    <motion.div
      className="group relative p-6 rounded-lg bg-card border border-border hover:border-accent/50 transition-all duration-300 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.23, 1, 0.32, 1],
      }}
      whileHover={{ y: -4 }}
    >
      {/* Subtle background glow on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />

      {/* Content */}
      <div className="relative flex gap-4">
        {/* Icon container */}
        <motion.div
          className="flex-shrink-0 w-10 h-10 rounded bg-secondary flex items-center justify-center text-accent"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>

        {/* Text content */}
        <div className="flex-1 space-y-2">
          <h3 className="heading-sm text-foreground group-hover:text-accent transition-colors duration-300">
            {title}
          </h3>
          <p className="body-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Accent line on hover */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-spectral"
        initial={{ width: 0 }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
