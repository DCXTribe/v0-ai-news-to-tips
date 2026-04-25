import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { TipCard } from "@/components/tip-card"
import { TodayFeedGrid } from "@/components/today-feed-grid"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, PackageOpen, MessageCircleQuestion, BookOpen, Sparkles, Compass } from "lucide-react"
import { getCachedFeed } from "@/lib/feed"

// Note: no `force-dynamic`. The page is naturally dynamic because it reads
// auth cookies, but the heavy feed query is cached via unstable_cache and
// invalidated by the cron the moment a new edition is written.
export const maxDuration = 60

export default async function HomePage() {
  // Logged-in users have a dedicated post-login surface at /today with filters,
  // personalization banner, and archive — redirect them away from this marketing page.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect("/today")

  // Anonymous users get the marketing landing with sample today's tips.
  const { items: feed, date: feedDate, isToday } = await getCachedFeed()
  const savedSet = new Set<string>()

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
                "radial-gradient(55% 55% at 18% 0%, oklch(0.94 0.05 32 / 0.7) 0%, transparent 60%), radial-gradient(45% 45% at 88% 8%, oklch(0.93 0.04 180 / 0.55) 0%, transparent 60%)",
            }}
          />
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-24">
            <div className="flex flex-col gap-6 text-balance">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                {todayLabel} edition
              </span>
              <h1 className="max-w-3xl text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-6xl md:leading-[1.05]">
                AI news, unpacked into things you can <span className="text-primary">actually do today</span>.
              </h1>
              <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                Every morning we read the official OpenAI, Microsoft, Google, Anthropic and Perplexity blogs and turn
                what&apos;s new into copy-paste prompts and quick workflows for your role &mdash; with the source linked
                on every tip.
              </p>
              <div className="grid grid-cols-1 gap-2 pt-2 sm:flex sm:flex-wrap sm:gap-3">
                <Button asChild size="lg" className="w-full rounded-xl shadow-[var(--shadow-brand)] sm:w-auto">
                  <Link href="#today">
                    See today&apos;s tips <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full rounded-xl sm:w-auto">
                  <Link href="/advisor">
                    <Compass className="h-4 w-4" aria-hidden />
                    Pick a tool
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="w-full rounded-xl sm:w-auto">
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
        <section id="today" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
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
                <Link href="/unpack" className="font-medium text-foreground underline-offset-4 hover:underline">
                  unpack an article
                </Link>{" "}
                to generate tips on demand.
              </p>
            </div>
          ) : (
            <TodayFeedGrid>
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
            </TodayFeedGrid>
          )}
        </section>

        {/* CTA strip — 4 surfaces: Unpack, Advisor (flagship), Ask, Library */}
        <section className="border-t border-border/60 bg-surface-low/50">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:gap-6 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary">
                <PackageOpen className="h-4 w-4" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">Unpack an article</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Paste a URL or article text. We scrape it cleanly and turn it into 3-5 usable tips for your role.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href="/unpack">
                  Unpack <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 shadow-[var(--shadow-brand-soft)]">
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Compass className="h-4 w-4" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                Pick the right tool <span className="text-primary">·</span> new
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Describe a task. We&apos;ll recommend the best AI from your toolkit, with a copy-paste prompt and what
                to avoid.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href="/advisor">
                  Advisor <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary">
                <MessageCircleQuestion className="h-4 w-4" aria-hidden />
              </div>
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
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary">
                <BookOpen className="h-4 w-4" aria-hidden />
              </div>
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
