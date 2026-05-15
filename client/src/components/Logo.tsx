import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'icon' | 'full';
}

/**
 * Lattice9 Logo - Enterprise Offensive Intelligence Identity
 * Design: A geometric lattice structure representing node topology and graph intelligence.
 */
export const Logo: React.FC<LogoProps> = ({ className = "h-8", variant = 'full' }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full w-auto"
      >
        {/* Lattice Nodes */}
        <circle cx="20" cy="20" r="4" fill="currentColor" />
        <circle cx="80" cy="20" r="4" fill="currentColor" />
        <circle cx="50" cy="50" r="6" fill="currentColor" className="text-indigo-500" />
        <circle cx="20" cy="80" r="4" fill="currentColor" />
        <circle cx="80" cy="80" r="4" fill="currentColor" />
        
        {/* Lattice Edges */}
        <path d="M24 20H76" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
        <path d="M20 24V76" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
        <path d="M80 24V76" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
        <path d="M24 80H76" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
        
        {/* Central Connections */}
        <path d="M20 20L46 46" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
        <path d="M80 20L54 46" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
        <path d="M20 80L46 54" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
        <path d="M80 80L54 54" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
      </svg>
      
      {variant === 'full' && (
        <span className="font-bold tracking-tighter text-white uppercase text-lg">
          Lattice<span className="text-indigo-500">9</span>
        </span>
      )}
    </div>
  );
};
