"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK = "/images/logo.png";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: ImageProps["src"] | null;
  fallbackSrc?: string;
  fallbackClassName?: string;
};

export default function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  fallbackClassName = "object-contain p-6",
  onError,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [usingFallback, setUsingFallback] = useState(!src);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setUsingFallback(!src);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      className={`${className ?? ""} ${usingFallback ? fallbackClassName : ""}`}
      onError={(event) => {
        onError?.(event);
        if (!usingFallback) {
          setUsingFallback(true);
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
