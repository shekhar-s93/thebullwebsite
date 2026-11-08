import { ImageOff } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { imageCandidates } from "@/lib/images";
import { cn } from "@/lib/utils";

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  fit?: "cover" | "contain";
  fallback?: ReactNode;
  eager?: boolean;
}

/** Lazy image that retries Google Drive alternates and falls back to a placeholder. */
export function SmartImage({ src, alt, className, imgClassName, fit = "cover", fallback, eager }: SmartImageProps) {
  const candidates = useMemo(() => imageCandidates(src), [src]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIndex(0);
    setLoaded(false);
  }, [src]);

  const current = candidates[index];

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {current ? (
        <img
          key={current}
          src={current}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setIndex((i) => i + 1);
          }}
          className={cn(
            "h-full w-full transition-opacity duration-300",
            fit === "cover" ? "object-cover" : "object-contain",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ) : (
        (fallback ?? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs">No image</span>
          </div>
        ))
      )}
      {current && !loaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
    </div>
  );
}
