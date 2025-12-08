"use client";

import { useState, useEffect } from "react";
import { useUnifiedNotifications } from "@/hooks/useUnifiedNotifications";
import {
  Bell,
  MessageSquare,
  Calendar,
  AlertCircle,
  Award,
  DollarSign,
  Clock,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ParentInboxPage() {
  const router = useRouter();
  const {
    counts,
    notifications,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useUnifiedNotifications();

  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications(filterRead, filterType);
  }, [filterType, filterRead, loadNotifications]);

  const typeIcons: Record<string, JSX.Element> = {
    feedback: <MessageSquare className="h-5 w-5" />,
    event: <Calendar className="h-5 w-5" />,
    fine: <DollarSign className="h-5 w-5" />,
    certificate: <Award className="h-5 w-5" />,
    attendance: <Clock className="h-5 w-5" />,
    fee_alert: <AlertCircle className="h-5 w-5" />,
  };

  const typeColors: Record<string, string> = {
    feedback:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    event:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    fine: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    certificate:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    attendance:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    fee_alert:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  };

  const typeLabels: Record<string, string> = {
    feedback: "Teacher Feedback",
    event: "Event",
    fine: "Fine",
    certificate: "Certificate",
    attendance: "Attendance",
    fee_alert: "Fee Alert",
  };

  function handleNotificationClick(notification: any) {
    // Toggle expansion
    setExpandedId(expandedId === notification.id ? null : notification.id);

    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  }

  function handleViewRelated(e: React.MouseEvent, type: string) {
    e.stopPropagation();

    if (type === "event") {
      router.push("/parent/events");
    } else if (type === "fine" || type === "fee_alert") {
      router.push("/parent/finances");
    }
  }

  const filterOptions = [
    { value: "all", label: "All", count: counts.total },
    { value: "feedback", label: "Messages", count: counts.feedback },
    { value: "event", label: "Events", count: counts.event },
    { value: "fine", label: "Fines", count: counts.fine },
    { value: "certificate", label: "Certificates", count: counts.certificate },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Inbox
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              All updates and communications in one place
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Total
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {counts.total}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Messages
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {counts.feedback}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Events
          </p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {counts.event}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Fines
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {counts.fine}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Awards
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {counts.certificate}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filterType === option.value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {option.label}
                {filterRead === "unread" && option.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Read/Unread & Mark All */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterRead("all")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterRead === "all"
                    ? "bg-slate-900 dark:bg-slate-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRead("unread")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterRead === "unread"
                    ? "bg-slate-900 dark:bg-slate-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                Unread
              </button>
            </div>

            {counts.total > 0 && filterRead === "unread" && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-medium"
              >
                <Check className="h-4 w-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading inbox...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <Bell className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {filterRead === "unread"
              ? "All caught up!"
              : "No notifications yet"}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {filterRead === "unread"
              ? "You don't have any unread notifications"
              : filterType === "all"
              ? "You'll see updates and messages here"
              : `No ${typeLabels[filterType]?.toLowerCase()} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`border rounded-lg cursor-pointer transition-all overflow-hidden ${
                notification.is_read
                  ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                  : "border-primary/50 bg-primary/5 dark:bg-primary/10 hover:border-primary shadow-sm"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`p-3 rounded-lg flex-shrink-0 ${
                      typeColors[notification.type]
                    }`}
                  >
                    {typeIcons[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            typeColors[notification.type]
                          }`}
                        >
                          {typeLabels[notification.type]}
                        </span>
                        {notification.priority === "urgent" && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            ⚠️ Urgent
                          </span>
                        )}
                        {notification.priority === "critical" && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500 text-white">
                            🚨 Critical
                          </span>
                        )}
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
                        {expandedId === notification.id ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* Title */}
                    <h3
                      className={`font-semibold mb-1 ${
                        notification.is_read
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {notification.title}
                    </h3>

                    {/* Student Info */}
                    {notification.students && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Re: {notification.students.first_name}{" "}
                        {notification.students.last_name}
                      </p>
                    )}

                    {/* Preview */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {notification.message}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(notification.created_at).toLocaleString(
                        "en-GB",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === notification.id && (
                <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {notification.message}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {notification.type === "event" && (
                      <button
                        onClick={(e) => handleViewRelated(e, "event")}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        View in Calendar
                      </button>
                    )}
                    {(notification.type === "fine" ||
                      notification.type === "fee_alert") && (
                      <button
                        onClick={(e) => handleViewRelated(e, "fine")}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        View Payment Details
                      </button>
                    )}
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
