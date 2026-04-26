# v1.4 Tier System — QA Validation Pass

**Companion to:** PRD v1.3 §15 (Supabase Cron) + §16 (free/paid tier system)
**Date:** April 26, 2026
**Owner:** DCX

This document is the post-implementation verification checklist. Every
milestone (M1–M6) has its own section with concrete steps, the expected
result, and the rollback path if the result is wrong. Run top-to-bottom on
staging before promoting to production.

---

## M1 — Tier columns + promo tables + tier-gated RLS

**Migration:** `scripts/140_ai_daily_v1_4_tier_system.sql` (already applied)

### M1.1 — Columns exist

In the Supabase SQL Editor:

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'ai_daily_profiles'
  and column_name in ('is_paid', 'paid_until');
```

**Expected:** two rows.

  - `is_paid` / `boolean` / `false`
  - `paid_until` / `timestamp with time zone` / `null`

### M1.2 — Tier-gated SELECT policy is the only one on `ai_daily_feed`

```sql
select policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'ai_daily_feed';
```

**Expected:** exactly one SELECT policy named `ai_daily_feed_tier_gated_read`.
The old `ai_daily_feed_select_all` must be gone.

### M1.3 — Tier gate works (the contest-critical test)

Pick any past `feed_date` from the table:

```sql
select min(feed_date) as oldest, max(feed_date) as latest from public.ai_daily_feed;
```

Then in the **anon** Supabase client (e.g. via a logged-out browser tab):

```sql
-- As anon role: only today's edition should come back
select feed_date, count(*) from public.ai_daily_feed group by feed_date order by feed_date desc;
```

**Expected:** exactly one row, where `feed_date = (now() at time zone 'Asia/Kuala_Lumpur')::date`. **No** older rows.

Then flip a test user to paid:

```sql
update public.ai_daily_profiles
set is_paid = true, paid_until = now() + interval '30 days'
where id = '<TEST_USER_UUID>';
```

Sign in as that user in the app — `/history` should now show the full archive.
Set them back to free and verify `/history` paywalls.

### M1 rollback

Inline at the top of the migration file. Drops both new policies, restores
`ai_daily_feed_select_all`, drops the new tables and the new columns.

---

## M2 — Supabase Cron orchestration

**Migration:** `scripts/141_supabase_cron_setup.sql.template` (manual paste,
needs the operator's deployed URL + CRON_SECRET in Vault)

### M2.1 — `pg_cron` and `pg_net` are enabled

Supabase Dashboard → Database → Extensions. Both must show "Enabled".

### M2.2 — The `ai-daily-feed` schedule exists

```sql
select jobname, schedule, active, command
from cron.job
where jobname = 'ai-daily-feed';
```

**Expected:** one row. `schedule = '0 20 * * *'`. `active = t`. `command`
includes a `net.http_get(...)` call against the deployed URL.

### M2.3 — Manual fire works end-to-end

Paste the §5.a SQL block from `docs/cron-health-checklist.md`. Watch:

```sql
select status, return_message, start_time, end_time
from cron.job_run_details
where jobname = 'ai-daily-feed'
order by start_time desc
limit 5;
```

**Expected:** newest row has `status = 'succeeded'`. A new row should appear in
`ai_daily_feed` with today's `feed_date`. The "Live agent activity" strip on
`/` should pulse and then settle on the new run.

### M2.4 — Vercel `vercel.json` is gone

```bash
ls vercel.json   # → no such file
```

If it's still there, delete it. Supabase Cron is now the sole scheduler.

### M2 rollback

Drop the schedule, then re-add `vercel.json` with the prior cron entry:

```sql
select cron.unschedule('ai-daily-feed');
```

---

## M3 — Tier helper + auth-aware feed reads

**Files:** `lib/tier.ts`, `lib/feed.ts` (new `getFeedForDate` and
`listAvailableEditionDates`)

### M3.1 — `getViewerTier()` returns the right shape

Add a temporary `console.log("[v0]", await getViewerTier())` to any server
component you can hit. Refresh as anon, free, and paid:

  - **Anon:** `{ tier: 'free', isAuthed: false, userId: null, paidUntil: null }`
  - **Free:** `{ tier: 'free', isAuthed: true, userId: '...', paidUntil: null }`
  - **Paid:** `{ tier: 'paid', isAuthed: true, userId: '...', paidUntil: '2026-...' }`

Remove the log when done.

### M3.2 — `getFeedForDate` rejects bad URL segments

Visit `/today/not-a-date`, `/today/2026-13-01`, `/today/<script>`. All must
404 — the function's regex guard prevents any DB read.

### M3.3 — Past-date reads RLS-filter correctly

Sign in as a free user, manually navigate to a known past `feed_date`. The
viewer should be redirected to `/upgrade` because the page tier-checks before
the DB read. If you bypass the redirect (e.g. via the network tab), the DB
itself should return zero rows (RLS is the second layer of defense).

---

## M4 — `/history` calendar + reusable upgrade modal

**Files:** `app/history/page.tsx`, `components/upgrade-modal.tsx`

### M4.1 — Free user sees the modal once per session

Sign in as a free user. Navigate to `/history`. The upgrade modal should
appear automatically. Dismiss it ("Maybe later"). Refresh the page. It must
**not** re-pop in the same tab/session. Open a fresh incognito window — it
re-pops there. (Backed by `sessionStorage` key `ai-daily:upgrade-dismissed`.)

### M4.2 — Paid user sees the calendar

Flip the user to paid. The calendar populates with real `feed_date` rows from
`ai_daily_feed`, newest first. Each cell shows the day number and the tip
count for that day. Empty cells (no edition) are styled as inactive.

### M4.3 — Mobile (375px viewport) collapses to a vertical stack

Resize. The calendar grid switches to a single column with full-width entries
above 44px tall (touch target).

### M4.4 — Today's cell deep-links to `/today`, not `/today/<today>`

Clicking the today cell should land on `/today` (the live edition), not the
date-routed past-edition view. This avoids confusing users who think
"today's edition" is a different page.

---

## M5 — `/today/[date]` past-edition + `/upgrade` promo redemption

**Files:** `app/today/[date]/page.tsx`, `app/upgrade/page.tsx`,
`components/promo-form.tsx`, `app/api/upgrade/promo/route.ts`

### M5.1 — Past-date URL paywalls anonymous viewers

In a logged-out tab, visit `/today/<a past date>`. Expected: redirect to
`/auth/login?next=/upgrade?next=/today/<that date>`. After signing in as a
free user, expected: redirect to `/upgrade?next=/today/<that date>`.

### M5.2 — Future-dated URL is 404

Visit `/today/2099-12-31`. Expected: Next.js 404 page. No DB read.

### M5.3 — Past-date URL renders for paid

As a paid user, the page renders the same `TipCard` grid as `/today`,
labeled "Past edition · {date}". The breadcrumb back to `/history` works.
Source pills, Save buttons, copy buttons all behave normally.

### M5.4 — Promo redemption end-to-end

Insert a test code:

```sql
insert into public.promo_codes (code, paid_months_granted, max_redemptions)
values ('QA-TEST-2026', 1, 5);
```

As a free user, visit `/upgrade`. Paste `QA-TEST-2026`. Click Redeem.
Expected: success state with expiry ~30 days out, redirect to `/history`
after ~1.1s, and the calendar now renders.

```sql
select is_paid, paid_until from public.ai_daily_profiles where id = '<TEST_USER_UUID>';
select redemptions_count from public.promo_codes where code = 'QA-TEST-2026';
select * from public.promo_redemptions where code = 'QA-TEST-2026';
```

**Expected:** `is_paid = true`, `paid_until ~= now() + 1 month`,
`redemptions_count = 1`, one row in `promo_redemptions`.

### M5.5 — Double-redemption is blocked

Try to redeem the same code again as the same user. Expected: friendly error
"You've already redeemed that code." `redemptions_count` does **not** bump.

### M5.6 — Bad-shape codes are rejected client+server

Try `<script>`, ` `, `XYZ` (too short), `WAY-TOO-LONG-x40-chars`. All must
fail with the input regex error before hitting the DB.

### M5.7 — Stacking extends, not replaces

As a paid user with ~30 days remaining, redeem another 1-month code.
Expected: `paid_until` becomes `previous_paid_until + 1 month`, not
`now() + 1 month`. The page UI says "Stack another promo code".

---

## M6 — Tier badge + Library cross-link

**Files:** `components/site-header.tsx`, `components/user-menu.tsx`,
`app/library/page.tsx`

### M6.1 — Header menu shows correct tier badge

Open the user menu in the top-right.

  - **Free user:** "Free" badge, "Unlock past editions" entry (primary-toned).
  - **Paid user:** "Paid" badge with success accent, "Active through {date}"
    sub-line, "Edition archive" entry (no upsell).

### M6.2 — Library "Browse past editions" routes correctly

In `/library`, the new ghost-button under the action row reads:

  - **Free:** "Unlock past editions" → `/upgrade?next=/history`
  - **Paid:** "Browse past editions" → `/history`

Click each as the appropriate user — the destination must match.

### M6.3 — Anonymous viewer never sees `/library`

The page already redirects to `/auth/login`. Confirm — the M6 changes
don't affect that flow.

---

## Cross-cutting tests

### CC.1 — Today's edition stays public to anon

Sign out completely. Visit `/`. The hero, the tip grid, the agent activity
strip all render. No paywall. (REQ-LIVE-01 + tier RLS sanity check.)

### CC.2 — Cache invalidation after a fresh cron run

Force-fire the cron via §5.a. Within 5 seconds, the hero eyebrow's "Last run"
and the live activity strip both update without a hard refresh. (Both cache
tags are purged in the same `revalidateTag` call inside the cron route.)

### CC.3 — Source-link audit still passes

```bash
npx tsx scripts/audit-source-links.ts
```

**Expected:** all sources return 2xx or 401 (paywalled). No FAILs. (REQ-LINK-05.)

### CC.4 — Cron freshness still passes

Same script — the freshness check at the top should report `< 36h` from the
latest `feed_date`. (REQ-LIVE-02.)

---

## Ship checklist (post-QA)

- [ ] M1.1 columns exist
- [ ] M1.2 only `_tier_gated_read` policy on `ai_daily_feed`
- [ ] M1.3 anon sees only today; flipped paid user sees archive
- [ ] M2.1 extensions enabled
- [ ] M2.2 schedule exists in `cron.job`
- [ ] M2.3 manual fire writes a feed row + a `cron.job_run_details` row
- [ ] M2.4 `vercel.json` deleted
- [ ] M3.1 tier helper returns correct shape for all three viewer states
- [ ] M3.2 bad URL segments 404 without DB read
- [ ] M4.1 modal dismissal sticks for the session
- [ ] M4.2 paid calendar shows real dates + tip counts
- [ ] M5.1 past-date URL paywalls correctly for anon and free
- [ ] M5.4 promo redemption flips tier + writes redemption row
- [ ] M5.5 double-redemption blocked
- [ ] M5.7 stacking extends `paid_until`
- [ ] M6.1 header tier badge correct for both tiers
- [ ] M6.2 library cross-link routes correctly per tier
- [ ] CC.1 anon homepage still works
- [ ] CC.2 cache invalidation in lockstep
- [ ] CC.3 source-link audit clean
- [ ] CC.4 freshness clean

When every box is ticked, ship.
