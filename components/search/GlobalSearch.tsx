"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Users, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "student";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function GlobalSearch() {
  const supabase = createClient();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (q: string) => {
    setLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Search students
      const { data: students } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, student_number, status, classes(name)",
        )
        .or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,student_number.ilike.%${q}%,parent_phone.ilike.%${q}%`,
        )
        .limit(8);

      students?.forEach((s: any) => {
        allResults.push({
          type: "student",
          id: s.id,
          title: `${s.first_name} ${s.last_name}`,
          subtitle: `${s.student_number} · ${s.classes?.name || "No class"} · ${s.status}`,
          href: `/students/${s.id}`,
        });
      });

      setResults(allResults);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Trigger */}
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg hover:bg-accent transition-colors w-64"
      >
        <Search className="h-4 w-4" />
        <span>Search students...</span>
        <kbd className="ml-auto text-xs bg-background border border-border rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-0 left-0 w-96 bg-background border border-border rounded-lg shadow-xl z-50">
          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students by name, number, phone..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            )}
            {!loading && query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {results.length > 0 && (
              <div className="py-1">
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Students
                </p>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="bg-muted px-1 rounded">↵</kbd> to select ·{" "}
              <kbd className="bg-muted px-1 rounded">Esc</kbd> to close
            </p>
            <Link
              href={query ? `/students?search=${query}` : "/students"}
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
