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
      return { items: todays as FeedItem[], date: today, isToday: true }
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
      items: (items ?? []) as FeedItem[],
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
