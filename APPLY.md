# Batch A — Design foundation + Parent portal UX

**No database change. No new npm dependency.** Verified with a full
`next build` + TypeScript + ESLint (all pass).

## Prerequisite
Apply `notif-fix.zip` first if you haven't — it touches the parent student
page. Batch A does **not** include that file, so there's no conflict.

## Files in this zip (copy over the same paths)
| File | Change |
|---|---|
| `styles/globals.css` | Brand green `--primary` + `--ring` → `142 72% 29%` (#15803d). Was 2.32:1 on white (fails WCAG); now 5.0:1 (passes AA). Dark mode green left as-is. Fixes contrast on every `bg-primary`/`text-primary`/`border-primary` element across **both** portals. |
| `components/ui/toast.tsx` | **New.** Dependency-free toast + confirm-dialog system. `useToast()` returns `{ toast, confirm }`. Falls back to `window.alert/confirm` if used outside a provider, so nothing can break. |
| `lib/utils/helpers.ts` | Added `formatMoney()` (GBP, `£1,250.00`). |
| `app/(parent)/layout.tsx` | Mounts `<ToastProvider>`; replaces the mobile hamburger with a **bottom tab bar** (standard phone pattern), keeps the desktop nav. |
| `app/(parent)/parent/events/page.tsx` | `alert()` → toasts. |
| `app/(parent)/parent/finances/page.tsx` | `alert()` → toasts; adds the **"How to pay"** panel (bank transfer + payment reference), shown only when something is owed. |
| `components/events/ParentEventRSVP.tsx` | `alert()` → toasts. |
| `.env.example` | Documents the new optional bank-detail env vars. |

## "How to pay" bank details (optional)
The panel reads three **optional** public env vars. Set them in Vercel:
```
NEXT_PUBLIC_BANK_ACCOUNT_NAME=Al Hikmah Institute Crawley
NEXT_PUBLIC_BANK_SORT_CODE=00-00-00
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=00000000
```
If you leave them unset, the panel simply says "contact the school office for
the bank account details" — it never shows blanks or fake numbers.

## Apply
1. Copy the files over the same paths.
2. `npm install` is **not** required (no new dependency).
3. Set the bank env vars (optional, above).
4. Commit and deploy.

## What to check after deploy
- Any green button/badge/active link looks a touch darker and is easier to read.
- Parent portal on a phone shows a bottom bar (Dashboard · Children · Events ·
  Finances · Profile) instead of the hamburger.
- Parent → Finances shows the "How to pay" panel when there's an outstanding
  balance; submitting an RSVP or a failed download now shows a toast, not a
  browser pop-up.

Admin-portal `alert/confirm` conversions, responsive admin nav, attendance,
pagination, Edit-event and the hidden reports come in **Batch B**.
