"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  Bell,
  Receipt,
  CreditCard,
  MessageSquare,
  BookOpen,
  Megaphone,
  Award,
  CalendarCheck,
  Calendar,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  student_id: string | null;
  students?: { first_name: string; last_name: string } | null;
}

const TYPE_META: Record<string, { icon: any; label: string; tint: string }> = {
  fine: {
    icon: Receipt,
    label: "Fine",
    tint: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
  fee_alert: {
    icon: CreditCard,
    label: "Fee",
    tint: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  },
  feedback: {
    icon: MessageSquare,
    label: "Class feedback",
    tint: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  },
  academic_note: {
    icon: BookOpen,
    label: "Academic note",
    tint: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    tint: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  },
  certificate: {
    icon: Award,
    label: "Certificate",
    tint: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  },
  attendance: {
    icon: CalendarCheck,
    label: "Attendance",
    tint: "text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400",
  },
  event: {
    icon: Calendar,
    label: "Event",
    tint: "text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300",
  },
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function targetFor(n: Notification): string {
  if (n.type === "fine" || n.type === "fee_alert") return "/parent/finances";
  if (n.type === "event") return "/parent/events";
  if (n.student_id) return `/parent/student/${n.student_id}`;
  return "/parent/dashboard";
}

export default function ParentUpdatesPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUpdates = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/parent/login");
        return;
      }
      const { data } = await supabase
        .from("parent_notifications")
        .select(
          "id, type, title, message, is_read, created_at, student_id, students(first_name, last_name)",
        )
        .eq("parent_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data || []) as unknown as Notification[]);
    } catch (err) {
      console.error("Updates fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openItem = async (n: Notification) => {
    if (!n.is_read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
      await supabase
        .from("parent_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", n.id);
    }
    router.push(targetFor(n));
  };

  const markAllRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    const { error } = await supabase
      .from("parent_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("parent_user_id", user.id)
      .eq("is_read", false);
    if (error) toast.error("Couldn't update. Please try again.");
    else toast.success("All updates marked as read");
  };

  const unreadCount = items.filter((i) => !i.is_read).length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Updates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No updates yet. Notices about fees, feedback and events will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.announcement;
            const Icon = meta.icon;
            const childName = n.students
              ? `${n.students.first_name} ${n.students.last_name}`
              : null;
            return (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`w-full text-left flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                  n.is_read
                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    : "bg-primary/5 dark:bg-primary/10 border-primary/30"
                } hover:border-primary`}
              >
                <div className={`shrink-0 rounded-full p-2 ${meta.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span className="font-medium">{meta.label}</span>
                    {childName && (
                      <>
                        <span>·</span>
                        <span className="truncate">{childName}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
