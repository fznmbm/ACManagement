"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/helpers";

/**
 * Shared header for the Finance area so Fees and Fines read as one place with
 * two tabs (they remain separate routes). Each page renders
 * <FinanceTabs active="fees" /> at the top.
 */
export default function FinanceTabs({ active }: { active: "fees" | "fines" }) {
  const tabs = [
    { key: "fees", label: "Fees", href: "/fees" },
    { key: "fines", label: "Fines", href: "/fines" },
  ] as const;

  return (
    <div>
      <h1 className="text-xl font-bold md:text-2xl">Finance</h1>
      <p className="text-sm text-muted-foreground">
        Invoices, payments and fines
      </p>
      <div className="mt-3 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
