import { createClient } from "@/lib/supabase/server"
import { generateTipsFromArticle } from "@/lib/ai/generate"
import { NextResponse } from "next/server"

export const maxDuration = 60

async function fetchUrlText(url: string) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; AIDailyBot/1.0)" },
    })
    if (!res.ok) return null
    const html = await res.text()
    // Strip tags and collapse whitespace - quick heuristic, good enough for news articles
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return text.slice(0, 15000)
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const { input } = (await req.json()) as { input: string }
  if (!input || input.trim().length < 20) {
    return NextResponse.json({ error: "Please provide an article URL or paste at least a short excerpt." }, { status: 400 })
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

  // Resolve URL → text if it looks like a URL
  let articleText = input.trim()
  if (/^https?:\/\//i.test(articleText) && articleText.length < 2048) {
    const fetched = await fetchUrlText(articleText)
    if (fetched && fetched.length > 200) {
      articleText = fetched
    }
  }

  try {
    const result = await generateTipsFromArticle({ articleText, role, tools })

    // If logged in: persist tips + history
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
      const { data: inserted } = await supabase.from("ai_daily_tips").insert(tipRows).select("id")
      const tipIds = (inserted ?? []).map((r) => r.id)
      await supabase.from("ai_daily_history").insert({
        user_id: user.id,
        kind: "paste",
        input: input.slice(0, 2000),
        summary: result.summary,
        tip_ids: tipIds,
      })
      return NextResponse.json({ summary: result.summary, tips: inserted?.length ? await refetch(supabase, tipIds) : [] })
    }

    // Anonymous: return tips inline (not persisted)
    return NextResponse.json({
      summary: result.summary,
      tips: result.tips.map((t, i) => ({ ...t, id: `tmp-${i}` })),
    })
  } catch (err) {
    console.log("[v0] translate error:", err)
    return NextResponse.json({ error: "Failed to generate tips. Try again." }, { status: 500 })
  }
}

async function refetch(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  const { data } = await supabase.from("ai_daily_tips").select("*").in("id", ids)
  return data ?? []
}
