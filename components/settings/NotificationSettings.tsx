// components/settings/NotificationSettings.tsx
"use client";

import { useState } from "react";
import { Save, Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationSettingsProps {
  settings: Record<string, any>;
}

export default function NotificationSettings({
  settings,
}: NotificationSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const notificationData = settings.notifications || {};

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const form = document.querySelector("form");
      if (!form) throw new Error("Form not found");

      const formData = new FormData(form);
      const data: Record<string, any> = {
        email_enabled: false,
        sms_enabled: false,
        telegram_enabled: false,
        email_daily_summary: false,
        email_absence_alerts: false,
        email_low_attendance: false,
        email_weekly_reports: false,
      };

      formData.forEach((value, key) => {
        if (
          key === "email_enabled" ||
          key === "sms_enabled" ||
          key === "telegram_enabled" ||
          key.startsWith("email_")
        ) {
          data[key] = true; // Checkbox checked
        } else {
          data[key] = value;
        }
      });

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "notifications",
          data: data,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how parents and teachers receive notifications
        </p>
      </div>

      <form className="space-y-6">
        {/* Email Notifications */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start space-x-3 mb-4">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Send notifications via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="email_enabled"
                defaultChecked={notificationData.email_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-3 ml-8">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="email_daily_summary"
                defaultChecked={notificationData.email_daily_summary}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">Daily attendance summary</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="email_absence_alerts"
                defaultChecked={notificationData.email_absence_alerts}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">Absence alerts</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="email_low_attendance"
                defaultChecked={notificationData.email_low_attendance}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">Low attendance warnings</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="email_weekly_reports"
                defaultChecked={notificationData.email_weekly_reports}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">Weekly progress reports</span>
            </label>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start space-x-3 mb-4">
            <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold">SMS Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Send notifications via text message (requires Twilio setup)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="sms_enabled"
                defaultChecked={notificationData.sms_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-3 ml-8">
            <div>
              <label className="form-label text-xs">Twilio Account SID</label>
              <input
                type="text"
                name="twilio_account_sid"
                defaultValue={notificationData.twilio_account_sid}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="form-label text-xs">Twilio Auth Token</label>
              <input
                type="password"
                name="twilio_auth_token"
                defaultValue={notificationData.twilio_auth_token}
                placeholder="••••••••••••••••••••••••••••••••"
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="form-label text-xs">Twilio Phone Number</label>
              <input
                type="tel"
                name="twilio_phone"
                defaultValue={notificationData.twilio_phone}
                placeholder="+1234567890"
                className="form-input text-sm"
              />
            </div>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start space-x-3 mb-4">
            <Send className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold">Telegram Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Send notifications via Telegram bot (100% free)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="telegram_enabled"
                defaultChecked={notificationData.telegram_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-3 ml-8">
            <div>
              <label className="form-label text-xs">Telegram Bot Token</label>
              <input
                type="text"
                name="telegram_bot_token"
                defaultValue={notificationData.telegram_bot_token}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="form-input text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>
          </div>
        </div>

        {/* Notification Schedule */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Notification Schedule</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label">Send daily summary at</label>
              <input
                type="time"
                name="daily_summary_time"
                defaultValue={notificationData.daily_summary_time || "18:00"}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Send absence alerts</label>
              <select
                name="absence_alert_timing"
                defaultValue={
                  notificationData.absence_alert_timing || "immediately"
                }
                className="form-input"
              >
                <option value="immediately">
                  Immediately after attendance is marked
                </option>
                <option value="end_of_day">At end of day</option>
                <option value="next_morning">Next morning</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <span className="text-sm text-green-600">
            ✓ Settings saved successfully!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
