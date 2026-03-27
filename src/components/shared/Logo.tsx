import React, { forwardRef } from "react";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const sizeMap = {
  small: "h-8",
  medium: "h-12",
  large: "h-16",
};

const Logo = forwardRef<HTMLDivElement, LogoProps>(({ size = "medium", className = "" }, ref) => {
  return (
    <div ref={ref} className={`flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <span className="font-bold text-2xl text-primary">Afrinnect</span>
    </div>
  );
});

Logo.displayName = "Logo";

export default Logo;
