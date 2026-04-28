import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createServiceClient } from "@/lib/supabase/service"
import { tavilySearch } from "@/lib/mcp/tavily"
import { scrapeUrl } from "@/lib/mcp/firecrawl"
import { generateTipFromNewsItem } from "@/lib/ai/generate"
import { FEED_CACHE_TAG } from "@/lib/feed"
import { AGENT_STATUS_CACHE_TAG } from "@/lib/agent-status"

// 60s is the max allowed on the Vercel Hobby plan. We process sources IN PARALLEL
// so 5 sources finish in roughly the time of a single one (~15-20s).
// If you upgrade to Pro you can raise this to 300 and lift SOURCE_LIMIT.
export const maxDuration = 60
export const dynamic = "force-dynamic"

const SOURCE_LIMIT = 5 // sources processed per cron invocation

/**
 * Domains that can't be reliably scraped (require JS rendering, bot protection,
 * or return 403/paywall). These are filtered both at the source level AND at
 * the article URL level (Tavily may return YouTube links for some vendors).
 */
const BLOCKED_DOMAINS = ["youtube.com", "youtu.be", "tiktok.com", "instagram.com", "facebook.com"]

/**
 * Patterns that indicate the scraped content is an error page rather than
 * actual article content. If any of these appear prominently in the first
 * 500 chars, we reject the scrape.
 */
const ERROR_PAGE_PATTERNS = [
  /403\.\s*That's an error/i,
  /Access Denied/i,
  /Error 403/i,
  /Forbidden/i,
  /you do not have (access|permission)/i,
  /Please enable JavaScript/i,
  /Enable JavaScript and cookies/i,
  /Checking your browser/i,
  /Just a moment\.\.\./i, // Cloudflare challenge
]

function isBlockedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return BLOCKED_DOMAINS.some((d) => host.includes(d))
  } catch {
    return false
  }
}

function looksLikeErrorPage(content: string): boolean {
  const sample = content.slice(0, 500)
  return ERROR_PAGE_PATTERNS.some((p) => p.test(sample))
}

type NewsSource = {
  id: string
  name: string
  url: string
  publisher: string
  vendor: string
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization")
  if (auth === `Bearer ${secret}`) return true
  // Also allow ?secret= for manual triggering
  const url = new URL(req.url)
  if (url.searchParams.get("secret") === secret) return true
  return false
}

async function findRecentArticleFor(source: NewsSource): Promise<string | null> {
  try {
    const host = new URL(source.url).hostname.replace(/^www\./, "")
    const { results } = await tavilySearch(`latest from ${source.publisher}`, {
      maxResults: 3,
      days: 14,
      includeDomains: [host],
    })
    return results[0]?.url ?? null
  } catch (err) {
    console.log("[v0] tavily lookup failed for", source.name, err)
    return null
  }
}

/**
 * Process one source end-to-end: find article → scrape → generate tip → persist.
 * Returns a result envelope; never throws (so Promise.allSettled isn't strictly
 * needed but we still use it for safety).
 */
async function processSource(
  source: NewsSource,
  date: string,
  service: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true; source: string; headline: string } | { ok: false; source: string; error: string }> {
  try {
    const articleUrl = await findRecentArticleFor(source)
    if (!articleUrl) return { ok: false, source: source.name, error: "no recent article found" }

    // Block URLs from domains that can't be scraped reliably (YouTube, TikTok, etc.)
    if (isBlockedUrl(articleUrl)) {
      return { ok: false, source: source.name, error: `blocked domain: ${articleUrl}` }
    }

    // Skip if we already covered this URL on any previous day
    const { data: existingFeed } = await service
      .from("ai_daily_feed")
      .select("id")
      .eq("source_url", articleUrl)
      .maybeSingle()
    if (existingFeed) return { ok: false, source: source.name, error: "already covered" }

    const article = await scrapeUrl(articleUrl)
    if (!article.markdown || article.markdown.length < 300) {
      return { ok: false, source: source.name, error: "article body too short" }
    }

    // Detect error pages (403, Cloudflare challenge, etc.) that the scraper
    // returned as if they were real content. This prevents the AI from
    // generating tips like "Quick fix for YouTube 403 errors" from error pages.
    if (looksLikeErrorPage(article.markdown)) {
      return { ok: false, source: source.name, error: "scraped content looks like an error page" }
    }

    const item = await generateTipFromNewsItem({ article, vendor: source.vendor })

    const { data: feedRow, error: feedErr } = await service
      .from("ai_daily_feed")
      .insert({
        feed_date: date,
        headline: item.headline,
        summary: item.summary,
        category: item.category,
        source_label: item.source_label,
        source_id: source.id,
        source_url: article.url,
      })
      .select("id")
      .single()
    if (feedErr || !feedRow) {
      return { ok: false, source: source.name, error: feedErr?.message ?? "feed insert failed" }
    }

    const { error: tipErr } = await service.from("ai_daily_tips").insert({
      feed_id: feedRow.id,
      title: item.tip.title,
      why_it_matters: item.tip.why_it_matters,
      prompt: item.tip.prompt,
      scenario: item.tip.scenario,
      before_text: item.tip.before_text,
      after_text: item.tip.after_text,
      tools: item.tip.tools,
      time_saved: item.tip.time_saved,
      confidence: item.tip.confidence,
      citations: item.tip.citations,
      source_url: article.url,
      source_title: article.title,
      source_publisher: article.publisher ?? source.publisher,
      source_published_at: article.publishedAt,
    })
    if (tipErr) return { ok: false, source: source.name, error: tipErr.message }

    await service
      .from("ai_daily_news_sources")
      .update({ last_scraped_at: new Date().toISOString() })
      .eq("id", source.id)

    return { ok: true, source: source.name, headline: item.headline }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log("[v0] cron error for", source.name, msg)
    return { ok: false, source: source.name, error: msg }
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()
  const date = todayDateString()

  // Skip if today's feed already exists
  const { count: existingCount } = await service
    .from("ai_daily_feed")
    .select("id", { count: "exact", head: true })
    .eq("feed_date", date)

  if ((existingCount ?? 0) > 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feed already exists for today", count: existingCount })
  }

  // Mark anything older than 30 days as stale (housekeeping)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  await service
    .from("ai_daily_tips")
    .update({ is_stale: true })
    .lt("source_published_at", cutoff)
    .eq("is_stale", false)

  // Get active sources
  const { data: sources } = await service
    .from("ai_daily_news_sources")
    .select("id, name, url, publisher, vendor")
    .eq("is_active", true)

  if (!sources || sources.length === 0) {
    return NextResponse.json({ ok: false, error: "No active news sources configured" }, { status: 500 })
  }

  // Process sources IN PARALLEL — they're fully independent and Tavily/Firecrawl
  // can handle the concurrency. This brings total time from ~45-60s sequential
  // down to ~15-20s parallel for 5 sources.
  const targets = (sources as NewsSource[]).slice(0, SOURCE_LIMIT)
  const results = await Promise.allSettled(targets.map((s) => processSource(s, date, service)))

  const inserted: Array<{ source: string; headline: string }> = []
  const failed: Array<{ source: string; error: string }> = []
  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value.ok) inserted.push({ source: r.value.source, headline: r.value.headline })
      else failed.push({ source: r.value.source, error: r.value.error })
    } else {
      failed.push({ source: "unknown", error: String(r.reason).slice(0, 200) })
    }
  }

  // If we wrote at least one new tip, purge BOTH cache tags immediately so the
  // hero eyebrow's "Last agent run: HH:MM MYT" timestamp and the Live Agent
  // Activity strip's counts move in lockstep — the cron-health-checklist §4
  // calls out a desync here as a failure mode ("Eyebrow timestamp ≠ Live
  // Agent Activity strip timestamp"). Both surfaces read live data; only the
  // caches need to be told the data has moved.
  if (inserted.length > 0) {
    try {
      revalidateTag(FEED_CACHE_TAG)
      revalidateTag(AGENT_STATUS_CACHE_TAG)
    } catch (err) {
      console.log("[v0] revalidateTag failed:", err)
    }
  }

  return NextResponse.json({
    ok: true,
    date,
    inserted_count: inserted.length,
    failed_count: failed.length,
    inserted,
    failed,
  })
}
