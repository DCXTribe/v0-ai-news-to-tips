-- Cron Health — paste-ready Supabase SQL Editor checks.
--
-- Schema-correct version of §2 of docs/cron-health-checklist.md.
-- The PRD/checklist v1.0 references `ai_daily_news_items` and `news_item_id`,
-- but the live schema in this project is:
--   - ai_daily_feed         (one row per (article, headline, summary))
--   - ai_daily_tips         (linked to feed via feed_id, NOT news_item_id)
--   - ai_daily_news_sources (the eight active vendor blogs)
--
-- Run all three checks in order. Pass criteria are inline. If any fail, see
-- docs/cron-health-checklist.md §4 for the fix matrix.

-- =========================================================================
-- CHECK A — Has the cron run today?
-- Pass: items_in_last_run >= 5, time_since_last_run < 36h, unique_sources >= 5.
-- =========================================================================
SELECT
  COUNT(*)                              AS items_in_last_run,
  MAX(created_at)                       AS last_item_written,
  NOW() - MAX(created_at)               AS time_since_last_run,
  COUNT(DISTINCT source_url)            AS unique_sources_in_run
FROM ai_daily_feed
WHERE created_at > NOW() - INTERVAL '36 hours';

-- =========================================================================
-- CHECK B — Are tips wired to feed rows with non-null source URLs?
-- Pass: every row has non-null source_url, headline is real (no TODO/lorem),
--       feed_created within the last 36h.
--
-- Note: tips carry their own copy of source_url too (denormalized for the
-- TipCard render path). We surface both columns so a mismatch is visible —
-- tip.source_url is the one the UI uses; feed.source_url is the one the cron
-- captured during scrape. They should match for any tip in the active edition.
-- =========================================================================
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

-- =========================================================================
-- CHECK C — Source-URL list for the active edition (export to a CSV, then
-- audit reachability with `npx tsx scripts/audit-source-links.ts` — that
-- script does HEAD requests, treats 401/403 as paywalled, and surfaces 4xx/5xx
-- as failures per REQ-LINK-05).
--
-- This query just produces the list. Paste the output into the audit script
-- or copy into a curl loop per checklist §2 Check C.
-- =========================================================================
SELECT DISTINCT
  f.source_url,
  f.headline,
  f.source_label                        AS publisher
FROM ai_daily_feed f
WHERE f.feed_date = (
  SELECT MAX(feed_date) FROM ai_daily_feed
)
ORDER BY publisher NULLS LAST;

-- =========================================================================
-- BONUS — Active source whitelist (checklist §1.9: should return 8 rows).
-- =========================================================================
SELECT name, vendor, publisher, url, last_scraped_at
FROM ai_daily_news_sources
WHERE is_active = true
ORDER BY publisher;
