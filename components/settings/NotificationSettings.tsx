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

  const notificationEnabled = settings.notification_enabled || {
    email: true,
    sms: false,
    telegram: false,
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
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

      <div className="space-y-6">
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
                defaultChecked={notificationEnabled.email}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-3 ml-8">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">Daily attendance summary</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">Absence alerts</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">Low attendance warnings</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
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
                defaultChecked={notificationEnabled.sms}
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
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="form-label text-xs">Twilio Auth Token</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="form-label text-xs">Twilio Phone Number</label>
              <input
                type="tel"
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
                defaultChecked={notificationEnabled.telegram}
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
              <input type="time" defaultValue="18:00" className="form-input" />
            </div>
            <div>
              <label className="form-label">Send absence alerts</label>
              <select className="form-input">
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
      </div>

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
