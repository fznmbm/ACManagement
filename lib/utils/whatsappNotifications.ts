// lib/utils/whatsappNotifications.ts

interface NotificationData {
  type: string;
  priority: string;
  title: string;
  message: string;
  student_name?: string;
  parent_name?: string;
}

export function generateNotificationWhatsAppMessage(
  notification: NotificationData
): string {
  // Get emoji based on notification type
  const typeEmojis: Record<string, string> = {
    feedback: "📝",
    fine: "💰",
    certificate: "🎓",
    attendance: "📊",
    fee_alert: "💳",
    event: "📅",
    announcement: "📢",
  };

  const emoji = typeEmojis[notification.type] || "📢";

  // Priority prefix
  let priorityPrefix = "";
  if (notification.priority === "urgent") {
    priorityPrefix = "⚠️ *URGENT* ⚠️\n";
  }

  // Build message
  let whatsappMessage = `🕌 *Al Hikma Institute Crawley*\n\n`;
  whatsappMessage += priorityPrefix;
  whatsappMessage += `${emoji} *${notification.title}*\n\n`;
  whatsappMessage += `${notification.message}\n\n`;
  whatsappMessage += `_For more details, please check your parent portal._\n\n`;
  whatsappMessage += `_JazakAllah Khair,_\n`;
  whatsappMessage += `_Al Hikma Institute Crawley_`;

  return whatsappMessage;
}

export function generateBulkWhatsAppMessages(
  notifications: NotificationData[]
): string[] {
  return notifications.map((notification) =>
    generateNotificationWhatsAppMessage(notification)
  );
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function openWhatsAppWithMessage(message: string): void {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
}
