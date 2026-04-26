/**
 * Manually trigger the daily feed cron RIGHT NOW.
 *
 * Mirrors the logic in `app/api/cron/daily-feed/route.ts` but runs as a
 * standalone Node script so we can bootstrap the very first edition without
 * waiting for the 04:00 MYT (20:00 UTC) cron tick.
 *
 * Usage:
 *   npx tsx scripts/run-first-edition.ts          # generates today's edition
 *   FORCE=1 npx tsx scripts/run-first-edition.ts  # ignore "already exists" guard
 *
 * Idempotent: re-running on a day that already has a feed is a no-op unless
 * FORCE=1 is set. URL dedup is enforced regardless (no two feed items with the
 * same source_url across all of history).
 */

import { createServiceClient } from "../lib/supabase/service"
import { tavilySearch } from "../lib/mcp/tavily"
import { scrapeUrl } from "../lib/mcp/firecrawl"
import { generateTipFromNewsItem } from "../lib/ai/generate"

const SOURCE_LIMIT = Number.parseInt(process.env.SOURCE_LIMIT ?? "5", 10)
const FORCE = process.env.FORCE === "1"

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
    console.log(`[v0]   ✗ tavily failed for ${source.name}:`, err instanceof Error ? err.message : err)
    return null
  }
}

async function processSource(
  source: NewsSource,
  date: string,
  service: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true; source: string; headline: string } | { ok: false; source: string; error: string }> {
  console.log(`[v0] → ${source.name} (${source.publisher})`)
  try {
    const articleUrl = await findRecentArticleFor(source)
    if (!articleUrl) return { ok: false, source: source.name, error: "no recent article found" }
    console.log(`[v0]   • article: ${articleUrl}`)

    // De-dup against entire history, not just today
    const { data: existingFeed } = await service
      .from("ai_daily_feed")
      .select("id")
      .eq("source_url", articleUrl)
      .maybeSingle()
    if (existingFeed) return { ok: false, source: source.name, error: "already covered (URL dedup)" }

    const article = await scrapeUrl(articleUrl)
    if (!article.markdown || article.markdown.length < 300) {
      return { ok: false, source: source.name, error: `article body too short (${article.markdown?.length ?? 0} chars)` }
    }
    console.log(`[v0]   • scraped: "${article.title}" (${article.markdown.length} chars)`)

    const item = await generateTipFromNewsItem({ article, vendor: source.vendor })
    console.log(`[v0]   • tip: "${item.tip.title}"`)

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
    return { ok: false, source: source.name, error: msg }
  }
}

async function main() {
  console.log("[v0] ── First edition bootstrap ──")
  const service = createServiceClient()
  const date = todayDateString()
  console.log(`[v0] target feed_date: ${date}`)

  if (!FORCE) {
    const { count: existingCount } = await service
      .from("ai_daily_feed")
      .select("id", { count: "exact", head: true })
      .eq("feed_date", date)
    if ((existingCount ?? 0) > 0) {
      console.log(`[v0] feed for ${date} already exists (${existingCount} items). Set FORCE=1 to bypass.`)
      return
    }
  }

  // Mark anything older than 30 days as stale (housekeeping match with cron route)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  await service
    .from("ai_daily_tips")
    .update({ is_stale: true })
    .lt("source_published_at", cutoff)
    .eq("is_stale", false)

  const { data: sources } = await service
    .from("ai_daily_news_sources")
    .select("id, name, url, publisher, vendor")
    .eq("is_active", true)

  if (!sources || sources.length === 0) {
    console.log("[v0] FATAL: no active news sources configured.")
    process.exit(1)
  }
  const targets = (sources as NewsSource[]).slice(0, SOURCE_LIMIT)
  console.log(`[v0] processing ${targets.length}/${sources.length} sources in parallel...\n`)

  const t0 = Date.now()
  const results = await Promise.allSettled(targets.map((s) => processSource(s, date, service)))
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

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

  console.log(`\n[v0] ── Done in ${elapsed}s ──`)
  console.log(`[v0] ✓ inserted: ${inserted.length}`)
  for (const i of inserted) console.log(`[v0]   ✓ ${i.source}: ${i.headline}`)
  if (failed.length > 0) {
    console.log(`[v0] ✗ failed: ${failed.length}`)
    for (const f of failed) console.log(`[v0]   ✗ ${f.source}: ${f.error}`)
  }

  // Note: revalidateTag() can't be called from a standalone Node script — it
  // needs the Next.js runtime context. The strip will catch up within its
  // 5-minute TTL, or you can hard-refresh `/today` to force a re-fetch.
}

main().catch((err) => {
  console.error("[v0] FATAL:", err)
  process.exit(1)
})
