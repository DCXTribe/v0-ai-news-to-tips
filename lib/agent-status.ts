import { unstable_cache } from "next/cache"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Live status of the overnight research agent — surfaced on `/` and `/today`
 * via the AgentActivityStrip component, and on `/api/agent-status` for the
 * client-side 30s poll.
 *
 * Schema note: the PRD calls the underlying table `ai_daily_news_items`, but
 * the real schema is `ai_daily_feed` (one row per article+headline+summary)
 * with `ai_daily_tips` linked by `feed_id`. We compute the four surfaced
 * counts from those two tables plus `ai_daily_news_sources` (for the active
 * source count, which doubles as "sources scanned" since the cron processes
 * all active rows).
 */

export type AgentState = "idle" | "running" | "failed"

export type AgentStatus = {
  state: AgentState
  /** ISO timestamp of MAX(created_at) on ai_daily_feed; null on cold start. */
  lastRunAt: string | null
  /** Count of distinct active vendor blogs the agent monitors. */
  sourcesScanned: number
  /** Count of feed rows in the latest edition. */
  articlesRead: number
  /** Count of tips published in the latest edition. */
  tipsPublished: number
}

export const AGENT_STATUS_CACHE_TAG = "agent-status"

/** MYT (Malaysia Time) is UTC+8, no DST — a constant offset is fine. */
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000

function nowInMyt(): Date {
  return new Date(Date.now() + MYT_OFFSET_MS)
}

function todayMytDateString(): string {
  return nowInMyt().toISOString().slice(0, 10)
}

export const getAgentStatus = unstable_cache(
  async (): Promise<AgentStatus> => {
    const service = createServiceClient()

    // Three independent reads in parallel:
    // 1. Latest feed row -> last-run timestamp + latest edition date
    // 2. Active sources count
    const [{ data: latestFeed }, { count: activeSourcesCount }] = await Promise.all([
      service
        .from("ai_daily_feed")
        .select("created_at, feed_date")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      service
        .from("ai_daily_news_sources")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ])

    const sourcesScanned = activeSourcesCount ?? 0
    const lastRunAt = latestFeed?.created_at ?? null
    const latestDate = latestFeed?.feed_date ?? null

    let articlesRead = 0
    let tipsPublished = 0
    if (latestDate) {
      // Pull every feed row for the latest edition so we can both count them
      // and use their IDs to count linked tips. A single .in() query is
      // cheaper than a count + count round-trip.
      const { data: feedRows } = await service
        .from("ai_daily_feed")
        .select("id")
        .eq("feed_date", latestDate)
      articlesRead = feedRows?.length ?? 0
      if (articlesRead > 0) {
        const ids = feedRows!.map((r) => r.id as string)
        const { count: tipsCount } = await service
          .from("ai_daily_tips")
          .select("id", { count: "exact", head: true })
          .in("feed_id", ids)
        tipsPublished = tipsCount ?? 0
      }
    }

    // State machine.
    // - "running": MYT clock is inside the cron window (04:00–04:30) AND the
    //   latest edition date is not today's MYT date. The cron runs at 04:00
    //   MYT and finishes in ~20s; this window is intentionally generous.
    // - "failed": no run has been recorded, OR the most recent run is older
    //   than 28 hours (gives a 4h buffer past the daily cron so a slightly
    //   late run doesn't flip the strip red).
    // - "idle": default — the visible "everything's working" state.
    const myt = nowInMyt()
    const mytHour = myt.getUTCHours()
    const mytMin = myt.getUTCMinutes()
    const inCronWindow = mytHour === 4 && mytMin <= 30
    const todayMyt = todayMytDateString()

    let state: AgentState = "idle"
    if (inCronWindow && latestDate !== todayMyt) {
      state = "running"
    } else if (!lastRunAt) {
      state = "failed"
    } else {
      const ageMs = Date.now() - new Date(lastRunAt).getTime()
      if (ageMs > 28 * 60 * 60 * 1000) state = "failed"
    }

    return { state, lastRunAt, sourcesScanned, articlesRead, tipsPublished }
  },
  ["agent-status-v1"],
  {
    tags: [AGENT_STATUS_CACHE_TAG],
    // 5-minute TTL per the PRD risk note — the underlying data only changes
    // once per day so caching aggressively is safe and cheap.
    revalidate: 300,
  },
)
