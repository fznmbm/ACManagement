import { createClient } from "@/lib/supabase/server";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "password_reset"
  | "status_change"
  | "payment_recorded"
  | "certificate_issued"
  | "application_accepted"
  | "application_rejected"
  | "parent_account_created"
  | "parent_linked"
  | "parent_unlinked";

export interface AuditLogEntry {
  user_id: string;
  action: AuditAction;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      table_name: entry.table_name ?? null,
      record_id: entry.record_id ?? null,
      old_values: entry.old_values ?? null,
      new_values: entry.new_values ?? null,
      ip_address: entry.ip_address ?? null,
    });

    if (error) {
      // Never let audit logging crash the main operation
      console.error("Audit log failed:", error.message);
    }
  } catch (err) {
    console.error("Audit log exception:", err);
  }
}
