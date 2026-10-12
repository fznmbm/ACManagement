// components/ui/ThemeToggle.tsx
"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme, actualTheme, mounted } = useTheme();

  if (!mounted) {
    // Placeholder during hydration (compact on mobile, segmented on desktop)
    return (
      <>
        <div className="sm:hidden w-9 h-9 rounded-lg border border-border bg-muted/50" />
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/50">
          <div className="w-8 h-8 rounded-md" />
          <div className="w-8 h-8 rounded-md" />
          <div className="w-8 h-8 rounded-md" />
        </div>
      </>
    );
  }

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded-md transition-all duration-200 ${
      // isActive
      //   ? "bg-primary text-primary-foreground shadow-sm"
      //   : "hover:bg-accent text-muted-foreground hover:text-foreground"
      isActive
        ? "bg-accent text-foreground ring-2 ring-primary" // Ring instead of solid
        : "hover:bg-accent text-muted-foreground"
    }`;

  return (
    <>
      {/* Mobile: one compact button that flips light ⇄ dark */}
      <button
        onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
        className="sm:hidden p-2 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="Toggle light or dark mode"
        aria-label="Toggle light or dark mode"
      >
        {actualTheme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      {/* Desktop: Light / Dark / System segmented control */}
      <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/50">
        {/* Light Mode Button */}
        <button
          onClick={() => setTheme("light")}
          className={buttonClass(theme === "light")}
          title="Light Mode"
          aria-label="Switch to Light Mode"
        >
          <Sun className="h-4 w-4" />
        </button>

        {/* Dark Mode Button */}
        <button
          onClick={() => setTheme("dark")}
          className={buttonClass(theme === "dark")}
          title="Dark Mode"
          aria-label="Switch to Dark Mode"
        >
          <Moon className="h-4 w-4" />
        </button>

        {/* System Mode Button */}
        <button
          onClick={() => setTheme("system")}
          className={buttonClass(theme === "system")}
          title="System Theme"
          aria-label="Use System Theme"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
