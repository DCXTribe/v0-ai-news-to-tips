import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { tavilySearch } from "@/lib/mcp/tavily"
import { scrapeUrl } from "@/lib/mcp/firecrawl"
import { generateTipFromNewsItem } from "@/lib/ai/generate"

// 60s is the max allowed on the Vercel Hobby plan. We process sources sequentially
// and cap to whatever fits comfortably in this window (see SOURCE_LIMIT below).
// If you upgrade to Pro, you can safely raise this to 300.
export const maxDuration = 60
export const dynamic = "force-dynamic"

const SOURCE_LIMIT = 3 // process up to N sources per cron invocation

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
  // Use Tavily restricted to the source's domain to find a fresh article URL
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

  const inserted: Array<{ source: string; headline: string }> = []
  const failed: Array<{ source: string; error: string }> = []

  // Limit how many sources we process per invocation to stay under maxDuration.
  // Sources we don't reach today will be picked up tomorrow (and the housekeeping
  // step above marks anything older than 30 days as stale anyway).
  for (const source of sources.slice(0, SOURCE_LIMIT) as NewsSource[]) {
    try {
      const articleUrl = await findRecentArticleFor(source)
      if (!articleUrl) {
        failed.push({ source: source.name, error: "no recent article found" })
        continue
      }

      // Skip if we already covered this URL
      const { data: existingFeed } = await service
        .from("ai_daily_feed")
        .select("id")
        .eq("source_url", articleUrl)
        .maybeSingle()
      if (existingFeed) {
        failed.push({ source: source.name, error: "already covered" })
        continue
      }

      const article = await scrapeUrl(articleUrl)
      if (!article.markdown || article.markdown.length < 300) {
        failed.push({ source: source.name, error: "article body too short" })
        continue
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
        failed.push({ source: source.name, error: feedErr?.message ?? "feed insert failed" })
        continue
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
      if (tipErr) {
        failed.push({ source: source.name, error: tipErr.message })
        continue
      }

      await service
        .from("ai_daily_news_sources")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", source.id)

      inserted.push({ source: source.name, headline: item.headline })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log("[v0] cron error for", source.name, msg)
      failed.push({ source: source.name, error: msg })
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
