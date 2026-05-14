import { motion } from 'framer-motion';

/**
 * MathAnnotations Component
 * Renders faint mathematical equations and formulas as research-layer annotations
 * 
 * Design: Scientific Instrumentalism
 * - Very subtle opacity (15-25%)
 * - Monospace font for authenticity
 * - Spectral cyan color for consistency
 * - Positioned absolutely for layering effect
 */

export function MathAnnotations() {
  const annotations = [
    { text: 'P(A|B) = P(B|A)P(A) / P(B)', top: '10%', left: '5%', delay: 0 },
    { text: 'H = -Σ pᵢ log pᵢ', top: '20%', right: '8%', delay: 0.2 },
    { text: 'L = D - A', top: '35%', left: '3%', delay: 0.4 },
    { text: 'V*(s) = max_a Σ P(s\'|s,a)[R(s,a,s\') + γV*(s\')]', bottom: '15%', right: '5%', delay: 0.6 },
    { text: 'λᵢ ∈ spectrum(L)', bottom: '25%', left: '10%', delay: 0.8 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {annotations.map((annotation, idx) => (
        <motion.div
          key={idx}
          className="absolute mono-sm text-accent opacity-20 font-light"
          style={{
            top: annotation.top,
            bottom: annotation.bottom,
            left: annotation.left,
            right: annotation.right,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{
            duration: 1.5,
            delay: annotation.delay,
            ease: 'easeInOut',
          }}
        >
          {annotation.text}
        </motion.div>
      ))}
    </div>
  );
}
