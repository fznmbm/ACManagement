"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useParentNotifications() {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newEvents, setNewEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationCounts();

    // Refresh every 60 seconds
    const interval = setInterval(loadNotificationCounts, 60000);

    return () => clearInterval(interval);
  }, []);

  async function loadNotificationCounts() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get parent's students
      const { data: linkData } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);

      const studentIds = linkData?.map((link) => link.student_id) || [];

      if (studentIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get students with class IDs
      const { data: studentData } = await supabase
        .from("students")
        .select("id, class_id")
        .in("id", studentIds);

      const classIds =
        studentData?.map((s) => s.class_id).filter(Boolean) || [];

      // Count messages created in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Individual messages
      const { count: individualCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("student_id", studentIds)
        .gte("created_at", sevenDaysAgo.toISOString());

      // Class messages
      let classCount = 0;
      if (classIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds)
          .gte("created_at", sevenDaysAgo.toISOString());
        classCount = count || 0;
      }

      setUnreadMessages((individualCount || 0) + classCount);

      // Count events created in last 7 days
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("visible_to_parents", true)
        .gte("created_at", sevenDaysAgo.toISOString());

      setNewEvents(eventsCount || 0);
    } catch (error) {
      console.error("Error loading notification counts:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    unreadMessages,
    newEvents,
    loading,
    refresh: loadNotificationCounts,
  };
}
