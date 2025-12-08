"use client";

import { useState } from "react";
import { X, Copy, Send, Check } from "lucide-react";
import {
  generateNotificationWhatsAppMessage,
  copyToClipboard,
  openWhatsAppWithMessage,
} from "@/lib/utils/whatsappNotifications";

interface NotificationData {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  student?: {
    first_name: string;
    last_name: string;
    parent_name: string;
    parent_phone?: string;
  };
}

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationData;
}

export default function WhatsAppNotificationModal({
  isOpen,
  onClose,
  notification,
}: WhatsAppNotificationModalProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const whatsappMessage = generateNotificationWhatsAppMessage({
    type: notification.type,
    priority: notification.priority,
    title: notification.title,
    message: notification.message,
    student_name: notification.student
      ? `${notification.student.first_name} ${notification.student.last_name}`
      : undefined,
    parent_name: notification.student?.parent_name,
  });

  const handleCopy = async () => {
    await copyToClipboard(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    openWhatsAppWithMessage(whatsappMessage);
  };

  const handleSendDirect = () => {
    if (notification.student?.parent_phone) {
      // Remove any non-numeric characters from phone
      const phone = notification.student.parent_phone.replace(/\D/g, "");
      const encodedMessage = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
    } else {
      alert("Parent phone number not available");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            📱 Send Notification via WhatsApp
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Notification Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-foreground mb-1">
              {notification.title}
            </h3>
            {notification.student && (
              <p className="text-sm text-muted-foreground">
                For: {notification.student.first_name}{" "}
                {notification.student.last_name}
                {notification.student.parent_name &&
                  ` (${notification.student.parent_name})`}
              </p>
            )}
          </div>

          {/* WhatsApp Options */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose how to send this notification:
            </p>

            {/* Copy Message */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between p-4 border-2 border-input rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <Copy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Copy Message</p>
                  <p className="text-sm text-muted-foreground">
                    Copy to clipboard and send manually
                  </p>
                </div>
              </div>
              {copied && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Copied!</span>
                </div>
              )}
            </button>

            {/* Open WhatsApp */}
            <button
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-between p-4 border-2 border-input rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Open WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Open WhatsApp with pre-filled message
                  </p>
                </div>
              </div>
            </button>

            {/* Send Direct (if phone available) */}
            {notification.student?.parent_phone && (
              <button
                onClick={handleSendDirect}
                className="w-full flex items-center justify-between p-4 border-2 border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg group-hover:bg-green-300 dark:group-hover:bg-green-700 transition-colors">
                    <Send className="h-5 w-5 text-green-700 dark:text-green-300" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      Send to {notification.student.parent_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Opens WhatsApp chat with{" "}
                      {notification.student.parent_phone}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Preview Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full p-3 text-sm border border-input rounded-lg hover:bg-accent transition-colors"
            >
              {showPreview ? "Hide Preview" : "Show Message Preview"}
            </button>
          </div>

          {/* Preview Display */}
          {showPreview && (
            <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-3">
                Message Preview:
              </h4>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded border border-border text-foreground">
                {whatsappMessage}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📝 Quick Guide:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>
                <strong>Copy Message:</strong> Copies to clipboard - paste into
                WhatsApp
              </li>
              <li>
                <strong>Open WhatsApp:</strong> Opens WhatsApp with message
                ready
              </li>
              {notification.student?.parent_phone && (
                <li>
                  <strong>Send Direct:</strong> Opens chat with specific parent
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
