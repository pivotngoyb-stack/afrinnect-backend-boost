// @ts-nocheck
import React from 'react';

/**
 * Enhanced African Pattern component with multiple pattern styles:
 * - kente: Traditional Kente cloth weave
 * - adinkra: Adinkra symbols (Sankofa, Gye Nyame inspired)
 * - mudcloth: Malian Bògòlanfini geometric
 */
export default function AfricanPattern({ 
  className = "", 
  opacity = 0.05, 
  variant = "kente" 
}: { 
  className?: string; 
  opacity?: number; 
  variant?: "kente" | "adinkra" | "mudcloth";
}) {
  const patterns: Record<string, React.ReactNode> = {
    kente: (
      <pattern id="african-kente" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        {/* Kente weave */}
        <rect fill="currentColor" x="0" y="0" width="10" height="10" opacity="0.6" />
        <rect fill="currentColor" x="20" y="20" width="10" height="10" opacity="0.6" />
        <rect fill="currentColor" x="10" y="10" width="10" height="10" opacity="0.3" />
        <rect fill="currentColor" x="30" y="30" width="10" height="10" opacity="0.3" />
        <path d="M0,5 L10,5 M5,0 L5,10 M20,25 L30,25 M25,20 L25,30" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M10,15 L20,15 M15,10 L15,20 M30,35 L40,35 M35,30 L35,40" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5" />
        {/* Diamond accents */}
        <path d="M20,5 L25,0 L30,5 L25,10 Z" fill="currentColor" opacity="0.15" />
        <path d="M0,25 L5,20 L10,25 L5,30 Z" fill="currentColor" opacity="0.15" />
      </pattern>
    ),
    adinkra: (
      <pattern id="african-adinkra" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        {/* Gye Nyame inspired spiral */}
        <circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <circle cx="25" cy="25" r="3" fill="currentColor" opacity="0.3" />
        <path d="M25,17 Q32,20 29,25 Q26,30 25,33" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M25,17 Q18,20 21,25 Q24,30 25,33" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        {/* Corner dots */}
        <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.2" />
        <circle cx="45" cy="5" r="1.5" fill="currentColor" opacity="0.2" />
        <circle cx="5" cy="45" r="1.5" fill="currentColor" opacity="0.2" />
        <circle cx="45" cy="45" r="1.5" fill="currentColor" opacity="0.2" />
        {/* Sankofa-inspired heart/bird */}
        <path d="M25,0 L28,3 L25,6 L22,3 Z" fill="currentColor" opacity="0.15" />
        <path d="M0,25 L3,28 L6,25 L3,22 Z" fill="currentColor" opacity="0.15" />
      </pattern>
    ),
    mudcloth: (
      <pattern id="african-mudcloth" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        {/* Bògòlanfini geometric lines */}
        <line x1="0" y1="15" x2="30" y2="15" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        <line x1="15" y1="0" x2="15" y2="30" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        {/* X marks */}
        <path d="M5,5 L10,10 M10,5 L5,10" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
        <path d="M20,20 L25,25 M25,20 L20,25" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
        {/* Dots */}
        <circle cx="7.5" cy="22.5" r="2" fill="currentColor" opacity="0.15" />
        <circle cx="22.5" cy="7.5" r="2" fill="currentColor" opacity="0.15" />
      </pattern>
    ),
  };

  const patternId = `african-${variant}`;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <svg
        className="absolute w-full h-full"
        style={{ opacity }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>{patterns[variant]}</defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

/**
 * Kente-inspired horizontal divider line
 */
export function KenteDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-gold))] to-transparent opacity-30" />
      <svg width="20" height="8" viewBox="0 0 20 8" className="text-[hsl(var(--brand-gold))] opacity-40">
        <path d="M0,4 L4,0 L8,4 L4,8 Z" fill="currentColor" />
        <path d="M12,4 L16,0 L20,4 L16,8 Z" fill="currentColor" />
        <circle cx="10" cy="4" r="1.5" fill="currentColor" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-gold))] to-transparent opacity-30" />
    </div>
  );
}

/**
 * Adinkra symbol accent — small decorative inline symbol
 */
export function AdinkraAccent({ symbol = "gye-nyame", size = 16, className = "" }: { symbol?: string; size?: number; className?: string }) {
  const symbols: Record<string, React.ReactNode> = {
    "gye-nyame": (
      <>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
        <path d="M8,2 Q12,5 10,8 Q8,11 8,14" fill="none" stroke="currentColor" strokeWidth="1" />
      </>
    ),
    "sankofa": (
      <>
        <path d="M8,2 C12,2 14,5 14,8 C14,11 12,14 8,14 C5,14 3,12 3,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8,6 L6,8 L8,10" fill="currentColor" />
        <circle cx="8" cy="12" r="1.5" fill="currentColor" />
      </>
    ),
    "dwennimmen": (
      <>
        <path d="M4,8 C4,4 8,2 8,2 C8,2 12,4 12,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4,8 C4,12 8,14 8,14 C8,14 12,12 12,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={`inline-block ${className}`}>
      {symbols[symbol] || symbols["gye-nyame"]}
    </svg>
  );
}
