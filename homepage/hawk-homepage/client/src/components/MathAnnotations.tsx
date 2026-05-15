import React, { useEffect, useState, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';

export interface MathAnnotation {
  id: string;
  latex: string;
  x: number;
  y: number;
  opacity: number;
  color?: string;
  scale?: number;
}

interface MathAnnotationsProps {
  annotations: MathAnnotation[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function MathAnnotations({ annotations, containerRef }: MathAnnotationsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <AnimatePresence>
        {annotations.map((ann) => (
          <MathItem key={ann.id} annotation={ann} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const MathItem = memo(({ annotation }: { annotation: MathAnnotation }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      const rendered = katex.renderToString(annotation.latex, {
        throwOnError: false,
        displayMode: false,
      });
      setHtml(rendered);
    } catch (e) {
      console.error('KaTeX error:', e);
    }
  }, [annotation.latex]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: annotation.opacity, 
        scale: annotation.scale || 1,
        x: [annotation.x, annotation.x + (Math.random() - 0.5) * 4, annotation.x],
        y: [annotation.y, annotation.y + (Math.random() - 0.5) * 4, annotation.y] 
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 },
        x: { duration: 2 + Math.random(), repeat: Infinity, ease: "easeInOut" },
        y: { duration: 2 + Math.random(), repeat: Infinity, ease: "easeInOut" }
      }}
      className="absolute whitespace-nowrap"
      style={{ 
        color: annotation.color || '#4a9eff',
        textShadow: '0 0 10px rgba(0,0,0,0.5)',
        left: 0,
        top: 0,
        transform: 'translate(-50%, -50%) translateZ(0)', // GPU promotion
        willChange: 'transform, opacity', // Hint to browser
        backfaceVisibility: 'hidden', // Optimize layer compositing
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

MathItem.displayName = 'MathItem';
