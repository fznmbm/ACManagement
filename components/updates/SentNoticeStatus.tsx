// components/updates/SentNoticeStatus.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronRight, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";

interface Row {
  id: string;
  type: string;
  title: string;
  created_at: string;
  is_read: boolean | null;
  read_at: string | null;
  seen_at: string | null;
  requires_ack: boolean | null;
  acknowledged_at: string | null;
}

interface Group {
  key: string;
  title: string;
  type: string;
  created_at: string;
  total: number;
  seen: number;
  ackRequired: number;
  acked: number;
}

const TYPE_LABEL: Record<string, string> = {
  feedback: "Class feedback",
  announcement: "Announcement",
  academic_note: "Academic note",
  fee_alert: "Fee",
  fine: "Fine",
  certificate: "Certificate",
  attendance: "Attendance",
  event: "Event",
};

export default function SentNoticeStatus() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("parent_notifications")
        .select(
          "id, type, title, created_at, is_read, read_at, seen_at, requires_ack, acknowledged_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      const map = new Map<string, Group>();
      for (const r of (data || []) as Row[]) {
        // One "send" = rows that share type + title + the minute they were created.
        const key = `${r.type}||${r.title}||${(r.created_at || "").slice(0, 16)}`;
        let g = map.get(key);
        if (!g) {
          g = {
            key,
            title: r.title,
            type: r.type,
            created_at: r.created_at,
            total: 0,
            seen: 0,
            ackRequired: 0,
            acked: 0,
          };
          map.set(key, g);
        }
        g.total += 1;
        if (r.seen_at || r.read_at) g.seen += 1;
        if (r.requires_ack) {
          g.ackRequired += 1;
          if (r.acknowledged_at) g.acked += 1;
        }
      }
      setGroups(Array.from(map.values()).slice(0, 25));
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) load();
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          Delivery status — who&apos;s seen &amp; acknowledged
        </span>
        {loaded && (
          <span className="text-xs text-muted-foreground">
            {groups.length} recent
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-border p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No notices sent yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => {
                const seenPct =
                  g.total > 0 ? Math.round((g.seen / g.total) * 100) : 0;
                const ackPending = g.ackRequired > 0 && g.acked < g.ackRequired;
                return (
                  <li
                    key={g.key}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABEL[g.type] || g.type} ·{" "}
                        {formatDate(g.created_at, "short")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        {g.seen}/{g.total}
                        <span className="hidden sm:inline">· {seenPct}%</span>
                      </span>
                      {g.ackRequired > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border ${
                            ackPending
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {g.acked}/{g.ackRequired}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
