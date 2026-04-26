-- =========================================================================
-- 140_ai_daily_v1_4_tier_system.sql
-- =========================================================================
-- PRD v1.3 §16 — free / paid tier system.
--
-- Schema name reconciliation: the PRD uses idealized names
-- (ai_daily_news_items / news_item_id / edition_date). The live schema uses
-- (ai_daily_feed / feed_id / feed_date). This migration is written against
-- the LIVE names — feed_date IS the edition_date semantic.
--
-- This migration is idempotent and forward-only. Re-running is safe.
--
-- Rollback (paste in SQL editor if needed):
--   alter table public.ai_daily_profiles drop column if exists is_paid;
--   alter table public.ai_daily_profiles drop column if exists paid_until;
--   drop policy if exists ai_daily_feed_tier_gated_read on public.ai_daily_feed;
--   drop policy if exists ai_daily_tips_tier_gated_read on public.ai_daily_tips;
--   create policy ai_daily_feed_select_all on public.ai_daily_feed for select using (true);
--   drop table if exists public.promo_redemptions;
--   drop table if exists public.promo_codes;
-- =========================================================================

-- 1. Tier columns on profiles ------------------------------------------------

alter table public.ai_daily_profiles
  add column if not exists is_paid boolean not null default false;

alter table public.ai_daily_profiles
  add column if not exists paid_until timestamptz;

comment on column public.ai_daily_profiles.is_paid is
  'PRD §16.4 — true when user has access to the 60-day history archive.';

comment on column public.ai_daily_profiles.paid_until is
  'PRD §16.4 — optional expiry. NULL means non-expiring; otherwise tier check is is_paid AND (paid_until IS NULL OR paid_until > NOW()).';

-- 2. Index that drives the history calendar query ----------------------------

create index if not exists idx_ai_daily_feed_feed_date_desc
  on public.ai_daily_feed (feed_date desc);

-- 3. Promo codes -------------------------------------------------------------

create table if not exists public.promo_codes (
  code text primary key,
  paid_months_granted int not null check (paid_months_granted between 1 and 24),
  max_redemptions int not null default 1,
  redemptions_count int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.promo_codes is
  'PRD §16.4 — promo codes that grant N months of paid tier. Codes are case-sensitive.';

create table if not exists public.promo_redemptions (
  code text references public.promo_codes(code) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (code, user_id)
);

comment on table public.promo_redemptions is
  'PRD §16.4 — joins promo_codes to auth.users; primary key prevents double-redemption by the same user.';

-- promo_codes: only authenticated users can read for self-validation; only
-- service role can write. promo_redemptions: users can read their own; only
-- service role can write (the /api/upgrade/promo route uses service client).

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

drop policy if exists promo_codes_authenticated_read on public.promo_codes;
create policy promo_codes_authenticated_read
  on public.promo_codes for select
  using (auth.uid() is not null);

drop policy if exists promo_redemptions_owner_read on public.promo_redemptions;
create policy promo_redemptions_owner_read
  on public.promo_redemptions for select
  using (auth.uid() = user_id);

-- 4. Tier-gated RLS on ai_daily_feed -----------------------------------------
-- Replaces the existing public-read policy. The new policy says: rows where
-- feed_date equals today (in MYT) are readable by anyone (including anon).
-- Older rows are readable only by authenticated users with is_paid = true and
-- a non-expired paid_until.

drop policy if exists ai_daily_feed_select_all on public.ai_daily_feed;

drop policy if exists ai_daily_feed_tier_gated_read on public.ai_daily_feed;
create policy ai_daily_feed_tier_gated_read
  on public.ai_daily_feed for select
  using (
    feed_date = (now() at time zone 'Asia/Kuala_Lumpur')::date
    or exists (
      select 1
      from public.ai_daily_profiles p
      where p.id = auth.uid()
        and p.is_paid = true
        and (p.paid_until is null or p.paid_until > now())
    )
  );

-- 5. Tier-gated RLS on ai_daily_tips -----------------------------------------
-- Tips inherit tier-gating through their parent feed_id. We reuse the same
-- predicate against ai_daily_feed (which itself is RLS-filtered, so the
-- exists() naturally becomes "exists a feed row I'm allowed to see").
--
-- The existing ai_daily_tips_select_public_or_own policy stays in place for
-- user-owned tips (Unpack/Ask/Advisor outputs where owner_id = auth.uid());
-- this new policy is a SECOND, stricter SELECT policy specifically for the
-- daily-feed-derived tips (where owner_id is null and feed_id is not null).
--
-- Postgres OR-combines multiple permissive SELECT policies, so user-owned
-- tips remain visible to their owner regardless of tier.

drop policy if exists ai_daily_tips_tier_gated_read on public.ai_daily_tips;
create policy ai_daily_tips_tier_gated_read
  on public.ai_daily_tips for select
  using (
    -- User-owned tips (Unpack/Ask/Advisor outputs) are always visible to owner
    owner_id = auth.uid()
    -- Feed-derived tips are tier-gated via the parent feed
    or (
      feed_id is not null
      and exists (
        select 1
        from public.ai_daily_feed f
        where f.id = ai_daily_tips.feed_id
          and (
            f.feed_date = (now() at time zone 'Asia/Kuala_Lumpur')::date
            or exists (
              select 1
              from public.ai_daily_profiles p
              where p.id = auth.uid()
                and p.is_paid = true
                and (p.paid_until is null or p.paid_until > now())
            )
          )
      )
    )
  );

-- The existing ai_daily_tips_select_public_or_own policy is now redundant for
-- feed-derived rows (the new tier-gated policy covers them) but still useful
-- for the user-owned-tips case. Leaving it in place is harmless because
-- multiple permissive SELECT policies are OR-combined.

-- 6. Verification queries (read-only — paste into SQL editor to verify) ------
--
-- Expect: ai_daily_profiles has is_paid + paid_until columns
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'ai_daily_profiles'
--   and column_name in ('is_paid', 'paid_until');
--
-- Expect: 2 new policies, 0 rows from the old public-read policy
--   select policyname from pg_policies
--   where schemaname = 'public' and tablename = 'ai_daily_feed';
--
-- Expect: as the service role, all rows are readable. As a real user, only
-- today's rows or (if is_paid) all rows.
