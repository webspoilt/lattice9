import { motion } from 'framer-motion';

export function MathAnnotations() {
  const annotations = [
    { text: '0x00A1  P(H|E) = INTELLIGENCE_COMPRESSION', top: '15%', right: '12%', delay: 0.5 },
    { text: '0x00F3  STATUS: ESCAPING_CONTAINMENT', top: '28%', right: '6%', delay: 1.0 },
    { text: '0x012C  L = ADVERSARIAL_MODELING', top: '42%', right: '15%', delay: 1.5 },
    { text: '0x01A4  V*(s) = OPTIMAL_ATTACK_PATH', bottom: '22%', right: '8%', delay: 2.0 },
    { text: '0x02B1  λ₂(L) = TRUTH_PROPAGATION', bottom: '35%', right: '18%', delay: 2.5 },
    { text: '0x031A  REASONING > SCANNING', top: '55%', right: '4%', delay: 3.0 },
    { text: '0x04F2  SYSTEM_NOMINAL // STATUS: AMBITIOUS', bottom: '48%', right: '22%', delay: 3.5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-5 mix-blend-screen opacity-40" style={{ top: '56px' }}>
      {annotations.map((a, i) => (
        <motion.div
          key={i}
          className="absolute text-xs font-mono text-[#4a9eff] whitespace-nowrap opacity-50"
          style={{
            top: a.top,
            bottom: a.bottom,
            right: a.right,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.2] }}
          transition={{
            duration: 0.1, // quick glitch flash
            delay: a.delay,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'reverse',
            repeatDelay: 3 + i * 2,
          }}
        >
          {a.text}
        </motion.div>
      ))}
    </div>
  );
}
