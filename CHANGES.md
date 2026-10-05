# Zip 1 — Security & correctness fixes

Al Hikmah ACManagement · built 2 Oct 2026 · against commit `ba851ab`
No visual redesign. Every change is a fix to something wrong today. Written and
tested against your **live** database structure (from the schema export).

## How to apply (order matters)

1. **Rotate the Resend API key** in the Resend dashboard, then update it in
   Vercel. The old key is in your public repo history and no code change removes
   it from there. (Not a file in this zip — only you can do it.)
2. **Database:** in the Supabase SQL editor, run `015_security_fixes.sql`
   STEP 0 on its own, read the output (it lists what will change and any
   duplicate invoices to clear first), then run STEPS 1–7 inside
   `BEGIN; … COMMIT;`. Keep `015_rollback.sql` to undo.
3. **Code:** drop the changed files over your repo (same paths), `npm install`
   (for the Next.js bump), commit, deploy. Deploy the code **after** the SQL,
   because the attendance screen and dashboard call new database functions.
4. **Smoke test** (see DEPLOY checklist in this file's companion).

Safe to run twice: the SQL is idempotent. No row is deleted or rewritten.

---

## Security — database (`015_security_fixes.sql`)

All reproduced on a replica of your live schema, before and after.

- **P1 — RLS was OFF on `parent_student_links` and `parent_notification_preferences`.**
  Anyone with the anon key (i.e. anyone on the internet) could read, change or
  delete who each child's parent is. STEP 1 enables RLS; the correct policies
  already existed and now take effect.
- **P2 — Catch-all "any logged-in user can view" rules** on `fines`,
  `fee_invoices`, `fee_payments`, `student_fee_assignments` and `profiles` let
  every parent read every other family's money and every staff/parent's contact
  details. STEP 2–3 drop those; the per-family rules beside them take over.
  `profiles` keeps own-row access plus a staff-can-view-all rule (via the
  existing `is_teacher()` helper, so no recursion).
- **P3 — `authenticated_all` FOR ALL rules** on `subjects` and
  `student_memorization` let any parent edit/delete core data. Dropped.
- **P4 — Four summary views** (`student_fee_summary`, `student_fine_summary`,
  `student_prayer_summary`, `parent_portal_status`) were readable by anyone.
  STEP 4 makes the first three run as the caller (`security_invoker`), so table
  RLS applies; `parent_portal_status` reads `auth.users` so it is now served
  only through the new staff-gated API route (see code below).
- **P5 — Role self-promotion.** A parent could set their own `role` to
  `super_admin`. STEP 5 adds a trigger that blocks any role change from a
  browser/API session except a super_admin changing someone else. SQL editor
  and service role are unaffected.
- **P6 — New signups defaulted to `teacher`.** `handle_new_user` now defaults
  to `parent`.

## Money & attendance integrity — database

- **F1/F2 — Re-saving the register duplicated rows, fines and parent
  notifications; editing a note issued another fine.** New `save_class_attendance`
  function updates in place, never deletes attendance, and removes only *unpaid*
  fines when a status is corrected. The fine trigger now fires only when status
  actually changes to late/absent. (The attendance screen calls this RPC.)
- **F3 — Re-saving un-paid a paid fine.** Fixed by the above: paid/waived fines
  are never touched.
- **F4 — Deleting a payment left the invoice still "paid".** `update_invoice_status`
  now recomputes on INSERT/UPDATE/DELETE from the real payment total.
- **F5 — Only one parent was notified.** `create_parent_notification` now
  notifies every linked parent with notifications enabled (fines, certificates).
- **F7 — Student clean-up errored** trying to set fines to an invalid
  `cancelled` status; now uses `waived`.
- **Invoice uniqueness** (STEP 7): a unique index stops duplicate invoices for
  the same student/structure/period (double-click or retry).
- **Dashboard low-attendance** (STEP 8): one function replaces ~240 per-load
  queries; the dashboard already falls back to 0 if the function is absent.

---

## Code fixes

### Silently-broken screens (queries used columns your live DB doesn't have, so
the section rendered empty with no error)

- `app/(dashboard)/students/[id]/page.tsx` — the student profile showed
  "No assessments / certificates / memorization" even when the child had them.
  Now uses the real columns: `max_score` (not `total_marks`), `assessment_type`
  (not `assessment_name`), `subjects.name` + `curriculum_topics.topic_name`
  (not a non-existent `subject_name`), `student_memorization.status` (not
  `progress_stage`), `memorization_items.name`/`item_type`/`category_name`
  (not `title`/`category`), and `certificates.issue_date` (not `issued_date`).
  Memorization buckets now match category text case-insensitively.
- `components/dashboard/RecentActivity.tsx` — accepted-application items
  (`applications.student_name` → `child_first_name`/`child_last_name`) and
  certificates (`issued_date` → `issue_date`).
- `components/dashboard/FinancialOverview.tsx` — "This Month" revenue was always
  £0 (`fee_invoices.paid_date` doesn't exist and the month range asked for the
  31st of every month). Now sums `fee_payments` by `payment_date` within proper
  month boundaries.
- `app/(meeting)/students/[id]/meeting/page.tsx` — fine reason
  (`fines.reason` → `fines.notes`).
- `components/parent/tabs/GradesTab.tsx` — `assessment_name` was never selected;
  now aliased from `assessment_type` so it shows.

### Correctness

- `app/(dashboard)/dashboard/page.tsx` — "Present (last session)" and
  attendance % now use the latest class day (Tuesday), not today (0 six days a
  week); pending-applications count reads the active academic year from
  settings, not the calendar; "Send Message" quick action points to Send Update.
- `components/dashboard/CriticalAlerts.tsx` — pending applications by active
  academic year; low-attendance via the new function (weekly, last 6 sessions,
  < 75%, late counts as attended).
- `components/dashboard/UpcomingEvents.tsx` — RSVP count used `status`; the
  column is `rsvp_status`. (Counts were always 0.)
- `app/(dashboard)/fees/page.tsx` — paid invoices no longer show "OVERDUE"
  (overdue now requires not-paid and past due).
- `app/(parent)/parent/finances/page.tsx` — "owed" now counts the remaining
  balance on partial/overdue invoices too (was dropping partials and using the
  full amount); "paid" counts part-payments.
- `components/layout/Header.tsx` — page title for Send Update and Users (was
  "Dashboard").

### Security — code

- `app/api/parent/send-login-details/route.ts` — now requires an admin
  (was unauthenticated while using the service role + sending email).
- `app/auth/callback/route.ts` — only same-site `next` redirects (was an open
  redirect).
- `app/api/parent/{invoice,fine}/[id]/download/route.ts` — strict ownership join
  (`!inner`) so one parent can't fetch another's document.
- `app/api/admin/unlink-parent/route.ts` — never deletes a parent account when
  the "other children?" lookup merely errors.
- `app/(dashboard)/send-update/page.tsx` — notifies all linked parents (not just
  the primary), and tells staff when no parent is linked.
- `app/api/admin/portal-status/route.ts` (new) + `app/(dashboard)/students/page.tsx`
  — portal status is served by a staff-gated service-role route, so the
  `parent_portal_status` view can be locked down (P4).
- `middleware.ts` — protects `/parent/events`; keeps teachers out of `/users`
  and `/settings`; removes the per-request console log.
- `app/api/messages/send/route.ts` + `lib/utils/phone.ts` — phone numbers
  normalised to E.164 (non-UK numbers no longer corrupted).

### Other

- `lib/utils/classDay.ts` (new) — UK-time "latest Tuesday" helper (fixes the
  midnight-UTC date drift in BST).
- `.env.example` — Resend key placeholdered; WhatsApp Cloud API placeholders added.
- `package.json` — Next.js 14.2.5 → 14.2.35 (security advisories). Run `npm install`.

## Verified

- SQL: applied to a replica built from your schema export; every exploit above
  reproduced then confirmed closed; every function fix confirmed; legitimate
  admin/teacher/parent access confirmed intact; migration is idempotent.
- Code: `tsc --noEmit` passes with 0 errors; every changed query checked against
  the real column names in your schema export.

## Not in Zip 1 (coming in Zip 2 — the UI/UX redesign)

Phone header/menu, pagination on long lists, compact attendance, "This week"
parent card, how-to-pay, bottom tab bar, the six hidden reports, Edit event,
toasts instead of browser dialogs, the design-system/contrast work.
