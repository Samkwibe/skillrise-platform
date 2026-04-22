"use client";
import { useState } from "react";

export function AboutAvatar({ src, alt, initials }: { src: string; alt: string; initials: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-square rounded-[20px] overflow-hidden border border-border1 bg-s2 mb-4">
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-5xl font-display font-bold text-t2 bg-gradient-to-br from-s2 to-s3">
          {initials}
        </div>
      )}
    </div>
  );
}
