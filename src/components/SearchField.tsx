import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}

export function SearchField({ value, onChange, placeholder = "Search…", className, size = "md", autoFocus }: SearchFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "lg" ? "h-5 w-5" : "h-4 w-4",
        )}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        maxLength={120}
        className={cn(
          "w-full rounded-xl border border-input bg-background pl-11 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 [&::-webkit-search-cancel-button]:hidden",
          size === "lg" ? "h-14 text-base" : "h-11 text-sm",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
