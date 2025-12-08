"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  MessageSquare,
  Calendar,
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import WhatsAppNotificationModal from "@/components/notifications/WhatsAppNotificationModal";

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  archived: boolean;
  student_id: string;
  students: {
    first_name: string;
    last_name: string;
    parent_name: string;
    parent_phone: string;
  };
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [dateRange, setDateRange] = useState<"7" | "30" | "90" | "all">("30");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    loadNotifications();
  }, [filterType, showArchived, dateRange, currentPage]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const supabase = createClient();

      let query = supabase
        .from("parent_notifications")
        .select(
          `
          *,
          students (
            first_name,
            last_name,
            parent_name,
            parent_phone
          )
        `,
          { count: "exact" }
        )
        .eq("archived", showArchived)
        .order("created_at", { ascending: false });

      // Date range filter
      if (dateRange !== "all") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        query = query.gte("created_at", daysAgo.toISOString());
      }

      // Type filter
      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setNotifications(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function archiveOldNotifications() {
    if (
      !confirm(
        "Archive all notifications older than 90 days?\n\nThis will not delete them, just move them to archived view."
      )
    )
      return;

    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc("archive_old_notifications");

      if (error) throw error;

      const archivedCount = data || 0;
      alert(`Successfully archived ${archivedCount} old notification(s)!`);
      loadNotifications();
    } catch (error) {
      console.error("Error archiving:", error);
      alert(
        "Failed to archive notifications. Make sure the database function exists."
      );
    }
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      feedback: <MessageSquare className="h-4 w-4" />,
      event: <Calendar className="h-4 w-4" />,
      fine: <AlertCircle className="h-4 w-4" />,
      certificate: <Bell className="h-4 w-4" />,
      attendance: <Bell className="h-4 w-4" />,
      fee_alert: <AlertCircle className="h-4 w-4" />,
    };
    return icons[type] || <Bell className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      feedback: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
      event:
        "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100",
      fine: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",
      certificate:
        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
      attendance:
        "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100",
      fee_alert:
        "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100",
    };
    return (
      colors[type] ||
      "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
    );
  };

  const notificationTypes = [
    { value: "all", label: "All Types" },
    { value: "feedback", label: "Feedback" },
    { value: "event", label: "Events" },
    { value: "fine", label: "Fines" },
    { value: "certificate", label: "Certificates" },
    { value: "attendance", label: "Attendance" },
    { value: "fee_alert", label: "Fee Alerts" },
  ];

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const stats = {
    total: totalCount,
    unread: notifications.filter((n) => !n.is_read).length,
    urgent: notifications.filter((n) => n.priority === "urgent").length,
    thisWeek: notifications.filter((n) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(n.created_at) > weekAgo;
    }).length,
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Notifications Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage parent notifications with WhatsApp integration
            </p>
          </div>
          <button
            onClick={archiveOldNotifications}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            Archive Old (90+ days)
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 border border-input rounded-lg bg-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                {notificationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Archive Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">View</label>
              <select
                value={showArchived ? "archived" : "active"}
                onChange={(e) => {
                  setShowArchived(e.target.value === "archived");
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="active">Active Notifications</option>
                <option value="archived">Archived Notifications</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              {showArchived ? "Archived" : "Active"}
            </p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Unread</p>
            <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Urgent</p>
            <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No notifications found for the selected filters
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border border-input rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          {notification.priority === "urgent" && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100">
                              Urgent
                            </span>
                          )}
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          For: {notification.students.first_name}{" "}
                          {notification.students.last_name} (
                          {notification.students.parent_name})
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message.substring(0, 150)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleString(
                            "en-GB",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedNotification(notification);
                        setShowWhatsAppModal(true);
                      }}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-input rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-input rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* WhatsApp Modal */}
        {selectedNotification && (
          <WhatsAppNotificationModal
            isOpen={showWhatsAppModal}
            onClose={() => {
              setShowWhatsAppModal(false);
              setSelectedNotification(null);
            }}
            notification={{
              id: selectedNotification.id,
              type: selectedNotification.type,
              priority: selectedNotification.priority,
              title: selectedNotification.title,
              message: selectedNotification.message,
              student: selectedNotification.students,
            }}
          />
        )}
      </div>
    </div>
  );
}
