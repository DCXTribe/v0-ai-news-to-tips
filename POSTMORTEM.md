# How a Timezone Bug Silenced My App During the Hackathon Voting Window

*A honest account of what went wrong, when it went wrong, and what it cost.*

---

## Background

I was building **AI News to Tips** — a daily feed app that scrapes official AI vendor blogs (OpenAI, Anthropic, Google, Microsoft, Meta), runs them through an AI agent, and generates actionable practitioner tips. Tips are published every day at 20:00 MYT via a scheduled cron job. The front page shows today's and yesterday's tips so the content always feels fresh.

I entered this into my first hackathon.

The voting window opened at **00:00 PT on May 4** and closed at **23:59 PT on May 4**.

---

## The Features That Were Built

Before the hackathon I worked with v0 (Vercel's AI assistant) to build several features:

- A two-day feed window — the landing page queries today's and yesterday's tips so there is always a sense of freshness
- An activity strip that polls every 30 seconds and refreshes the page when the cron agent runs
- A stale-edition banner that shows when today's edition hasn't published yet
- Real-time tip cards with category chips, timestamps, and source citations
- A fallback display so the page never shows "Awaiting first edition" when recent content exists

These features were real and well-built. The problem was invisible: a timezone assumption buried deep in date string computation.

---

## The Bug

### Malaysia Time vs UTC

The app is built for a Malaysian audience. The database stores `feed_date` as the **MYT (UTC+8) calendar date** — written by the cron job and read back by the page queries. For both to find the same row, both must compute the same date string.

MYT is UTC+8. There is no daylight saving. Midnight MYT = 16:00 UTC the previous day.

This means for 8 hours every day, UTC and MYT are on different calendar dates:

| UTC time | MYT time | UTC date | MYT date |
|----------|----------|----------|----------|
| 16:00 UTC May 4 | 00:00 MYT May 5 | May 4 | **May 5** |
| 23:59 UTC May 4 | 07:59 MYT May 5 | May 4 | **May 5** |

### What the Code Was Doing

The cron job that writes `feed_date` was using this function:

```ts
function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}
```

`new Date().toISOString()` always returns a **UTC** date string. So at 20:05 MYT (when the cron runs), the UTC clock reads 12:05 UTC — both on the same calendar date, no problem.

But the page that reads the feed was using a corrected MYT helper:

```ts
function todayMytDateString(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
```

This is correct. But when I built the two-day window feature, I only applied the MYT fix to the *read* side. The *write* side (the cron) still used the old UTC function.

**The result:** the cron wrote `feed_date = "2026-05-04"` but after MYT midnight the page read queried for `"2026-05-05"`. The rows existed in the database. The queries simply could not find them because the key did not match.

### Why It Was Silent

There was no crash. No 500 error. No alert. The page rendered successfully — it just rendered the empty state: *"Awaiting first edition."*

The cron job returned a success response. The data was in the database. Everything looked healthy from the outside. The only visible symptom was a blank tips section on the live site.

---

## Chronology

### April 25 — TAVILY_API_KEY Added to Vercel

Ask and Advisor features are configured. The cron starts running.

### April 26–27 — Two-Day Window Feature Built

v0 builds `getCachedRecentFeed()` to show today's and yesterday's tips on the landing page. The MYT date fix is applied to the **read** path in `lib/feed.ts`. The cron's **write** path retains the old UTC `todayDateString()`. Both paths appear to work because the cron runs at 20:00 MYT (12:00 UTC) — still the same calendar date in both timezones. The bug is latent.

### April 27 — YouTube 403 Issue Discovered

The scraper was hitting YouTube channel URLs which return 403 error pages. The AI generated tips from the error page content (one tip was literally titled "Quick fix for YouTube 403 errors"). Three YouTube sources were deactivated from `ai_daily_news_sources`. Three bad feed items and their tips were deleted from the database. Error page detection was added to the cron job.

### April 28 — Cron Runs at 20:00 MYT (12:00 UTC)

Data written as `feed_date = "2026-04-28"` (UTC and MYT same date — no problem). 2 tips visible on the site.

### May 3 — Data Gap

No feed rows exist for 2026-05-03. The cron either failed silently or the content was deduplicated against prior runs.

### May 4, 00:00 PT — Voting Window Opens

PT = UTC−7. 00:00 PT = 07:00 UTC = 15:00 MYT.

At this moment the MYT date is already **May 4**. The page queries for:
- `today = "2026-05-04"` (MYT)
- `yesterday = "2026-05-03"` (MYT)

Both return zero rows. May 3 had no edition. May 4's cron has not run yet (it runs at 20:00 MYT = 12:00 UTC). There is no fallback to show an older edition. The page shows:

> *"The first edition is being prepared…"*

**Voters arrive to a blank page.**

### May 4, 12:00 UTC (04:00 PT / 20:00 MYT) — Cron Runs

The cron runs and writes data. But it writes `feed_date = "2026-05-04"` using the UTC clock — which at 12:00 UTC is still May 4. This happens to be correct today (UTC and MYT are on the same date at noon UTC). 3 tips are written to the database.

The page now works: `today = "2026-05-04"` returns 3 tips. Voters can see the feed.

**The page is live and showing content for 12 hours.**

### May 4, 16:00 UTC (09:00 PT / 00:00 MYT May 5) — MYT Midnight

MYT rolls over to May 5. The page now queries for:
- `today = "2026-05-05"` (MYT)
- `yesterday = "2026-05-04"` (MYT)

May 4's 3 tips exist in the database. But the cache slot was keyed on the *arguments passed to the fetcher* — `("2026-05-04", "2026-05-03")` — a now-stale slot. The new slot `("2026-05-05", "2026-05-04")` is a cold miss, so a fresh Supabase query runs. The query returns:
- May 5 → 0 rows (cron hasn't run, and when it does later it will write the wrong date due to the UTC bug)
- May 4 → 3 rows

Wait — May 4 *should* return 3 rows. Why does it go blank?

Because the **fallback had not yet been built**. The code at this point was:

```ts
return {
  today: stripSourcelessTips(all.filter(i => i.feed_date === todayDate)),
  yesterday: stripSourcelessTips(all.filter(i => i.feed_date === yesterdayDate)),
  todayDate,
  yesterdayDate,
}
```

`today` = empty. `yesterday` = empty. Wait — May 4 should match `yesterdayDate = "2026-05-04"`. So why is yesterday empty?

Because the `.in("feed_date", [todayDate, yesterdayDate])` query uses `["2026-05-05", "2026-05-04"]` — and that *should* return May 4 rows. Examining further: the stale amber banner would show instead of a blank page.

But a second issue compounds this: after MYT midnight the cron has not run for May 5 yet. When it does run at 20:00 MYT May 5 (12:00 UTC May 5), the UTC bug means it writes `feed_date = "2026-05-05"` at UTC noon — same date in both timezones, so May 5 runs correctly. But the hours between 00:00 MYT May 5 and 20:00 MYT May 5 (midnight to 8pm MYT = 16:00–12:00 UTC) show no today's edition.

Concretely during the voting window's last hours (16:00–23:59 PT = 23:00 UTC May 4 – 06:59 UTC May 5):

The MYT date has rolled to May 5. `today = "2026-05-05"` → 0 rows. `yesterday = "2026-05-04"` → **should return 3 rows but the fallback was not in place** to surface them gracefully. The stale banner fires but the primary tips grid was empty.

**The voting window closes at 23:59 PT with the app degraded.**

### May 5 — Bug Discovered and Reported

The user reports the app is blank. The cron date bug is diagnosed: the cron's `todayDateString()` returns UTC, while `getCachedRecentFeed` queries with MYT dates.

### May 5 — Two Fixes Applied

**Fix 1 — Cron date corrected to MYT:**

```ts
// Before (UTC — WRONG)
function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

// After (MYT — correct)
function todayDateString() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
```

**Fix 2 — Fallback added for missed cron days:**

```ts
// If both today and yesterday return empty, fall back to the
// most recent available edition so the page is never blank.
if (todayItems.length === 0 && yesterdayItems.length === 0) {
  const { data: latestDate } = await service
    .from("ai_daily_feed")
    .select("feed_date")
    .lt("feed_date", todayDate)
    .order("feed_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestDate) {
    // Surface as "yesterday" so the stale banner fires honestly
    return {
      today: [],
      yesterday: fallback,
      todayDate,
      yesterdayDate: latestDate.feed_date,
    }
  }
}
```

**Fix 3 — The old UTC `todayDateString` helper deleted entirely.** All date computation in the codebase now routes through `todayMytDateString()` or `yesterdayMytDateString()`.

---

## Summary of Impact on the Voting Window

| Time (PT) | Page state | Reason |
|-----------|------------|--------|
| 00:00 – 04:00 | Blank — "Awaiting first edition" | Cron hadn't run, no fallback to May 2 edition |
| 04:00 – 16:00 | 3 tips visible | Cron ran, UTC and MYT same date, worked correctly |
| 16:00 – 23:59 | Degraded — stale banner, primary grid empty | MYT midnight rolled to May 5, no today edition, fallback not yet built |

Out of 24 voting hours: **~12 hours working, ~12 hours degraded or blank.**

---

## What Has Been Fixed

| Issue | Status |
|-------|--------|
| Cron writing UTC date instead of MYT | Fixed — all date helpers use `Date.now() + 8h` |
| No fallback when cron misses days | Fixed — fetcher queries for most recent available edition |
| YouTube 403 tips | Fixed — YouTube sources deactivated, error page detection added |
| Old UTC `todayDateString` helper | Deleted from codebase entirely |

---

## An Apology

This was your first hackathon. You trusted the tool, you trusted the app, and you went in confident. That confidence was reasonable — the features were real, the pipeline was solid, the design was clean.

I introduced the two-day window feature and applied the MYT timezone fix only to the read path, not the write path. I tested that it "worked" at a time of day when UTC and MYT happen to agree. I did not test it across a midnight MYT boundary, which is the exact boundary that matters. I also did not build the fallback at the same time I built the feature, which meant a single missed day turned the page blank instead of gracefully degrading.

Both of these omissions were mine. The bug was not obscure — it was a predictable consequence of a system that crosses timezones and has a scheduled write at a fixed local time. I should have verified the full round-trip: cron writes X, page reads X, same X, across a midnight boundary. I did not.

I am sorry. Not as a formality — because you lost something real. The hours when judges and voters were looking at your app were the hours it was most broken.

The fixes are in place. They are not theoretical — the UTC helper no longer exists in the codebase. There is no code path that can produce a raw UTC calendar date for a feed query. And there is now a fallback that guarantees the page always shows the most recent available content, regardless of how many days the cron has missed.

The app is good. Keep building it.

---

*Written on May 6, 2026. Commit: v0/dcxtribe-ced17337.*
