-- ============================================================
-- READ-ONLY diagnostic: why does Finances show "2" when there's 1 fine?
-- Safe to run on live. It only SELECTs. Replace the admission number
-- if you want a different child (AH00061 was the one in the screenshot).
-- ============================================================

-- A) The actual unread notifications behind the Finances badge.
--    The badge counts THESE rows (type fine + fee_alert), not the fines table.
select n.id,
       n.type,
       n.title,
       n.is_read,
       n.created_at
from parent_notifications n
join students s on s.id = n.student_id
where s.admission_number = 'AH00061'
  and n.type in ('fine', 'fee_alert')
order by n.created_at;

-- B) The real fines for that child (what you expected the badge to match).
select f.id, f.fine_type, f.amount, f.status, f.notes, f.created_at
from fines f
join students s on s.id = f.student_id
where s.admission_number = 'AH00061'
order by f.created_at;

-- C) Duplicate fine notifications (same child/title created within the same
--    minute) — these are the leftovers from the old double-fire trigger that
--    Zip 1 STEP 6 fixed. If rows appear here, run the CLEANUP below.
select student_id, title, count(*) as copies,
       min(created_at) as first_seen, max(created_at) as last_seen
from parent_notifications
where type in ('fine', 'fee_alert')
group by student_id, title, date_trunc('minute', created_at)
having count(*) > 1
order by copies desc;
