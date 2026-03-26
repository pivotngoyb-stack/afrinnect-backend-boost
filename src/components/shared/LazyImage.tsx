// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  priority?: boolean;
}

export default function LazyImage({ src, alt, className = '', placeholder = null, onLoad = () => {}, priority = false }: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return;
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); } }); },
      { rootMargin: '50px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          {placeholder || <Loader2 className="animate-spin text-muted-foreground" size={24} />}
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">Failed to load</div>
      ) : (
        isInView && (
          <img
            src={src} alt={alt}
            className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
            onLoad={() => { setIsLoading(false); onLoad(); }}
            onError={() => { setIsLoading(false); setError(true); }}
            loading={priority ? 'eager' : 'lazy'}
          />
        )
      )}
    </div>
  );
}
