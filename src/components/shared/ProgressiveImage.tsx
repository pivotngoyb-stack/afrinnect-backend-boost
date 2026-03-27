import React, { useState, memo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  blurPlaceholder?: string;
  priority?: boolean;
  draggable?: boolean;
  onLoad?: () => void;
}

/**
 * Progressive image component with blur-up loading effect.
 * Shows a tiny blurred placeholder, then transitions to the full image.
 */
const ProgressiveImage = memo(function ProgressiveImage({
  src,
  alt,
  className = '',
  blurPlaceholder,
  priority = false,
  draggable = false,
  onLoad,
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {blurPlaceholder && !loaded && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ filter: 'blur(20px)' }}
        />
      )}

      {/* Skeleton fallback when no placeholder */}
      {!blurPlaceholder && !loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Actual image */}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          draggable={draggable}
          onLoad={handleLoad}
          className={cn(
            'w-full h-full object-cover object-center transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
});

export default ProgressiveImage;
