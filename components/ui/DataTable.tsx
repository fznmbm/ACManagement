"use client";

/**
 * DataTable — one responsive list pattern for the admin app.
 *
 * ≥ md: a real table.  < md: a card list (so every admin list works on a
 * phone/iPad without a sideways-scrolling table). Pass columns once; the card
 * view is derived from them, or supply `renderMobileCard` for a custom card.
 *
 * Pairs with `usePaginatedList` + the <Pagination> export below, but works on
 * its own too. Nothing imports it yet — it's a Phase-1 primitive.
 */

import { cn } from "@/lib/utils/helpers";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface Column<T> {
  /** Stable key for the column. */
  key: string;
  /** Header label (table head + mobile row label). */
  header: string;
  /** Cell renderer; defaults to String(row[key]). */
  render?: (row: T) => React.ReactNode;
  /** Extra classes on the <td>/value. */
  className?: string;
  /** Hide this column in the mobile card view. */
  hideOnMobile?: boolean;
  /** Align the header/cell. */
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  loading?: boolean;
  /** Message shown when there are no rows and not loading. */
  empty?: React.ReactNode;
  /** Icon for the empty state (defaults to Inbox). */
  emptyIcon?: React.ComponentType<{ className?: string }>;
  /** Optional custom mobile card; falls back to a label/value list. */
  renderMobileCard?: (row: T) => React.ReactNode;
  /** Optional row click (whole row becomes interactive). */
  onRowClick?: (row: T) => void;
  className?: string;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<T>({
  columns,
  rows,
  keyField,
  loading,
  empty = "No records found",
  emptyIcon: EmptyIcon = Inbox,
  renderMobileCard,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <EmptyIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }

  const rowKey = (row: T) => String(row[keyField]);

  return (
    <div className={className}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 font-medium",
                    alignClass[c.align ?? "left"],
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border/60 last:border-0",
                  onRowClick && "cursor-pointer hover:bg-accent/50",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3 text-foreground",
                      alignClass[c.align ?? "left"],
                      c.className,
                    )}
                  >
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "rounded-xl border border-border bg-card p-4",
              onRowClick && "cursor-pointer active:bg-accent/50",
            )}
          >
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <dl className="space-y-1.5">
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((c) => (
                    <div
                      key={c.key}
                      className="flex items-start justify-between gap-3"
                    >
                      <dt className="text-xs text-muted-foreground">
                        {c.header}
                      </dt>
                      <dd className="text-right text-sm text-foreground">
                        {c.render
                          ? c.render(row)
                          : String((row as any)[c.key] ?? "")}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface PaginationProps {
  page: number; // 1-based
  pageCount: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Compact pager that pairs with usePaginatedList. */
export function Pagination({
  page,
  pageCount,
  total,
  from,
  to,
  onPageChange,
  className,
}: PaginationProps) {
  if (total === 0) return null;
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <span>
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 tabular-nums">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
