import React from "react";

interface AfricanPatternProps {
  className?: string;
  opacity?: number;
}

export default function AfricanPattern({ className = "", opacity = 0.05 }: AfricanPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Decorative African-inspired pattern overlay */}
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="african-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 0 L60 30 L30 60 L0 30Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#african-pattern)" />
      </svg>
    </div>
  );
}
