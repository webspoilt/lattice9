import { useEffect, useState, useRef } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

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
    // We use a monospaced font
    const font = '12px "IBM Plex Mono", monospace';
    
    // Check actual container width if available, or fallback
    const actualWidth = containerRef.current ? containerRef.current.clientWidth : width;
    
    try {
      const prepared = prepareWithSegments(content, font, { whiteSpace: 'pre-wrap' });
      // 20px line height
      const layout = layoutWithLines(prepared, actualWidth, 20);
      setLines(layout.lines.map(l => l.text));
    } catch (e) {
      // Fallback if pretext fails for some reason
      setLines(content.split('\n'));
    }
  }, [content, width]);

  return (
    <div 
      ref={containerRef}
      className={`font-mono text-[12px] leading-[20px] ${className}`}
      style={{ color, opacity: 0.8 }}
    >
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre">{line || ' '}</div>
      ))}
    </div>
  );
}
