import React, { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = React.memo(({ src, alt, className = '' }) => {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    // Standard image preloader for smooth transition
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoaded(true);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* Blurred Placeholder while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-400 font-mono">CHALO</span>
        </div>
      )}
      
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${className}`}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';
