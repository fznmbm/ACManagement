"use client";

import { useState } from "react";
import { X, Copy, Eye, Send, Check } from "lucide-react";
import {
  generateEventWhatsAppMessage,
  copyToClipboard,
} from "@/lib/utils/whatsappMessages";

interface EventData {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  end_time?: string;
  location?: string;
  event_type: string;
  priority: "normal" | "urgent" | "critical";
}

interface WhatsAppEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  isClassSpecific: boolean;
}

export default function WhatsAppEventModal({
  isOpen,
  onClose,
  event,
  isClassSpecific,
}: WhatsAppEventModalProps) {
  const [previewMessage, setPreviewMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyForClass = async () => {
    const message = generateEventWhatsAppMessage(event, "class");
    await copyToClipboard(message);
    setCopiedType("class");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyForSchool = async () => {
    const message = generateEventWhatsAppMessage(event, "school");
    await copyToClipboard(message);
    setCopiedType("school");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePreview = () => {
    const message = generateEventWhatsAppMessage(
      event,
      isClassSpecific ? "class" : "school"
    );
    setPreviewMessage(message);
    setShowPreview(true);
  };

  const handleSendToSelf = () => {
    const message = generateEventWhatsAppMessage(
      event,
      isClassSpecific ? "class" : "school"
    );
    // Open WhatsApp with message (will need to select contact)
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            📱 Send Event via WhatsApp
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
          {/* Event Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {new Date(event.event_date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {event.event_time && ` • ${event.event_time}`}
            </p>
          </div>

          {/* WhatsApp Options */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose how to send this event:
            </p>

            {/* Copy for Class Group */}
            <button
              onClick={handleCopyForClass}
              className="w-full flex items-center justify-between p-4 border-2 border-input rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <Copy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    Copy for Class Group
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Message formatted for class WhatsApp group
                  </p>
                </div>
              </div>
              {copiedType === "class" && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Copied!</span>
                </div>
              )}
            </button>

            {/* Copy for School-Wide */}
            <button
              onClick={handleCopyForSchool}
              className="w-full flex items-center justify-between p-4 border-2 border-input rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <Copy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    Copy for School-Wide
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Message formatted for all parents
                  </p>
                </div>
              </div>
              {copiedType === "school" && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Copied!</span>
                </div>
              )}
            </button>

            {/* Preview Message */}
            <button
              onClick={handlePreview}
              className="w-full flex items-center justify-between p-4 border-2 border-input rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                  <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Preview Message</p>
                  <p className="text-sm text-muted-foreground">
                    See how the message looks
                  </p>
                </div>
              </div>
            </button>

            {/* Send to Self (Test) */}
            <button
              onClick={handleSendToSelf}
              className="w-full flex items-center justify-between p-4 border-2 border-input rounded-lg hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                  <Send className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    Send to Myself (Test)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check how it looks before sending to parents
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Preview Display */}
          {showPreview && (
            <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">
                  Message Preview:
                </h4>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Hide
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded border border-border text-foreground">
                {previewMessage}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📝 Instructions:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Click "Copy" to copy the message to clipboard</li>
              <li>Open WhatsApp and select your class/school group</li>
              <li>Paste and send the message</li>
              <li>Use "Send to Myself" to test the message first</li>
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
