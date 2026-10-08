"use client";

/**
 * FilterBar — one search + filter row for admin lists, replacing the ~5
 * slightly-different filter implementations. Controlled and presentational:
 * the parent owns the values (usually alongside usePaginatedList) and this
 * renders search + any number of selects, applying on change. Nothing imports
 * it yet — Phase-1 primitive.
 */

import { cn } from "@/lib/utils/helpers";
import { Search, X } from "lucide-react";

export interface FilterSelect {
  key: string;
  /** Accessible label / placeholder option text. */
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  /** Shown as a "Clear" button when provided and something is active. */
  onClear?: () => void;
  hasActiveFilters?: boolean;
  /** Extra controls (e.g. an Export button) rendered at the end. */
  children?: React.ReactNode;
  className?: string;
}

const inputBase =
  "h-10 rounded-lg border border-border bg-background text-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-primary/40";

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  selects = [],
  onClear,
  hasActiveFilters,
  children,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:flex-wrap",
        className,
      )}
    >
      {/* Search */}
      <div className="relative flex-1 sm:min-w-[200px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(inputBase, "w-full pl-9 pr-3 text-sm")}
        />
      </div>

      {/* Selects */}
      {selects.map((s) => (
        <select
          key={s.key}
          value={s.value}
          onChange={(e) => s.onChange(e.target.value)}
          aria-label={s.label}
          className={cn(inputBase, "px-3 text-sm")}
        >
          <option value="">{s.label}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {onClear && hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}

      {children}
    </div>
  );
}
