"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationCounts {
  total: number;
  feedback: number;
  event: number;
  fine: number;
  certificate: number;
  attendance: number;
  fee_alert: number;
}

interface UnifiedNotification {
  id: string;
  type:
    | "feedback"
    | "event"
    | "fine"
    | "certificate"
    | "attendance"
    | "fee_alert";
  priority: "normal" | "urgent" | "critical";
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  archived?: boolean;
  students: {
    first_name: string;
    last_name: string;
  } | null;
}

export function useUnifiedNotifications() {
  const [counts, setCounts] = useState<NotificationCounts>({
    total: 0,
    feedback: 0,
    event: 0,
    fine: 0,
    certificate: 0,
    attendance: 0,
    fee_alert: 0,
  });
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Query with fallback for archived column (in case migration not run yet)
      let query = supabase
        .from("parent_notifications")
        .select("type")
        .eq("parent_user_id", user.id)
        .eq("is_read", false);

      // Try to filter by archived (will work after migration)
      try {
        query = query.eq("archived", false);
      } catch (e) {
        // Archived column doesn't exist yet, continue without it
        console.log("Archived column not yet added");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading counts:", error);
        return;
      }

      // Calculate breakdown
      const breakdown = data?.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setCounts({
        total: data?.length || 0,
        feedback: breakdown?.feedback || 0,
        event: breakdown?.event || 0,
        fine: breakdown?.fine || 0,
        certificate: breakdown?.certificate || 0,
        attendance: breakdown?.attendance || 0,
        fee_alert: breakdown?.fee_alert || 0,
      });
    } catch (error) {
      console.error("Error in loadCounts:", error);
      // Set to zero on error to avoid showing stale data
      setCounts({
        total: 0,
        feedback: 0,
        event: 0,
        fine: 0,
        certificate: 0,
        attendance: 0,
        fee_alert: 0,
      });
    }
  }, []);

  const loadNotifications = useCallback(
    async (
      filter: "all" | "unread" = "all",
      type?: string,
      limit: number = 50
    ) => {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        let query = supabase
          .from("parent_notifications")
          .select(
            `
          id,
          type,
          priority,
          title,
          message,
          created_at,
          is_read,
          students (
            first_name,
            last_name
          )
        `
          )
          .eq("parent_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        // Try to filter by archived (graceful fallback)
        try {
          query = query.eq("archived", false);
        } catch (e) {
          // Column doesn't exist yet
        }

        if (filter === "unread") {
          query = query.eq("is_read", false);
        }

        if (type && type !== "all") {
          query = query.eq("type", type);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading notifications:", error);
          setNotifications([]);
        } else {
          setNotifications(data || []);
        }
      } catch (error) {
        console.error("Error in loadNotifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const supabase = createClient();

        const { error } = await supabase
          .from("parent_notifications")
          .update({ is_read: true })
          .eq("id", notificationId);

        if (error) {
          console.error("Error marking as read:", error);
          return;
        }

        // Update local state optimistically
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );

        // Refresh counts
        await loadCounts();
      } catch (error) {
        console.error("Error in markAsRead:", error);
      }
    },
    [loadCounts]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      let query = supabase
        .from("parent_notifications")
        .update({ is_read: true })
        .eq("parent_user_id", user.id)
        .eq("is_read", false);

      // Try to filter by archived
      try {
        query = query.eq("archived", false);
      } catch (e) {
        // Column doesn't exist yet
      }

      const { error } = await query;

      if (error) {
        console.error("Error marking all as read:", error);
        return;
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      // Refresh counts
      await loadCounts();
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
    }
  }, [loadCounts]);

  // Setup on mount and real-time subscription
  useEffect(() => {
    loadCounts();
    loadNotifications();

    const supabase = createClient();

    // Subscribe to changes
    const channel = supabase
      .channel("parent_notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_notifications",
        },
        () => {
          console.log("Notification change detected, refreshing...");
          loadCounts();
          loadNotifications();
        }
      )
      .subscribe();

    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      loadCounts();
    }, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [loadCounts, loadNotifications]);

  return {
    counts,
    notifications,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    refresh: loadCounts,
  };
}
