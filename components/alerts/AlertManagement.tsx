"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
} from "lucide-react";

export default function AlertManagement() {
  const [checking, setChecking] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<{ [key: string]: string }>({});

  async function runCheck(
    checkType: "absences" | "upcoming_fees" | "overdue_fees" | "all"
  ) {
    setChecking(checkType);
    try {
      const response = await fetch("/api/alerts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ check_type: checkType }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Alert check completed successfully");
        setLastRun({
          ...lastRun,
          [checkType]: new Date().toLocaleTimeString("en-GB"),
        });
      } else {
        alert("Error: " + (result.error || "Failed to run check"));
      }
    } catch (error) {
      console.error("Error running check:", error);
      alert("Failed to run alert check");
    } finally {
      setChecking(null);
    }
  }

  const alerts = [
    {
      id: "absences",
      title: "Consecutive Absences",
      description: "Check for students absent 2+ times and notify parents",
      icon: Users,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      type: "absences" as const,
    },
    {
      id: "upcoming_fees",
      title: "Upcoming Fee Dues",
      description: "Send reminders for fees due within 3 days",
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      type: "upcoming_fees" as const,
    },
    {
      id: "overdue_fees",
      title: "Overdue Fees",
      description: "Send urgent alerts for overdue fee payments",
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      type: "overdue_fees" as const,
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Automated Alerts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manually trigger alert checks to notify parents
          </p>
        </div>

        {/* Run All Button */}
        <div className="mb-6">
          <button
            onClick={() => runCheck("all")}
            disabled={checking !== null}
            className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {checking === "all" ? (
              <>Running All Checks...</>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Run All Alert Checks
              </>
            )}
          </button>
          {lastRun["all"] && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Last run: {lastRun["all"]}
            </p>
          )}
        </div>

        {/* Individual Alert Cards */}
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="border border-input rounded-lg bg-card p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${alert.bgColor}`}>
                  <alert.icon className={`h-6 w-6 ${alert.color}`} />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alert.description}
                  </p>

                  <button
                    onClick={() => runCheck(alert.type)}
                    disabled={checking !== null}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checking === alert.type ? "Checking..." : "Run Check"}
                  </button>

                  {lastRun[alert.type] && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last run: {lastRun[alert.type]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ How Automated Alerts Work
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • <strong>Consecutive Absences:</strong> Notifies parents after 2
              consecutive absences
            </li>
            <li>
              • <strong>Fee Reminders:</strong> Sends reminder 3 days before due
              date
            </li>
            <li>
              • <strong>Overdue Alerts:</strong> Sends urgent alert for overdue
              payments
            </li>
            <li>
              • <strong>Auto-Triggers:</strong> Fines and certificates
              auto-notify when created
            </li>
          </ul>
        </div>

        {/* Automatic Triggers Info */}
        <div className="mt-4 p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            ✅ Automatic Notifications (No Action Needed)
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>
              • <strong>Fine Issued:</strong> Parent notified immediately when
              fine is created
            </li>
            <li>
              • <strong>Certificate Awarded:</strong> Parent notified
              immediately when certificate is issued
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
