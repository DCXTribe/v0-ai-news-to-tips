import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { TipCard } from "@/components/tip-card"
import { TodayFeedGrid } from "@/components/today-feed-grid"
import { AgentActivityStrip } from "@/components/agent-activity-strip"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  PackageOpen,
  MessageCircleQuestion,
  BookOpen,
  Sparkles,
  Compass,
  Globe2,
  MapPin,
  BookOpenCheck,
  Wrench,
  Cpu,
  Search,
  Briefcase,
} from "lucide-react"
import { getCachedFeed } from "@/lib/feed"
import { getAgentStatus } from "@/lib/agent-status"

// Note: no `force-dynamic`. The page is naturally dynamic because it reads
// auth cookies, but the heavy feed query is cached via unstable_cache and
// invalidated by the cron the moment a new edition is written.
export const maxDuration = 60

/** Format a timestamp as "HH:MM MYT" for the hero eyebrow. */
function formatLastRunMyt(iso: string | null): string {
  if (!iso) return "—"
  const myt = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000)
  const hh = String(myt.getUTCHours()).padStart(2, "0")
  const mm = String(myt.getUTCMinutes()).padStart(2, "0")
  return `${hh}:${mm} MYT`
}

const PIPELINE_STEPS = [
  {
    icon: BookOpenCheck,
    label: "Read",
    detail: "8 vendor blogs scanned every night at 04:00 MYT.",
    tag: "Firecrawl MCP",
  },
  {
    icon: Sparkles,
    label: "Distill",
    detail: "Articles deduplicated, summarized, and turned into 5–8 tips.",
    tag: "Vercel AI Gateway",
  },
  {
    icon: Briefcase,
    label: "Personalize",
    detail: "Tips ranked for your role, toolkit, and skill level.",
    tag: "Supabase + LLM",
  },
  {
    icon: Search,
    label: "Ground",
    detail: "Every on-demand answer carries a cited source.",
    tag: "Tavily MCP",
  },
] as const

const WESTERN_SOURCES = ["OpenAI", "Anthropic", "Google", "Microsoft", "Perplexity"]
const APAC_SOURCES = ["Moonshot AI · Kimi", "Alibaba · Qwen", "DeepSeek"]
const TOOL_STACK = ["v0", "Vercel AI Gateway", "Firecrawl MCP", "Tavily MCP", "Supabase"]

export default async function HomePage() {
  // Logged-in users have a dedicated post-login surface at /today with filters,
  // personalization banner, and archive — redirect them away from this marketing page.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect("/today")

  // Anonymous users get the marketing landing with sample today's tips and
  // the live agent status. Run both in parallel — both are cheap (cached).
  const [{ items: feed, date: feedDate, isToday }, agentStatus] = await Promise.all([
    getCachedFeed(),
    getAgentStatus(),
  ])
  const savedSet = new Set<string>()

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const feedDateLabel = new Date(feedDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const lastRunMyt = formatLastRunMyt(agentStatus.lastRunAt)

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — repositioned for the contest:
            agent-forward H1, eyebrow includes last-run timestamp pulled live
            from the database, lede names every vendor + every on-demand agent. */}
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
              <span className="inline-flex w-fit flex-wrap items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                Today&apos;s edition · {todayLabel}
                <span className="text-primary/40">·</span>
                Last agent run: {lastRunMyt}
              </span>
              <h1 className="max-w-3xl text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-6xl md:leading-[1.05]">
                Your <span className="text-primary">overnight</span> AI research agent.
              </h1>
              <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                While you sleep, it reads the official OpenAI, Anthropic, Google, Microsoft, Perplexity, Kimi, Qwen and
                DeepSeek blogs &mdash; scrapes, dedupes, and writes the day&apos;s edition before 6&nbsp;AM. Three more
                agents stand by: paste an article and one unpacks it, describe a task and one routes you to the right
                tool, ask a question and one searches the live web with sources cited.
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
                    Pick the right tool
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="w-full rounded-xl sm:w-auto">
                  <Link href="/ask">
                    <MessageCircleQuestion className="h-4 w-4" aria-hidden />
                    Ask a question
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No account needed to browse.{" "}
                <Link href="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Sign up free
                </Link>{" "}
                to save tips and tune the agent to your role.
              </p>
            </div>
          </div>
        </section>

        {/* Live Agent Activity strip — proves the autonomous behavior at a
            glance. Placed directly under the hero, above today's tips. */}
        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <AgentActivityStrip initial={agentStatus} />
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
                    isAuthed={false}
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
                <Link href="/auth/sign-up">
                  Create account <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pillars — three reasons Newt is different. Pillar 3 is the
            contest-edition rewrite: agent-forward, names Firecrawl + Tavily +
            Vercel AI Gateway, and preserves the post-contest brand stance
            ("driver's seat") so it ages cleanly. */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
            <h2 className="max-w-3xl text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Why Newt.
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Three things every other AI newsletter doesn&apos;t do.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {/* Pillar 1 — sourced */}
              <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-6">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
                  <BookOpenCheck className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">Sourced from the source.</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Every tip comes from an official AI vendor blog &mdash; OpenAI, Anthropic, Google, Microsoft,
                  Perplexity, Kimi, Qwen, DeepSeek. No middlemen. No paraphrased takes. The source link sits at the
                  bottom of every card so you can verify in one click.
                </p>
              </div>

              {/* Pillar 2 — toolkit */}
              <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-6">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
                  <Wrench className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">Tuned to your toolkit.</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Tell us what you actually use &mdash; ChatGPT Plus, Claude Pro, Gemini Advanced, Kimi, whatever. Tips,
                  tool picks, and prompts only suggest the AI you have. No upsell to tools you don&apos;t need.
                </p>
              </div>

              {/* Pillar 3 — agent (the contest rewrite). Highlighted card to
                  draw the eye to the agentic positioning. */}
              <div className="flex flex-col rounded-2xl border border-primary/25 bg-primary/5 p-6 shadow-[var(--shadow-brand-soft)]">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Cpu className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Agent works overnight. You ship by 10&nbsp;AM.
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  A scheduled agent reads eight vendor blogs every night, scrapes them through Firecrawl MCP,
                  deduplicates by URL, and writes the next day&apos;s edition through Vercel AI Gateway before you wake
                  up. Three on-demand agents stand by during the day: one unpacks any article you paste (Firecrawl +
                  LLM), one routes your task to the right tool from your toolkit (multi-step reasoning), one searches
                  the live web with Tavily MCP and grounds every answer in cited sources. You stay in the driver&apos;s
                  seat &mdash; the agents just hand you the keys faster.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How the agent works — 4-step pipeline. Horizontal on desktop,
            vertical stack on mobile. Each card shows step number, icon,
            label, body, and the MCP / tool that runs that step. */}
        <section className="border-t border-border/60 bg-surface-low/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
            <h2 className="max-w-3xl text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              How the agent works.
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              One scheduled agent. Three on-demand agents. All four built on v0, Vercel, and MCP.
            </p>

            <ol className="mt-8 grid gap-4 md:grid-cols-4">
              {PIPELINE_STEPS.map((step, i) => (
                <li
                  key={step.label}
                  className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Step {i + 1}
                    </span>
                  </div>
                  <step.icon className="h-6 w-6 text-foreground" aria-hidden />
                  <p className="text-base font-semibold leading-snug tracking-tight">{step.label}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                  <span className="mt-auto inline-flex w-fit items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
                    {step.tag}
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-6 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              The overnight agent runs whether anyone is watching. The on-demand agents &mdash; Unpack, Advisor, Ask
              &mdash; all reuse the same MCP tool stack: Firecrawl when an article needs scraping, Tavily when the live
              web needs searching, Vercel AI Gateway for every reasoning step. No black boxes. Every claim links back
              to its source.
            </p>
          </div>
        </section>

        {/* Where the tips come from — APAC differentiator (creativity lever).
            The bold lead sentence is the contest-edition headline; the
            sub-line preserves the existing "no middlemen" framing. Sources
            grouped Western vs APAC visually so the routing claim is obvious. */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
            <h2 className="max-w-3xl text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Where the tips come from.
            </h2>
            <p className="mt-3 max-w-3xl text-pretty text-base font-semibold leading-relaxed text-foreground sm:text-lg">
              The only AI assistant that fluently routes between Western and Asia-Pacific AI tools.
            </p>
            <p className="mt-1 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Eight official vendor blogs &mdash; five Western, three Asia-Pacific. No middlemen. No paraphrased takes.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Globe2 className="h-3 w-3" aria-hidden /> Western · {WESTERN_SOURCES.length}
                </div>
                <ul className="flex flex-wrap gap-2">
                  {WESTERN_SOURCES.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border border-border bg-background px-3 py-1 text-sm font-medium"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
                <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <MapPin className="h-3 w-3" aria-hidden /> Asia-Pacific · {APAC_SOURCES.length}
                </div>
                <ul className="flex flex-wrap gap-2">
                  {APAC_SOURCES.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border border-primary/30 bg-background px-3 py-1 text-sm font-medium"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tool-stack badge row — credibility signal for "technical execution"
            judging criterion. Sits directly above the footer, full-width,
            centered. Pure muted text + pills, not a CTA. */}
        <section className="border-t border-border/60 bg-surface-low/40">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Built with
            </p>
            <ul className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {TOOL_STACK.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
