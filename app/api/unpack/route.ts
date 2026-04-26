import { createClient } from "@/lib/supabase/server"
import { generateTipsFromArticle } from "@/lib/ai/generate"
import { scrapeUrl, type FirecrawlScrapeResult } from "@/lib/mcp/firecrawl"
import { consumeAnonUsage, getAnonUsageState } from "@/lib/anon-usage"
import { NextResponse } from "next/server"

export const maxDuration = 60

function isUrl(s: string) {
  return /^https?:\/\//i.test(s.trim()) && s.trim().length < 2048
}

export async function POST(req: Request) {
  const { input } = (await req.json()) as { input: string }
  if (!input || input.trim().length < 20) {
    return NextResponse.json(
      { error: "Please provide an article URL or paste at least a short excerpt." },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Anonymous quota: 1 free use per rolling 7-day window. Check BEFORE
  // doing any expensive work (scrape + LLM) so blocked users get a fast
  // 429 with a clear sign-up path. Logged-in users skip this entirely.
  if (!user) {
    const state = await getAnonUsageState()
    if (!state.remaining.unpack) {
      return NextResponse.json(
        {
          error: "You've used your free unpack this week. Sign up free to keep going.",
          code: "anon_quota_reached",
          anon: { remaining: state.remaining, resetsAt: state.resetsAt },
        },
        { status: 429 },
      )
    }
  }

  let role: string | null = null
  let tools: string[] = []
  let skillLevel: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("ai_daily_profiles")
      .select("role, tools, skill_level")
      .eq("id", user.id)
      .maybeSingle()
    if (profile) {
      role = profile.role
      tools = profile.tools ?? []
      skillLevel = profile.skill_level ?? null
    }
  }

  // 1. Build a FirecrawlScrapeResult — either by scraping a URL or wrapping pasted text
  let article: FirecrawlScrapeResult
  const trimmed = input.trim()
  if (isUrl(trimmed)) {
    try {
      article = await scrapeUrl(trimmed)
    } catch (err) {
      console.log("[v0] firecrawl scrape failed:", err)
      return NextResponse.json(
        {
          error:
            "Couldn't fetch that URL. Paste the article text directly, or try another link.",
        },
        { status: 502 },
      )
    }
  } else {
    article = {
      url: "user-pasted",
      title: "Pasted content",
      description: null,
      markdown: trimmed.slice(0, 12000),
      publisher: null,
      publishedAt: null,
    }
  }

  // 2. Generate grounded tips
  let result: Awaited<ReturnType<typeof generateTipsFromArticle>>
  try {
    result = await generateTipsFromArticle({ article, role, tools, skillLevel })
  } catch (err) {
    console.log("[v0] translate generation error:", err)
    return NextResponse.json({ error: "Failed to generate tips. Try again." }, { status: 500 })
  }

  const sourceFields =
    article.url === "user-pasted"
      ? {}
      : {
          source_url: article.url,
          source_title: article.title,
          source_publisher: article.publisher,
          source_published_at: article.publishedAt,
        }

  // 3. Persist for logged-in users
  if (user) {
    const tipRows = result.tips.map((t) => ({
      owner_id: user.id,
      title: t.title,
      why_it_matters: t.why_it_matters,
      prompt: t.prompt,
      scenario: t.scenario,
      before_text: t.before_text,
      after_text: t.after_text,
      tools: t.tools,
      roles: role ? [role] : [],
      time_saved: t.time_saved,
      confidence: t.confidence,
      citations: t.citations,
      ...sourceFields,
    }))

    const { data: inserted } = await supabase.from("ai_daily_tips").insert(tipRows).select("*")
    const tipIds = (inserted ?? []).map((r) => r.id)
    await supabase.from("ai_daily_history").insert({
      user_id: user.id,
      kind: "paste",
      input: trimmed.slice(0, 2000),
      summary: result.summary,
      tip_ids: tipIds,
    })
    return NextResponse.json({
      summary: result.summary,
      source: article.url === "user-pasted" ? null : { url: article.url, title: article.title, publisher: article.publisher },
      tips: inserted ?? [],
    })
  }

  // Anonymous: return inline (not persisted) and consume the free use.
  // Cookie write happens after a successful generation so failures don't
  // burn the user's single free use.
  const newState = await consumeAnonUsage("unpack")
  return NextResponse.json({
    summary: result.summary,
    source: article.url === "user-pasted" ? null : { url: article.url, title: article.title, publisher: article.publisher },
    tips: result.tips.map((t, i) => ({ ...t, id: `tmp-${i}`, ...sourceFields })),
    anon: { remaining: newState.remaining, resetsAt: newState.resetsAt },
  })
}
