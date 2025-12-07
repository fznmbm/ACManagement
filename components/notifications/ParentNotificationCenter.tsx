"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, X } from "lucide-react";

interface Notification {
  id: string;
  type:
    | "feedback"
    | "announcement"
    | "fee_alert"
    | "fine"
    | "certificate"
    | "attendance"
    | "event";
  priority: "normal" | "urgent";
  title: string;
  message: string;
  link_type: string | null;
  link_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  } | null;
}

export default function ParentNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [filter, typeFilter]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "unread") params.append("unread_only", "true");
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  function getNotificationIcon(type: Notification["type"]) {
    const icons = {
      feedback: "💬",
      announcement: "📢",
      fee_alert: "💷",
      fine: "⚠️",
      certificate: "🎓",
      attendance: "📋",
      event: "📅",
    };
    return icons[type];
  }

  function getNotificationColor(
    priority: Notification["priority"],
    isRead: boolean
  ) {
    if (isRead) return "bg-card border-input";
    if (priority === "urgent")
      return "bg-red-50 dark:bg-red-900/20 border-red-500";
    return "bg-blue-50 dark:bg-blue-900/20 border-blue-500";
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-3 py-1 text-sm font-bold rounded-full bg-red-500 text-white">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with school communications
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-accent"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-accent"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
          >
            <option value="all">All Types</option>
            <option value="feedback">Feedback</option>
            <option value="announcement">Announcements</option>
            <option value="fee_alert">Fee Alerts</option>
            <option value="fine">Fines</option>
            <option value="certificate">Certificates</option>
            <option value="attendance">Attendance</option>
            <option value="event">Events</option>
          </select>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isExpanded = expandedId === notification.id;

              return (
                <div
                  key={notification.id}
                  className={`border-2 rounded-lg transition-all ${getNotificationColor(
                    notification.priority,
                    notification.is_read
                  )}`}
                >
                  {/* Clickable Header */}
                  <div
                    onClick={() => {
                      setExpandedId(isExpanded ? null : notification.id);
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {notification.priority === "urgent" && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500 text-white">
                              URGENT
                            </span>
                          )}
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold mb-1">
                          {notification.title}
                        </h3>

                        {notification.student && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Re: {notification.student.first_name}{" "}
                            {notification.student.last_name}
                          </p>
                        )}

                        {!isExpanded && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 items-start">
                        <button className="text-muted-foreground">
                          {isExpanded ? "▼" : "▶"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-input">
                      <div className="pt-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">
                            {notification.message}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
