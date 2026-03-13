import React from "react";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const sizeMap = {
  small: "h-8",
  medium: "h-12",
  large: "h-16",
};

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <span className="font-bold text-2xl text-primary">Afrinnect</span>
    </div>
  );
}
