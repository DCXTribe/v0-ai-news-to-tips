import { createClient } from "@/lib/supabase/server"
import { tavilySearch } from "@/lib/mcp/tavily"
import { generateToolRecommendation } from "@/lib/ai/generate"
import { consumeAnonUsage, getAnonUsageState } from "@/lib/anon-usage"

export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: { task?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const task = (body.task ?? "").trim()
  if (task.length < 8) {
    return Response.json({ error: "Describe the task in a bit more detail." }, { status: 400 })
  }
  if (task.length > 800) {
    return Response.json({ error: "Task description is too long (max 800 chars)." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Anonymous quota gate — see lib/anon-usage.ts. Logged-in users bypass.
  if (!user) {
    const state = await getAnonUsageState()
    if (!state.remaining.advisor) {
      return Response.json(
        {
          error: "You've used your free recommendation this week. Sign up free to keep going.",
          code: "anon_quota_reached",
          anon: { remaining: state.remaining, resetsAt: state.resetsAt },
        },
        { status: 429 },
      )
    }
  }

  // Pull the user's available tools, role, and skill level from their profile (if any)
  let availableTools: string[] | null = null
  let role: string | null = null
  let skillLevel: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("ai_daily_profiles")
      .select("role, tools, skill_level")
      .eq("id", user.id)
      .maybeSingle()
    availableTools = (profile?.tools as string[] | null) ?? null
    role = (profile?.role as string | null) ?? null
    skillLevel = (profile?.skill_level as string | null) ?? null
  }

  // Ground the recommendation in current sources via Tavily
  let answer: string | null = null
  let results: Awaited<ReturnType<typeof tavilySearch>>["results"] = []
  try {
    const search = await tavilySearch(`Best AI tool to ${task} 2026 ChatGPT Copilot Gemini Claude Perplexity`, {
      maxResults: 6,
      days: 365,
    })
    answer = search.answer
    results = search.results
  } catch (err) {
    console.error("[advisor] Tavily failed, continuing ungrounded", err)
  }

  let output
  try {
    output = await generateToolRecommendation({
      task,
      searchAnswer: answer,
      searchResults: results,
      availableTools,
      role,
      skillLevel,
    })
  } catch (err) {
    console.error("[advisor] generation failed", err)
    return Response.json({ error: "We couldn't generate a recommendation. Please try again." }, { status: 500 })
  }

  // Persist to history if logged in (kind = 'advisor')
  if (user) {
    try {
      await supabase.from("ai_daily_history").insert({
        user_id: user.id,
        kind: "advisor",
        input: task,
        summary: output.task_summary,
        tip_ids: [],
      })
    } catch (err) {
      console.error("[advisor] history insert failed", err)
      // Non-blocking
    }
  }

  // Anonymous: consume free use after successful generation.
  let anon: { remaining: Record<string, boolean>; resetsAt: number } | undefined
  if (!user) {
    const newState = await consumeAnonUsage("advisor")
    anon = { remaining: newState.remaining, resetsAt: newState.resetsAt }
  }

  return Response.json({ ...output, scoped_to_toolkit: !!availableTools, anon })
}
