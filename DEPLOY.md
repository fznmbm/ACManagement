# Zip 1 — deploy checklist

## Before you start
- [ ] Take a Supabase backup (Database → Backups) or note you can restore.
- [ ] Rotate the Resend API key (Resend dashboard → update in Vercel env).

## 1. Database (Supabase SQL editor)
- [ ] Run `015_security_fixes.sql` **STEP 0 only**. Read the output:
      - tables with RLS off (expect parent_student_links, parent_notification_preferences)
      - the catch-all policies to be removed
      - any duplicate invoices (STEP 0d) — if any rows, clear them before STEP 7.
- [ ] Run STEPS 1–7 wrapped in `BEGIN;` … `COMMIT;`. If anything errors, `ROLLBACK;`.
- [ ] Re-run the file once more to confirm it's clean (it's idempotent).

## 2. Code
- [ ] Copy the changed files over your repo (same paths — see ZIP1_CHANGES.md).
- [ ] `npm install` (Next.js bumped to 14.2.35).
- [ ] Commit and deploy to Vercel **after** step 1.

## 3. Smoke test (5 minutes, on the live site after deploy)
- [ ] **Attendance:** open a class, mark one child absent, Save. Re-open and
      Save again → still one row, one fine (not duplicated). Mark that fine paid
      in Fines, go back to Attendance, Save again → fine stays **paid**.
- [ ] **Student profile:** open a child who has assessments/certificates/
      memorization → those sections now show data (were blank).
- [ ] **Dashboard:** "Present (last session)" and attendance % show last
      Tuesday's numbers; "This Month" revenue is non-zero if any payment was
      taken this month; event RSVP counts show.
- [ ] **Fees:** a paid invoice is **not** labelled OVERDUE.
- [ ] **Parent portal (test parent):** Finances "owed" includes partial
      invoices' balances; they see only their own children.
- [ ] **Security spot-check (test parent):** they cannot open another family's
      data; Users/Settings are not reachable as a teacher.

## Rollback
- Code: redeploy the previous commit.
- Database: run `015_rollback.sql` inside `BEGIN; … COMMIT;`.
  (Note: rollback re-opens the security holes — only use to back out.)

## If something looks wrong
Tell me what you saw and I'll adjust. Nothing here deletes data, so a rollback
plus redeploy returns you exactly to today's state.
