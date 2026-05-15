import { useEffect, useState, useRef } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface PretextLogProps {
  content: string;
  width?: number;
  color?: string;
  className?: string;
}

export function PretextLog({ content, width = 600, color = '#4a9eff', className = '' }: PretextLogProps) {
  const [lines, setLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const font = '12px "IBM Plex Mono", monospace';
    const actualWidth = containerRef.current ? containerRef.current.clientWidth : width;
    
    try {
      const prepared = prepareWithSegments(content, font, { whiteSpace: 'pre-wrap' });
      const layout = layoutWithLines(prepared, actualWidth, 26);
      setLines(layout.lines.map(l => l.text));
    } catch (e) {
      setLines(content.split('\n'));
    }
  }, [content, width]);

  const renderMathContent = (text: string) => {
    // Check if the line is a mathematical telemetry stream
    // Regex targets Bellman, Shannon, and Spectral Laplacian notations circled by the user
    const mathRegex = /V\*\(s\)|H\(X\)|∂Ω\/∂t|Σ|∫|λ_2|P\(H\|E\)/;
    
    if (mathRegex.test(text) && !text.includes('[') && !text.includes(']')) {
      try {
        // Map common plaintext notations to LaTeX
        const latex = text
          .replace(/V\*\(s\)/g, 'V^*(s)')
          .replace(/Σ/g, '\\sum')
          .replace(/∂/g, '\\partial')
          .replace(/∫/g, '\\int')
          .replace(/λ_2/g, '\\lambda_2')
          .replace(/φ\(y\)/g, '\\phi(y)')
          .replace(/dΓ\(v\)/g, 'd\\Gamma(v)')
          .replace(/γV\*/g, '\\gamma V^*');

        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        
        return (
          <span 
            className="inline-block py-1 opacity-90 transition-opacity hover:opacity-100" 
            style={{ color: '#4a9eff' }}
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        );
      } catch (e) {
        return <span className="whitespace-pre">{text}</span>;
      }
    }

    return <span className="whitespace-pre">{text || ' '}</span>;
  };

  return (
    <div 
      ref={containerRef}
      className={`font-mono text-[12px] leading-[26px] ${className}`}
      style={{ color, opacity: 0.8 }}
    >
      {lines.map((line, i) => (
        <div key={i} className="min-h-[26px]">
          {renderMathContent(line)}
        </div>
      ))}
    </div>
  );
}
