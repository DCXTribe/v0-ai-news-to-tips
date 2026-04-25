import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { TipCard, type Tip } from "@/components/tip-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, FileText, MessageCircleQuestion, BookOpen, Sparkles } from "lucide-react"

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
  source_url: string | null
  ai_daily_tips: Tip[]
}

async function getFeed(): Promise<{ items: FeedItem[]; date: string; isToday: boolean }> {
  const today = todayDateString()
  const service = createServiceClient()

  const { data: todays } = await service
    .from("ai_daily_feed")
    .select("*, ai_daily_tips(*)")
    .eq("feed_date", today)
    .order("created_at", { ascending: true })

  if (todays && todays.length > 0) {
    return { items: todays as FeedItem[], date: today, isToday: true }
  }

  const { data: latest } = await service
    .from("ai_daily_feed")
    .select("feed_date")
    .order("feed_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latest) return { items: [], date: today, isToday: true }

  const { data: items } = await service
    .from("ai_daily_feed")
    .select("*, ai_daily_tips(*)")
    .eq("feed_date", latest.feed_date)
    .order("created_at", { ascending: true })

  return {
    items: (items ?? []) as FeedItem[],
    date: latest.feed_date,
    isToday: false,
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
  const [{ items: feed, date: feedDate, isToday }, savedSet] = await Promise.all([getFeed(), getSavedTipIds()])
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
  const feedDateLabel = new Date(feedDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden
            style={{
              background:
                "radial-gradient(60% 60% at 20% 0%, oklch(0.95 0.06 15 / 0.6) 0%, transparent 60%), radial-gradient(50% 50% at 90% 10%, oklch(0.93 0.04 280 / 0.7) 0%, transparent 60%)",
            }}
          />
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-24">
            <div className="flex flex-col gap-6 text-balance">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                {todayLabel} edition
              </span>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                AI news, translated into things you can <span className="text-primary">actually do today</span>.
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                Every morning we read the official OpenAI, Microsoft, Google, Anthropic and Perplexity blogs and turn
                what&apos;s new into copy-paste prompts and quick workflows for your role &mdash; with the source linked
                on every tip.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild size="lg" className="rounded-xl shadow-[0_4px_20px_rgba(184,0,53,0.25)]">
                  <Link href="#today">
                    See today&apos;s tips <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl">
                  <Link href="/translate">
                    <FileText className="h-4 w-4" aria-hidden />
                    Translate an article
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-xl">
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
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {isToday ? "Today's tips" : "Latest edition"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {feed.length > 0
                  ? `${feed.length} tip${feed.length === 1 ? "" : "s"} · ${feedDateLabel}${
                      isToday ? "" : " (today's edition publishes overnight)"
                    }`
                  : "Awaiting first edition."}
              </p>
            </div>
            {user && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/library">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  My library
                </Link>
              </Button>
            )}
          </div>

          {feed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-low/60 p-10 text-center">
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                The first edition is being prepared. The daily feed publishes overnight by reading official AI vendor
                blogs. In the meantime,{" "}
                <Link href="/ask" className="font-medium text-foreground underline-offset-4 hover:underline">
                  ask a question
                </Link>{" "}
                or{" "}
                <Link href="/translate" className="font-medium text-foreground underline-offset-4 hover:underline">
                  translate an article
                </Link>{" "}
                to generate tips on demand.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
        <section className="border-t border-border/60 bg-surface-low/50">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3 md:px-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-semibold tracking-tight">Translate any article</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Paste a URL or article text. We scrape it cleanly and turn it into 3-5 usable tips for your role.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href="/translate">
                  Translate <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-semibold tracking-tight">Ask a question</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Get prompts grounded in current docs and articles &mdash; with sources cited on every answer.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href="/ask">
                  Ask <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
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
      <MobileBottomNav />
    </div>
  )
}
