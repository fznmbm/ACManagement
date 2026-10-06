-- ============================================================
-- OPTIONAL one-off cleanup — ONLY run if diagnostic query (C) returned rows.
-- Keeps the earliest copy of each duplicated notification, deletes the rest.
-- This is the pre-Zip-1 double-fire leftover; Zip 1 stops NEW duplicates.
--
-- Run inside a transaction so you can check the count first, then COMMIT.
-- ============================================================
begin;

-- Preview how many rows will be removed:
with ranked as (
  select id,
         row_number() over (
           partition by student_id, title, type, date_trunc('minute', created_at)
           order by created_at, id
         ) as rn
  from parent_notifications
  where type in ('fine', 'fee_alert')
)
delete from parent_notifications
where id in (select id from ranked where rn > 1);

-- Check the result count above. If it looks right:
--   commit;
-- otherwise:
--   rollback;
