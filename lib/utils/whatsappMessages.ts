// lib/utils/whatsappMessages.ts

interface EventData {
  title: string;
  description?: string | null | undefined; // Add ? here
  event_date: string;
  event_time?: string | null | undefined; // Add ? here
  end_time?: string | null | undefined; // Add ? here
  location?: string | null | undefined; // Add ? here
  event_type: string;
  priority: "normal" | "urgent" | "critical";
}

export function generateEventWhatsAppMessage(
  event: EventData,
  recipientType: "class" | "school" = "school"
): string {
  // Format date
  const date = new Date(event.event_date);
  const formattedDate = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Priority prefix
  let priorityPrefix = "";
  if (event.priority === "critical") {
    priorityPrefix = "🚨 *URGENT* 🚨\n";
  } else if (event.priority === "urgent") {
    priorityPrefix = "⚠️ *IMPORTANT* ⚠️\n";
  }

  // Build message
  let message = `🕌 *Al Hikma Institute Crawley*\n\n`;
  message += priorityPrefix;
  message += `📅 *${event.title}*\n\n`;

  if (event.description) {
    message += `${event.description}\n\n`;
  }

  message += `📆 *Date:* ${formattedDate}\n`;

  if (event.event_time) {
    message += `🕐 *Time:* ${event.event_time}`;
    if (event.end_time) {
      message += ` - ${event.end_time}`;
    }
    message += `\n`;
  }

  if (event.location) {
    message += `📍 *Location:* ${event.location}\n`;
  }

  message += `\n`;

  if (recipientType === "class") {
    message += `This event is for your child's class.\n\n`;
  } else {
    message += `This is a school-wide event for all students.\n\n`;
  }

  message += `Please mark this on your calendar.\n\n`;
  message += `_JazakAllah Khair,_\n`;
  message += `_Al Hikma Institute Crawley_`;

  return message;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generateWhatsAppGroupLink(message: string): string {
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  // This will open WhatsApp with pre-filled message
  return `https://wa.me/?text=${encodedMessage}`;
}
