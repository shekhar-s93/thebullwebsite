import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import defaultLogo from "@/assets/thebull-logo.jpeg.asset.json";
import { DEFAULT_BRANDING } from "@/lib/public.functions";
import { brandingQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const DEFAULT_LOGO_URL = defaultLogo.url;

export function useBranding() {
  const { data } = useQuery(brandingQuery);
  const branding = data ?? DEFAULT_BRANDING;
  const logoUrl =
    branding.logo_mode === "none"
      ? null
      : branding.logo_mode === "default" || !branding.logo_url
        ? DEFAULT_LOGO_URL
        : branding.logo_url;
  return { ...branding, logoUrl };
}

interface BrandLogoProps {
  /** Height class, e.g. "h-10". The width follows the logo's own proportions. */
  className?: string;
  showName?: boolean;
  nameClassName?: string;
}

/** The site logo, read from the central branding setting. Never stretched. */
export function BrandLogo({ className = "h-10", showName = false, nameClassName }: BrandLogoProps) {
  const { logoUrl, site_name } = useBranding();
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = logoUrl && failed !== logoUrl;

  return (
    <span className="inline-flex items-center gap-3">
      {showImage ? (
        <img
          src={logoUrl}
          alt={`${site_name} logo`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(logoUrl)}
          className={cn("w-auto max-w-[220px] object-contain", className)}
        />
      ) : null}
      {(showName || !showImage) && (
        <span className={cn("font-display text-xl font-bold tracking-tight", nameClassName)}>
          {site_name}
        </span>
      )}
    </span>
  );
}
