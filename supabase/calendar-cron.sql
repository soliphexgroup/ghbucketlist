-- GH Bucketlist — CALENDAR SYNC SCHEDULER (Supabase pg_cron)
-- Hostinger Web Apps have no cron feature, so we schedule the sync from Supabase instead. Run this
-- ONCE in the Supabase SQL Editor after calendar-sync.sql and after CRON_SECRET is set in Hostinger.
--
-- ⚠️ Replace YOUR_CRON_SECRET below with the exact value you set in the Hostinger env var CRON_SECRET.
-- The value is stored in the cron job definition (admin-only). To rotate it, unschedule + re-add.

-- Scheduler + HTTP client extensions (Supabase supports both).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous copy of the job so this file is safe to re-run.
select cron.unschedule('sync-calendars')
where exists (select 1 from cron.job where jobname = 'sync-calendars');

-- Every 5 minutes: POST the worker with the bearer secret. net.http_post is fire-and-forget.
select cron.schedule(
  'sync-calendars',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://ghbucketlist.com/api/cron/sync-calendars',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);

-- Handy checks:
--   select * from cron.job;                        -- see the schedule
--   select * from cron.job_run_details order by start_time desc limit 10;  -- see recent runs
--   select cron.unschedule('sync-calendars');      -- turn it off
