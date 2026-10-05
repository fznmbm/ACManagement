// lib/utils/phone.ts
// Normalise phone numbers to E.164 digits (no "+") for WhatsApp.
// UK numbers are the default; international numbers are kept as entered.

export function toWhatsAppNumber(
  raw: string | null | undefined,
  defaultCountry = "44",
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (hasPlus) {
    // +44 7700 900123 / +94 77 123 4567 → already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2); // 0044… / 0094…
  } else if (digits.startsWith("0")) {
    digits = defaultCountry + digits.slice(1); // 07700 900123 → 447700900123
  } else if (digits.length === 10 && digits.startsWith("7")) {
    digits = defaultCountry + digits; // 7700900123 (leading 0 dropped)
  }
  // Otherwise assume it already includes a country code (447…, 947…)

  // UK mobiles: 44 + 7 + 9 digits. Anything else: 8–15 digits (E.164 max)
  if (digits.startsWith("44") && digits.length !== 12) return null;
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}
