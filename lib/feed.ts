import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import type { Tip } from "@/components/tip-card"

export const FEED_CACHE_TAG = "daily-feed"

export type FeedItem = {
  id: string
  feed_date: string
  headline: string
  summary: string
  category: string | null
  source_label: string | null
  source_url: string | null
  ai_daily_tips: Tip[]
}

export type FeedResult = {
  items: FeedItem[]
  date: string
  isToday: boolean
}

/**
 * Two-day window for the landing page.
 *
 * The brief: only show tips from today + yesterday so the feed never feels
 * stale and the front page always conveys freshness. Each bucket is keyed
 * by the MYT calendar date (matching how `feed_date` is stored).
 *
 * - `today` is empty when the agent hasn't run yet for today's MYT date.
 * - `yesterday` is empty if there was no edition the previous day (cold
 *   start, or a missed run).
 * - Both empty = first-edition empty state on the page.
 */
export type RecentFeedResult = {
  today: FeedItem[]
  yesterday: FeedItem[]
  todayDate: string
  yesterdayDate: string
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * "Today" in Malaysia Time (UTC+8, no DST).
 *
 * The cron writes `feed_date = (now() at time zone 'Asia/Kuala_Lumpur')::date`
 * so the column always carries an MYT calendar date. Looking it up requires
 * the same MYT calendar date — using the server's UTC date here would
 * mis-key the lookup for the 8h window where UTC and MYT straddle the
 * dateline (e.g. Mon 07:00 MYT = Sun 23:00 UTC; UTC date is still Sunday).
 */
function todayMytDateString(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Yesterday in MYT — same anchoring rule as `todayMytDateString`. */
function yesterdayMytDateString(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

/**
 * REQ-LINK-04: tips with a null `source_url` must not render on `/` or
 * `/today`. The brand promise ("with the source linked on every tip") fails
 * loudly the moment a sourceless tip slips through.
 *
 * Filter at the lib boundary — every page that reads via getCachedFeed /
 * getCachedArchive automatically benefits, and we log the count once per
 * fetch so ops can spot a failing cron parser before it goes live.
 */
function stripSourcelessTips(items: FeedItem[]): FeedItem[] {
  let dropped = 0
  const cleaned = items.map((item) => {
    const tips = (item.ai_daily_tips ?? []).filter((t) => {
      const has = t.source_url && t.source_url !== "user-pasted"
      if (!has) dropped += 1
      return has
    })
    return { ...item, ai_daily_tips: tips }
  })
  if (dropped > 0) {
    console.log(`[v0] feed: filtered ${dropped} sourceless tip(s) (REQ-LINK-04). Audit cron output.`)
  }
  // Drop feed items that ended up with zero renderable tips
  return cleaned.filter((i) => (i.ai_daily_tips ?? []).length > 0)
}

/**
 * Reads the latest daily feed (today's, or fallback to most recent edition).
 * Cached with a 1h revalidate window AND tagged so the cron can purge
 * the cache the moment a new edition is written.
 *
 * The cache key includes the date so a new day naturally rolls the cache.
 */
export const getCachedFeed = unstable_cache(
  async (): Promise<FeedResult> => {
    const today = todayDateString()
    const service = createServiceClient()

    const { data: todays } = await service
      .from("ai_daily_feed")
      .select("*, ai_daily_tips(*)")
      .eq("feed_date", today)
      .order("created_at", { ascending: true })

    if (todays && todays.length > 0) {
      return { items: stripSourcelessTips(todays as FeedItem[]), date: today, isToday: true }
    }

    const { data: latest } = await service
      .from("ai_daily_feed")
      .select("feed_date")
      .order("feed_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latest) return { items: [], date: today, isToday: true }

    const { data: items } = await service
      .from("ai_daily_feed")
      .select("*, ai_daily_tips(*)")
      .eq("feed_date", latest.feed_date)
      .order("created_at", { ascending: true })

    return {
      items: stripSourcelessTips((items ?? []) as FeedItem[]),
      date: latest.feed_date,
      isToday: false,
    }
  },
  ["daily-feed-v1"],
  {
    tags: [FEED_CACHE_TAG],
    revalidate: 3600, // 1h fallback; cron purges via revalidateTag immediately on new edition
  },
)

/**
 * Reads tips from today + yesterday (MYT) for the landing page hero.
 *
 * Returns both buckets in a single round-trip via `IN (...)`. Cached on the
 * shared FEED_CACHE_TAG so the cron's `revalidateTag` in `/api/cron/daily-feed`
 * purges this fetcher the moment a new edition is written — combined with the
 * `<AgentActivityStrip>` 30s poll → `router.refresh()` flow, the page picks
 * up the fresh data without a manual reload.
 *
 * The cache key embeds today's MYT date so a calendar rollover (e.g. 00:00
 * MYT) naturally invalidates the previous day's cached result.
 */
export const getCachedRecentFeed = unstable_cache(
  async (): Promise<RecentFeedResult> => {
    const todayDate = todayMytDateString()
    const yesterdayDate = yesterdayMytDateString()
    const service = createServiceClient()

    const { data } = await service
      .from("ai_daily_feed")
      .select("*, ai_daily_tips(*)")
      .in("feed_date", [todayDate, yesterdayDate])
      .order("feed_date", { ascending: false })
      .order("created_at", { ascending: true })

    const all = (data ?? []) as FeedItem[]
    return {
      today: stripSourcelessTips(all.filter((i) => i.feed_date === todayDate)),
      yesterday: stripSourcelessTips(all.filter((i) => i.feed_date === yesterdayDate)),
      todayDate,
      yesterdayDate,
    }
  },
  // Versioned key prefix so future shape changes don't collide with the
  // single-edition cache. Including the MYT date in the key ensures a
  // midnight rollover gives us a fresh cache slot even before the cron runs.
  ["daily-feed-recent-v1"],
  {
    tags: [FEED_CACHE_TAG],
    revalidate: 3600,
  },
)

/**
 * Returns the prior 3 editions (excluding the latest currently-shown date).
 * Used by the dedicated /today page to power the "Earlier editions" archive.
 *
 * Cached on the same tag so a fresh edition invalidates the archive too
 * (yesterday becomes day-before-yesterday, which is automatic).
 */
export const getCachedArchive = unstable_cache(
  async (excludeDate: string): Promise<{ date: string; items: FeedItem[] }[]> => {
    const service = createServiceClient()

    const { data: dates } = await service
      .from("ai_daily_feed")
      .select("feed_date")
      .lt("feed_date", excludeDate)
      .order("feed_date", { ascending: false })
      .limit(20)

    if (!dates || dates.length === 0) return []

    // Distinct dates, take top 3 (Set lookup keeps this O(n) instead of O(n²))
    const seen = new Set<string>()
    const distinct: string[] = []
    for (const r of dates) {
      if (seen.has(r.feed_date)) continue
      seen.add(r.feed_date)
      distinct.push(r.feed_date)
      if (distinct.length === 3) break
    }
    if (distinct.length === 0) return []

    const { data: items } = await service
      .from("ai_daily_feed")
      .select("*, ai_daily_tips(*)")
      .in("feed_date", distinct)
      .order("feed_date", { ascending: false })
      .order("created_at", { ascending: true })

    const grouped = distinct.map((d) => ({
      date: d,
      items: stripSourcelessTips(((items ?? []) as FeedItem[]).filter((i) => i.feed_date === d)),
    }))
    return grouped
  },
  ["daily-feed-archive-v1"],
  {
    tags: [FEED_CACHE_TAG],
    revalidate: 3600,
  },
)

/**
 * Reads a single past edition by date — for `/today/[date]` and `/history`
 * (paid-tier surfaces). Goes through the user-scoped client deliberately so
 * RLS on `ai_daily_feed` (PRD v1.4 §15.5) is the second layer of paywall
 * defense: free viewers get an empty result here even if they bypass the
 * server-side tier check. Paid viewers see the full edition.
 *
 * Not cached: per-user (RLS-dependent) and accessed sparingly (one date at a
 * time from a calendar pick). Past editions are immutable so HTTP-layer
 * caching by the CDN is the right place if traffic ever warrants it.
 *
 * Returns `null` when the edition doesn't exist OR when RLS blocked it
 * (callers can't distinguish, which is fine — both cases render the same
 * "not available" state).
 */
export async function getFeedForDate(date: string): Promise<FeedItem[] | null> {
  // Validate input shape — defensive against URL-segment tampering.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_daily_feed")
    .select("*, ai_daily_tips(*)")
    .eq("feed_date", date)
    .order("created_at", { ascending: true })

  if (error || !data || data.length === 0) return null
  return stripSourcelessTips(data as FeedItem[])
}

/**
 * Lists distinct edition dates available to the viewer, newest first.
 * Used by `/history` to render the calendar of past editions.
 *
 * Same RLS-as-defense story as `getFeedForDate`: free viewers get only the
 * latest date back; paid viewers get the full history. The page layer should
 * still gate on `isViewerPaid()` to render the upgrade modal — this function
 * just exposes whatever the database is willing to return.
 */
export async function listAvailableEditionDates(limit = 90): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_daily_feed")
    .select("feed_date")
    .order("feed_date", { ascending: false })
    .limit(limit)

  if (error || !data) return []

  // Distinct (the table can have multiple rows per date — one per news source).
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of data) {
    const d = row.feed_date as string
    if (seen.has(d)) continue
    seen.add(d)
    out.push(d)
  }
  return out
}
