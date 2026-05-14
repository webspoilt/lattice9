import { motion } from 'framer-motion';

/**
 * MathAnnotations: Faint research-layer equation overlays
 * Positioned across the hero section as environmental detail.
 * These should feel like annotations in a research paper, not decoration.
 */

export function MathAnnotations() {
  const annotations = [
    { text: 'P(H|E) = P(E|H)·P(H) / P(E)', top: '15%', right: '12%', delay: 0.5 },
    { text: 'H(X) = −Σ p(xᵢ) log₂ p(xᵢ)', top: '28%', right: '6%', delay: 1.0 },
    { text: 'L = D − A', top: '42%', right: '15%', delay: 1.5 },
    { text: 'V*(s) = maxₐ Σ P(s′|s,a)[R + γV*(s′)]', bottom: '22%', right: '8%', delay: 2.0 },
    { text: 'λ₂(L) > 0  ⟹  G connected', bottom: '35%', right: '18%', delay: 2.5 },
    { text: 'C_B(v) = Σ σ(s,t|v) / σ(s,t)', top: '55%', right: '4%', delay: 3.0 },
    { text: 'σ² = Var[P(H|E₁,...,Eₙ)]', bottom: '48%', right: '22%', delay: 3.5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-5" style={{ top: '56px' }}>
      {annotations.map((a, i) => (
        <motion.div
          key={i}
          className="absolute text-[10px] font-mono text-[#4a9eff] whitespace-nowrap"
          style={{
            top: a.top,
            bottom: a.bottom,
            right: a.right,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.12, 0.08] }}
          transition={{
            duration: 3,
            delay: a.delay,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
            repeatDelay: 4 + i * 0.5,
          }}
        >
          {a.text}
        </motion.div>
      ))}
    </div>
  );
}
