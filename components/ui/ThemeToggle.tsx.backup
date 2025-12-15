// components/ui/ThemeToggle.tsx
"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    // Return placeholder during hydration
    return (
      <div className="p-2 rounded-lg w-9 h-9 flex items-center justify-center">
        <Sun className="h-5 w-5 opacity-50" />
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5 text-yellow-600" />;
      case "dark":
        return <Moon className="h-5 w-5 text-blue-600" />;
      case "system":
        return <Monitor className="h-5 w-5 text-gray-600" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Switch to Dark Mode";
      case "dark":
        return "Switch to System Theme";
      case "system":
        return "Switch to Light Mode";
      default:
        return "Toggle Theme";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium capitalize">{theme} Mode</span>
      <button
        onClick={cycleTheme}
        className="p-2 rounded-lg hover:bg-accent transition-colors border border-border"
        title={getLabel()}
      >
        {getIcon()}
      </button>
    </div>
  );
}
