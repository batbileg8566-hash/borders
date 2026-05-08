import React, { useState } from "react";

interface PortImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function PortImage({ src, alt, className = "" }: PortImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <svg className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-widest">Зураг олдсонгүй</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {loaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
