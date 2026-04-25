import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { generateDailyFeed } from "@/lib/ai/generate"
import { TipCard, type Tip } from "@/components/tip-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, FileText, MessageCircleQuestion, BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

type FeedItem = {
  id: string
  feed_date: string
  headline: string
  summary: string
  category: string | null
  source_label: string | null
  ai_daily_tips: Tip[]
}

async function getFeed(): Promise<FeedItem[]> {
  const date = todayDateString()
  const service = createServiceClient()

  const { data: existing } = await service
    .from("ai_daily_feed")
    .select("*, ai_daily_tips(*)")
    .eq("feed_date", date)
    .order("created_at", { ascending: true })

  if (existing && existing.length > 0) return existing as FeedItem[]

  // Generate today's feed on first visit and persist
  try {
    const generated = await generateDailyFeed()
    for (const item of generated) {
      const { data: feedRow } = await service
        .from("ai_daily_feed")
        .insert({
          feed_date: date,
          headline: item.headline,
          summary: item.summary,
          category: item.category,
          source_label: item.source_label,
        })
        .select("id")
        .single()
      if (!feedRow) continue
      await service.from("ai_daily_tips").insert({
        feed_id: feedRow.id,
        title: item.tip.title,
        why_it_matters: item.tip.why_it_matters,
        prompt: item.tip.prompt,
        scenario: item.tip.scenario,
        before_text: item.tip.before_text,
        after_text: item.tip.after_text,
        tools: item.tip.tools,
        time_saved: item.tip.time_saved,
      })
    }
    const { data: fresh } = await service
      .from("ai_daily_feed")
      .select("*, ai_daily_tips(*)")
      .eq("feed_date", date)
      .order("created_at", { ascending: true })
    return (fresh ?? []) as FeedItem[]
  } catch (err) {
    console.log("[v0] home feed error:", err)
    return []
  }
}

async function getSavedTipIds(): Promise<Set<string>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Set()
  const { data } = await supabase.from("ai_daily_saves").select("tip_id").eq("user_id", user.id)
  return new Set((data ?? []).map((r) => r.tip_id))
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [feed, savedSet] = await Promise.all([getFeed(), getSavedTipIds()])
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
            <div className="flex flex-col gap-6 text-balance">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">{today} edition</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                AI news, translated into things you can actually do today.
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Every day we turn the latest AI updates into copy-paste prompts and quick workflows for Microsoft
                Copilot, ChatGPT, Gemini, Claude and Perplexity — for your role, in plain English.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href="#today">
                    See today&apos;s tips <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/translate">
                    <FileText className="h-4 w-4" aria-hidden />
                    Translate an article
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/ask">
                    <MessageCircleQuestion className="h-4 w-4" aria-hidden />
                    Ask a question
                  </Link>
                </Button>
              </div>
              {!user && (
                <p className="text-sm text-muted-foreground">
                  No account needed to browse.{" "}
                  <Link href="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Sign up free
                  </Link>{" "}
                  to save tips and get a feed tailored to your role.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Today's feed */}
        <section id="today" className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Today&apos;s tips</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {feed.length} tip{feed.length === 1 ? "" : "s"} generated for {today}.
              </p>
            </div>
            {user && (
              <Button asChild variant="outline" size="sm">
                <Link href="/library">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  My library
                </Link>
              </Button>
            )}
          </div>

          {feed.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Today&apos;s feed isn&apos;t ready yet. Refresh in a moment, or{" "}
                <Link href="/ask" className="font-medium text-foreground underline-offset-4 hover:underline">
                  ask a question
                </Link>{" "}
                to generate tips on demand.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {feed.flatMap((item) =>
                (item.ai_daily_tips ?? []).map((tip) => (
                  <TipCard
                    key={tip.id}
                    tip={tip}
                    newsHeadline={item.headline}
                    newsCategory={item.category}
                    isAuthed={!!user}
                    isSaved={savedSet.has(tip.id)}
                  />
                )),
              )}
            </div>
          )}
        </section>

        {/* CTA strip */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3 md:px-6">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Translate any article</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Paste a URL or article text. We turn it into 3-5 usable tips for your role and tools.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href="/translate">
                  Translate <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Ask a question</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                &quot;How do I use Copilot to summarize a Teams meeting?&quot; Get prompts and steps in seconds.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href="/ask">
                  Ask <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Build your playbook</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Save the tips you actually used. Keep a personal library of prompts that work for your job.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href={user ? "/library" : "/auth/sign-up"}>
                  {user ? "Open library" : "Create account"} <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
