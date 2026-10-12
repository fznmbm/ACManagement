// components/layout/PageHeader.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  /** The page name — shown once, as the single H1 for the screen. */
  title: string;
  /** Optional one-line description under the title. */
  subtitle?: string;
  /** Optional back link (detail/sub pages). */
  backHref?: string;
  backLabel?: string;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The one header every page owns. The global top bar no longer prints the page
 * title, so this is the single source of the screen's name, subtitle and
 * primary action — consistent placement across admin and parent.
 */
export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel || "Back"}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
