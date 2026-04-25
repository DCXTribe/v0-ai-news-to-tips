import { createClient } from "@/lib/supabase/server"
import { generateTipsFromQuestion } from "@/lib/ai/generate"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question: string }
  if (!question || question.trim().length < 5) {
    return NextResponse.json({ error: "Ask a question with at least a few words." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null
  let tools: string[] = []
  if (user) {
    const { data: profile } = await supabase
      .from("ai_daily_profiles")
      .select("role, tools")
      .eq("id", user.id)
      .maybeSingle()
    if (profile) {
      role = profile.role
      tools = profile.tools ?? []
    }
  }

  try {
    const result = await generateTipsFromQuestion({ question, role, tools })

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

    return NextResponse.json({
      summary: result.summary,
      tips: result.tips.map((t, i) => ({ ...t, id: `tmp-${i}` })),
    })
  } catch (err) {
    console.log("[v0] ask error:", err)
    return NextResponse.json({ error: "Failed to generate tips. Try again." }, { status: 500 })
  }
}
