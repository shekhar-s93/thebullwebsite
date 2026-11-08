import { Link } from "@tanstack/react-router";

import { BrandLogo, useBranding } from "@/components/BrandLogo";

export function SiteFooter() {
  const { site_name, site_description } = useBranding();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div className="max-w-md space-y-4">
          <Link to="/" aria-label={`${site_name} home`}>
            <BrandLogo className="h-14 rounded-lg" showName />
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">{site_description}</p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Explore</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/videos" className="hover:text-foreground">Videos</Link></li>
            <li><Link to="/sites" className="hover:text-foreground">Sites</Link></li>
            <li><Link to="/applications" className="hover:text-foreground">Applications</Link></li>
            <li><Link to="/search" className="hover:text-foreground">Search</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Company</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Admin Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {year} {site_name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
