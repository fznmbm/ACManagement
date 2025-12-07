"use client";

import { useState, useEffect } from "react";

export function useParentNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const response = await fetch("/api/notifications?unread_only=true");
      const data = await response.json();

      if (data.unread_count !== undefined) {
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    unreadCount,
    loading,
    refresh: loadUnreadCount,
  };
}
