-- v1.3 — Paywall flag for source link contract (PRD §3.6, REQ-LINK-05)
--
-- Some vendor blogs return 401 / require subscription on direct deep-links.
-- Per the PRD a 401 is acceptable *only with a visible "subscription required"
-- badge* on the link so the click is intentional. The link audit script
-- (scripts/audit-source-links.ts) sets this flag whenever a source returns 401.
--
-- Default false so existing rows behave unchanged. Idempotent — safe to re-run.

alter table public.ai_daily_tips
  add column if not exists is_paywalled boolean not null default false;

comment on column public.ai_daily_tips.is_paywalled is
  'True when the linked source URL returned 401/paywall during the last audit. Surfaces a "Subscription required" badge on the tip card.';

-- Helpful partial index for the audit script: list every tip with a non-null
-- source URL that hasn''t been re-checked. (Audit script reads this view.)
create index if not exists ai_daily_tips_source_url_idx
  on public.ai_daily_tips (source_url)
  where source_url is not null;
