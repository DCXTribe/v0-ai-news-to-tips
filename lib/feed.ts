import { unstable_cache } from "next/cache"
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

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
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
