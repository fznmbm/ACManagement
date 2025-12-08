"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useParentNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newEvents, setNewEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();

    // Refresh every 30 seconds
    const interval = setInterval(loadCounts, 30000);

    return () => clearInterval(interval);
  }, []);

  async function loadCounts() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get unread notifications count
      const { data: notifications, error } = await supabase
        .from("parent_notifications")
        .select("id, type")
        .eq("parent_user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      // Total unread count
      setUnreadCount(notifications?.length || 0);

      // Count by type
      const messageCount =
        notifications?.filter((n) => n.type === "feedback").length || 0;
      const eventCount =
        notifications?.filter((n) => n.type === "event").length || 0;

      setUnreadMessages(messageCount);
      setNewEvents(eventCount);
    } catch (error) {
      console.error("Error loading notification counts:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    unreadCount,
    unreadMessages,
    newEvents,
    loading,
    refresh: loadCounts,
  };
}
