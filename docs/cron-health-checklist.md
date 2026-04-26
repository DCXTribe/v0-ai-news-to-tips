# Cron Health Checklist — AI Daily (writable, schema-correct)

**Document version:** 1.1 (writable companion)
**Date:** April 26, 2026
**Owner:** DCX
**Source:** `cron-health-checklist.md` v1.0 (read-only ops doc)
**Why this exists:** the v1.0 ops checklist was written against a planned schema
(`ai_daily_news_items`, `news_item_id`) that diverged from what actually shipped
(`ai_daily_feed`, `feed_id`). The SQL in v1.0 will not run as-is. This file is
the writable, schema-correct twin — same structure, same pass criteria, same
fix matrix, but every query and column reference matches the live database.

If you are reading this for the first time, **use this file**, not the v1.0.

---

## How to use

This is an operational document. Each check is something you run, with a clear
pass/fail and a fix if it fails. Open the Supabase SQL editor and the Vercel
dashboard in side-by-side tabs before you start. Total time on the green path:
~10 minutes.

The checks are organized in three groups:

1. **§1 Setup verification** — once, before you do anything else.
2. **§2 Health checks** — three SQL queries you can run anytime. ~5 minutes.
3. **§3 Pre-submission ritual** — a T-24h / T-12h / T-2h / T-30min sequence.

Plus §4 (fix matrix), §5 (manual trigger), §6 (emergency seed).

The SQL for §2 is also pre-written as a single paste-ready file at
`scripts/cron-health.sql` — open it in the Supabase SQL Editor and run all
three checks at once.

---

## 1. Setup verification (do this first, once)

| # | Check | Where | Pass criteria |
|---|---|---|---|
| 1.1 | A cron entry for `/api/cron/daily-feed` exists in `vercel.json` | Repo root | Entry exists with schedule `"0 20 * * *"` (= 8 PM UTC = 4 AM MYT). Now lives in this repo's `vercel.json`. |
| 1.2 | The cron job is visible in the Vercel dashboard | Vercel → Project → Settings → Cron Jobs | Listed, "Enabled", with a `Next run` timestamp |
| 1.3 | `CRON_SECRET` env var is set on Production | Vercel → Project → Settings → Environment Variables | Exists, scoped to Production, value not empty |
| 1.4 | `FIRECRAWL_API_KEY` is set on Production | Same place | Exists |
| 1.5 | `TAVILY_API_KEY` is set on Production | Same place | Exists |
| 1.6 | `SUPABASE_SERVICE_ROLE_KEY` is set on Production | Same place | Exists (service role, not anon — cron writes need this) |
| 1.7 | Tables `ai_daily_feed` and `ai_daily_tips` exist | Supabase → Table Editor | Both visible (note: real names — not `ai_daily_news_items`) |
| 1.8 | `ai_daily_feed.source_url` is `text` and populated by the cron on every insert | Supabase → Table Editor → ai_daily_feed | Column present. Currently nullable in schema; the cron always sets it (route file line ~96) and `lib/feed.ts` filters null-source rows out at the lib boundary per REQ-LINK-04. A NOT NULL constraint is optional belt-and-suspenders — only add after auditing existing rows. |
| 1.9 | The vendor source whitelist exists in the database | `ai_daily_news_sources` (Supabase) | 8 active rows covering OpenAI, Anthropic, Google, Microsoft, Perplexity, Moonshot, Alibaba/Qwen, DeepSeek. Run the bonus query at the bottom of `scripts/cron-health.sql` to verify. |

If any of 1.1–1.9 fails, fix it before running anything in §2.

---

## 2. Health checks (run anytime)

Open `scripts/cron-health.sql` in the Supabase SQL Editor. The full text of
each query lives there with comments. Reproduced inline below for reference.

### Check A — Has the cron run today?

```sql
SELECT
  COUNT(*)                              AS items_in_last_run,
  MAX(created_at)                       AS last_item_written,
  NOW() - MAX(created_at)               AS time_since_last_run,
  COUNT(DISTINCT source_url)            AS unique_sources_in_run
FROM ai_daily_feed
WHERE created_at > NOW() - INTERVAL '36 hours';
```

**Pass:**
- `items_in_last_run` ≥ 5
- `time_since_last_run` < 36 hours
- `unique_sources_in_run` ≥ 5 (we whitelist 8 — some may have nothing new on a given day, that's fine)

**Fail → see §4 fix matrix, row "Cron has not run".**

### Check B — Are tips wired to feed rows with non-null source URLs?

```sql
SELECT
  t.id                                  AS tip_id,
  t.title                               AS tip_title,
  t.source_url                          AS tip_source_url,
  f.headline                            AS feed_headline,
  f.source_url                          AS feed_source_url,
  f.created_at                          AS feed_created
FROM ai_daily_tips t
LEFT JOIN ai_daily_feed f
  ON t.feed_id = f.id
WHERE t.created_at > NOW() - INTERVAL '36 hours'
ORDER BY t.created_at DESC
LIMIT 20;
```

**Pass:**
- Every row has a non-null `tip_source_url` AND a non-null `feed_source_url`.
- `tip_title` is real (not "TODO", not lorem ipsum).
- `feed_created` is within the last 36 hours.

**Fail → see §4 fix matrix, rows "Null source_url" or "Tips orphaned from feed rows".**

### Check C — Are the source links actually reachable?

This is the link audit (REQ-LINK-05). Two ways to run it:

**Recommended: the dedicated audit script.**

```bash
npx tsx scripts/audit-source-links.ts
```

The script reads the active edition out of Supabase, runs HEAD requests with a
GET fallback, treats `401`/`403` as paywalled (verdict: paywall, not failure),
and surfaces any `4xx`/`5xx` as failures. Set `APPLY_PAYWALL_FLAGS=1` to write
verdicts back to `ai_daily_tips.is_paywalled` so the UI shows the
"Subscription required" badge.

**Quick manual: shell loop on a small list.**

Paste the output of `scripts/cron-health.sql` Check C into this template:

```bash
for url in \
  "https://openai.com/blog/example-1" \
  "https://www.anthropic.com/news/example-2" \
  "https://blog.google/technology/ai/example-3" \
  ; do
  status=$(curl -o /dev/null -s -w "%{http_code}" -L -A "Mozilla/5.0" "$url")
  echo "$status  $url"
done
```

**Pass:** Every URL returns `200`. A `401`/`403` is acceptable only with the paywall badge (REQ-LINK-05). Any `404`/`5xx` fails the audit.

**Fail → see §4 fix matrix.**

---

## 3. Pre-submission ritual

(Identical to v1.0 of the read-only checklist — reproduced for completeness.)

### T-24h (the night before submission)

- Run §2 Check A. If it fails, trigger the manual cron (§5) immediately and re-check after 5 minutes.
- Run §2 Check B. If any null `tip_source_url` rows exist, see §4 fix matrix.
- Open the deployed `/` URL on a fresh browser (incognito). Click three random tip cards' source pills. All should open the original article.
- Open the deployed `/` URL on your phone. The Live Agent Activity strip should show State A with a recent timestamp.

### T-12h (morning of submission)

- Run §2 Check A again. The `time_since_last_run` should be < 12 hours by now.
- If the overnight run failed silently, trigger the manual cron (§5).
- Verify the Vercel dashboard's Cron Jobs page shows the most recent run as "Succeeded" (green).
- Spot-check Vercel observability logs for the `[v0]` markers. Look for `[v0] cron error for ...` (none expected) and `[v0] revalidateTag failed` (none expected).

### T-2h (final pre-flight before recording the demo)

- Run §2 Checks A, B, and C in order. All three must pass.
- Do the demo path end-to-end without recording: hero → strip → click a tip → click its source pill → back → Unpack a real article → Advisor for a real task → Ask a real question.
- Save one tip into Library, confirm it appears with the source pill intact, then unsave it (so the demo recording starts from a clean state).

### T-30min (immediately before recording)

- Refresh `/today` once. Confirm the eyebrow timestamp matches the Live Agent Activity strip timestamp **exactly**. (The cron route now purges both `daily-feed` and `agent-status` cache tags on every successful run, so they should always agree — if they don't, the cron failed silently.)
- Confirm Pillar 3 in the value section says "Agent works overnight. You ship by 10 AM." (not the old "Done, not done-for-you" copy).
- Confirm the tool-stack badge row is visible above the footer.
- Confirm the Asia-Pacific lead sentence sits above the logo strip.

If all four confirmations pass, record the demo per §11 of the contest PRD.

---

## 4. Failure mode → fix matrix

| Symptom | Likely cause | Fix |
|---|---|---|
| §2 Check A returns 0 rows | Cron has never run, or has not run in 36+ hours | Trigger manually (§5). If still empty, see §6 emergency seed. |
| Cron triggered but Vercel logs show timeout | A vendor blog is slow or unreachable | Confirm `maxDuration = 60` on the cron route. The cron processes sources in parallel via `Promise.allSettled` and limits to `SOURCE_LIMIT = 5` per run, so one slow vendor shouldn't sink the whole run. If it does, lower `SOURCE_LIMIT` to 4 temporarily. |
| Cron triggered, logs show error after `[v0] tavily lookup failed` | Tavily MCP outage or invalid key | Confirm `TAVILY_API_KEY` is set. Check Tavily status. The cron logs and skips the affected source — others still process. |
| Cron triggered, logs show error during `scrapeUrl` | Firecrawl MCP outage or invalid key | Confirm `FIRECRAWL_API_KEY` is set. Check Firecrawl status. If outage, leave the previous edition live — the strip's State C handles this gracefully. |
| Cron triggered, logs show error during `generateTipFromNewsItem` | Vercel AI Gateway issue or quota | Check AI Gateway dashboard. If quota, swap the default model in `lib/ai/generate.ts` to a cheaper one for this edition. |
| §2 Check B shows null `feed_source_url` | Cron parsed a vendor blog but failed to capture the canonical URL | Open `app/api/cron/daily-feed/route.ts`. The insert uses `article.url` from Firecrawl — if that's null, Firecrawl returned a malformed scrape. Re-run the cron manually. |
| §2 Check B shows null `tip_source_url` but `feed_source_url` is set | Tip insert raced or was hand-written | The cron inserts tip and feed in sequence — this only happens for hand-inserted rows. Delete the orphan; `lib/feed.ts` filters them anyway. |
| §2 Check B shows tips orphaned from feed (LEFT JOIN returns null on the feed side) | Tips inserted before their feed row, or feed row deleted | Delete the orphaned tips. They should not render anyway per REQ-LINK-04. |
| §2 Check C shows a `404` on a source URL | Vendor moved or deleted the post between scrape and audit | Re-run the cron. If still 404, manually delete the affected `ai_daily_feed` row (cascade to tips) and let the edition ship with one fewer tip. |
| §2 Check C shows a `401`/`403` | Paywalled vendor (rare for blogs but possible) | Run `APPLY_PAYWALL_FLAGS=1 npx tsx scripts/audit-source-links.ts` to set `is_paywalled=true` on those tips. The TipCard renders a "Subscription required" badge automatically. |
| Eyebrow timestamp ≠ Live Agent Activity strip timestamp | Cache desync between the two cache tags | Both surfaces read live data; only the caches lag. The cron route now purges both `FEED_CACHE_TAG` and `AGENT_STATUS_CACHE_TAG` on every successful run, so a desync now means the cron failed. Run `§5` to re-trigger. |
| Landing page renders fake/placeholder tips | v0 silently fell back to a fixture during a regeneration | Search the codebase: `grep -r 'sampleTips\|mockTips\|placeholderTips\|lorem'`. The current build is clean. If anything appears, delete it and rebuild reading from Supabase. |

---

## 5. Manual cron trigger procedure

```bash
# Replace YOUR_CRON_SECRET with the value from Vercel env vars (Production)
# Replace yourdomain.com with the deployed Vercel URL

curl -X GET "https://yourdomain.com/api/cron/daily-feed" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  --max-time 90 \
  -v
```

The cron route also accepts `?secret=YOUR_CRON_SECRET` for browser-based manual triggering when you're already logged into Vercel.

**Expected response:** HTTP 200 with a JSON body like:

```json
{
  "ok": true,
  "date": "2026-04-26",
  "inserted_count": 5,
  "failed_count": 0,
  "inserted": [
    { "source": "OpenAI Blog", "headline": "..." },
    ...
  ],
  "failed": []
}
```

**If `inserted_count: 0` and `skipped: true`:** today's edition was already written by an earlier run. This is the normal "cron run twice in one day" behavior. The existing edition stays live.

**If `inserted_count: 0` and no `skipped` flag:** every source either failed or was already covered (the cron dedupes by `source_url` across all dates). Check the `failed` array for reasons. Common: `"already covered"` means a previous edition already used that exact URL.

After a successful manual run, re-run §2 Check A to confirm new rows landed and the cache tags purged.

---

## 6. Emergency seed procedure

(Identical to v1.0. Use only if §5 fails and you cannot fix the cron in time.)

The goal is to get a real, dated, source-linked edition into the database so the landing page is not empty during judging. This is **not** "fake content." You are running the same logical pipeline manually — scrape three real vendor blog posts via `/unpack`, then insert the resulting tips into `ai_daily_feed` + `ai_daily_tips` via the Supabase SQL editor.

By the time judges see the showcase, a real overnight run will have replaced the seeded edition.

1. Pick three recent posts from three different vendor blogs. Open each in browser tabs.
2. For each post, paste its URL into `/unpack` on the deployed site (logged in as your own account).
3. Each Unpack run produces 1 tip with the source URL and publisher captured.
4. For each generated tip, write a SQL INSERT mirroring what the cron writes:
   - One row into `ai_daily_feed` (with `feed_date = CURRENT_DATE`, `source_url`, `headline`, `summary`, `category`, `source_label`, `source_id` from `ai_daily_news_sources`).
   - One row into `ai_daily_tips` linking by `feed_id`, with `source_url`, `source_title`, `source_publisher`, and the tip body.
5. Re-run §2 Checks A, B, C. They should now pass.
6. Trigger the cron one more time before submission. If it succeeds, the seeded edition gets superseded.

---

## 7. Quick reference card

```
T-24h  Run §2 A, B. Click 3 source pills on /. Mobile check.
T-12h  Run §2 A. Vercel dashboard: cron last run = green.
T-2h   Run §2 A, B, C (use scripts/cron-health.sql + audit-source-links.ts).
T-30m  Refresh /today. Eyebrow ts = strip ts (cron purges both tags).
T-0    Record demo. Submit.

Manual trigger:
  curl -X GET "https://[domain]/api/cron/daily-feed" \
    -H "Authorization: Bearer [CRON_SECRET]"

If empty after manual:  §6 emergency seed.
If null source_url:     §4, row "null source_url".
If 404 on a source:     §4, row "404 on source URL".
If ts desync:           cron failed silently — re-trigger via §5.
```

---

*End of document.*
