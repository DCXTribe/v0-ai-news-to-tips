import { createClient } from "@/lib/supabase/server"
import { generateTipsFromQuestion } from "@/lib/ai/generate"
import { tavilySearch } from "@/lib/mcp/tavily"
import { consumeAnonUsage, getAnonUsageState } from "@/lib/anon-usage"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  const { question, includeYoutube } = (await req.json()) as { question: string; includeYoutube?: boolean }
  if (!question || question.trim().length < 5) {
    return NextResponse.json({ error: "Ask a question with at least a few words." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Anonymous quota gate — see lib/anon-usage.ts. Logged-in users bypass.
  if (!user) {
    const state = await getAnonUsageState()
    if (!state.remaining.ask) {
      return NextResponse.json(
        {
          error: "You've used your free question this week. Sign up free to keep going.",
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

  // 1. Search the web for grounding. If `includeYoutube` was requested, run a
  //    second YouTube-only Tavily query and merge the results so the grounding
  //    pool covers articles AND video walkthroughs.
  let searchAnswer: string | null = null
  let searchResults: Awaited<ReturnType<typeof tavilySearch>>["results"] = []
  try {
    const r = await tavilySearch(question, { maxResults: 6, days: 90 })
    searchAnswer = r.answer
    searchResults = r.results
    if (includeYoutube) {
      try {
        const yt = await tavilySearch(question, {
          maxResults: 4,
          days: 365,
          includeDomains: ["youtube.com"],
        })
        // De-dupe by URL
        const seen = new Set(searchResults.map((s) => s.url))
        for (const v of yt.results) if (!seen.has(v.url)) searchResults.push(v)
      } catch (err) {
        console.log("[v0] tavily youtube search failed (continuing without it):", err)
      }
    }
  } catch (err) {
    console.log("[v0] tavily search failed (continuing without grounding):", err)
  }

  // 2. Generate grounded tips
  let result: Awaited<ReturnType<typeof generateTipsFromQuestion>>
  try {
    result = await generateTipsFromQuestion({
      question,
      searchAnswer,
      searchResults,
      role,
      tools,
      skillLevel,
    })
  } catch (err) {
    console.log("[v0] ask generation error:", err)
    return NextResponse.json({ error: "Failed to generate tips. Try again." }, { status: 500 })
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
    }))
    const { data: inserted } = await supabase.from("ai_daily_tips").insert(tipRows).select("*")
    const tipIds = (inserted ?? []).map((r) => r.id)
    await supabase.from("ai_daily_history").insert({
      user_id: user.id,
      kind: "ask",
      input: question.slice(0, 2000),
      summary: result.summary,
      tip_ids: tipIds,
    })
    return NextResponse.json({ summary: result.summary, tips: inserted ?? [] })
  }

  // Anonymous: consume the free use only after successful generation.
  const newState = await consumeAnonUsage("ask")
  return NextResponse.json({
    summary: result.summary,
    tips: result.tips.map((t, i) => ({ ...t, id: `tmp-${i}` })),
    anon: { remaining: newState.remaining, resetsAt: newState.resetsAt },
  })
}
