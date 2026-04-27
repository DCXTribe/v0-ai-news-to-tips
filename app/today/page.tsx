import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { TipCard } from "@/components/tip-card"
import { TodayFilteredFeed, type FilterableTipCard } from "@/components/today-filtered-feed"
import { TodayArchive, type ArchiveDay } from "@/components/today-archive"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Sparkles, Briefcase, Wrench, GraduationCap, Clock } from "lucide-react"
import { getCachedFeed, getCachedArchive, type FeedItem } from "@/lib/feed"
import { getAgentStatus } from "@/lib/agent-status"
import { AgentActivityStrip } from "@/components/agent-activity-strip"
import { createClient } from "@/lib/supabase/server"
import { ROLES, SKILL_LEVELS, toolLabel } from "@/lib/constants"

export const maxDuration = 60

async function getViewerContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, savedSet: new Set<string>(), profile: null }
  }
  const [{ data: saves }, { data: profile }] = await Promise.all([
    supabase.from("ai_daily_saves").select("tip_id").eq("user_id", user.id),
    supabase
      .from("ai_daily_profiles")
      .select("role, tools, skill_level")
      .eq("id", user.id)
      .maybeSingle(),
  ])
  return {
    user,
    savedSet: new Set((saves ?? []).map((r) => r.tip_id as string)),
    profile: profile as { role: string | null; tools: string[] | null; skill_level: string | null } | null,
  }
}

function buildSearchBlob(item: FeedItem, tip: FeedItem["ai_daily_tips"][number]): string {
  return [
    item.headline,
    item.summary,
    item.category ?? "",
    tip.title ?? "",
    tip.scenario ?? "",
    tip.prompt ?? "",
    tip.before_text ?? "",
    tip.after_text ?? "",
    (tip.tools ?? []).join(" "),
  ]
    .join(" \n ")
    .toLowerCase()
}

function feedItemsToFilterableCards(
  items: FeedItem[],
  isAuthed: boolean,
  savedSet: Set<string>,
): FilterableTipCard[] {
  return items.flatMap((item) =>
    (item.ai_daily_tips ?? []).map((tip) => ({
      id: tip.id,
      category: item.category,
      tools: tip.tools ?? [],
      searchBlob: buildSearchBlob(item, tip),
      node: (
        <TipCard
          key={tip.id}
          tip={tip}
          newsHeadline={item.headline}
          newsCategory={item.category}
          isAuthed={isAuthed}
          isSaved={savedSet.has(tip.id)}
        />
      ),
    })),
  )
}

export default async function TodayPage() {
  // Run feed read + per-user lookup + live agent status in parallel.
  // Agent status is the new contest-edition "live proof" surface; it shows
  // last-run time + counts of sources / articles / tips for the visible
  // edition, and pulses amber while the cron is actively running.
  const [{ items: feed, date: feedDate, isToday }, { user, savedSet, profile }, agentStatus] = await Promise.all([
    getCachedFeed(),
    getViewerContext(),
    getAgentStatus(),
  ])

  // Archive (last 3 days before the currently shown edition)
  const archiveDays = await getCachedArchive(feedDate)

  const userTools: string[] = profile?.tools ?? []
  const role = profile?.role ?? null
  const skill = profile?.skill_level ?? null

  const roleLabelText = role ? (ROLES.find((r) => r.value === role)?.label ?? role) : null
  const skillLabelText = skill ? (SKILL_LEVELS.find((s) => s.value === skill)?.label ?? skill) : null

  // Anchor the parsed instant to noon UTC + render in MYT so the displayed
  // date matches the edition's MYT publication date regardless of which
  // timezone the rendering server happens to run in. Without these two
  // anchors a Vercel-hosted SSR pass would mis-label the edition by one day
  // for any window where UTC and MYT straddle the dateline.
  const dateLabel = new Date(feedDate + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  })

  // Format the agent's last-run timestamp as "HH:MM MYT" so the eyebrow can
  // read "Today's edition · Mon, Apr 27 · Updated 04:15 MYT". Mirrors the
  // helper in app/page.tsx; lives inline here to avoid an extra utility file
  // for two callers.
  const lastRunMyt = (() => {
    const iso = agentStatus.lastRunAt
    if (!iso) return null
    try {
      const myt = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000)
      const hh = String(myt.getUTCHours()).padStart(2, "0")
      const mm = String(myt.getUTCMinutes()).padStart(2, "0")
      return `${hh}:${mm} MYT`
    } catch {
      return null
    }
  })()

  const cards = feedItemsToFilterableCards(feed, !!user, savedSet)

  // Build archive day blocks. To avoid massive client trees we render TipCards
  // here as server-side ReactNodes and pass them in as `cards` ReactNode.
  const archive: ArchiveDay[] = archiveDays.map((d) => {
    const tipNodes = d.items.flatMap((item) =>
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
    )
    const count = d.items.reduce((acc, it) => acc + (it.ai_daily_tips?.length ?? 0), 0)
    return {
      date: d.date,
      // Same MYT anchor as the primary dateLabel — keeps archive day
      // headers consistent with the live edition header.
      label: new Date(d.date + "T12:00:00Z").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Kuala_Lumpur",
      }),
      count,
      cards: <>{tipNodes}</>,
    }
  })

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:py-14">
          {/* Header — sparse, info-dense; no marketing duplication */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
            <div className="min-w-0">
              {/* Eyebrow: "Today's edition · Mon, Apr 27 · Updated 04:15 MYT".
                  All three slots come from the latest edition row, never from
                  the server's wall clock. When today's run hasn't happened
                  yet, the wording flips to "Latest edition" and the stale
                  banner below gives users the context they need. */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {isToday ? "Today's edition" : "Latest edition"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {dateLabel}
                  {lastRunMyt && <> · Updated {lastRunMyt}</>}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                {isToday ? "Today's tips" : "Latest tips"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {feed.length > 0
                  ? `${cards.length} tip${cards.length === 1 ? "" : "s"} drawn from official AI vendor blogs.`
                  : "Awaiting first edition. The daily feed publishes overnight."}
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

          {/* Personalization banner — only shows for logged-in users with prefs */}
          {user && (roleLabelText || skillLabelText || userTools.length > 0) && (
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--success)]/25 bg-[color:var(--success-soft)] px-4 py-3 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--success)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Tuned for you
              </span>
              {roleLabelText && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Briefcase className="h-3 w-3" aria-hidden />
                  {roleLabelText}
                </span>
              )}
              {skillLabelText && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <GraduationCap className="h-3 w-3" aria-hidden />
                  {skillLabelText}
                </span>
              )}
              {userTools.length > 0 && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Wrench className="h-3 w-3" aria-hidden />
                  {userTools.length} tool{userTools.length === 1 ? "" : "s"}
                  <span className="hidden sm:inline">
                    {" "}
                    · {userTools.slice(0, 3).map((t) => toolLabel(t)).join(", ")}
                    {userTools.length > 3 ? `, +${userTools.length - 3}` : ""}
                  </span>
                </span>
              )}
              <Link
                href="/profile"
                className="ml-auto text-xs font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Edit
              </Link>
            </div>
          )}
          {user && !roleLabelText && !skillLabelText && userTools.length === 0 && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-surface-low/60 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Tell us your role and toolkit to tune tips to your job.
              </span>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/onboarding?next=/today">Set preferences</Link>
              </Button>
            </div>
          )}

          {/* Live Agent Activity strip — sits under the personalization banner
              (or banner+nudge for unset users), above the filter chips.
              Polls /api/agent-status every 30s on the client to flip states
              live during the cron window. */}
          <div className="mb-6">
            <AgentActivityStrip initial={agentStatus} />
          </div>

          {/* Stale-edition banner — mirrors the one on the landing page so
              authed users see the same honest signal: the previous edition
              is still browsable, but it is clearly labelled as "not today's"
              and the next agent run is named explicitly. The activity strip
              above polls /api/agent-status every 30s and triggers a soft
              router.refresh() the instant a fresh lastRunAt arrives, so this
              banner self-dismisses without a manual reload. */}
          {!isToday && feed.length > 0 && (
            <div
              className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3.5 sm:px-5"
              role="status"
              aria-live="polite"
            >
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  No new edition yet today
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Showing the most recent edition from {dateLabel}
                  {lastRunMyt && <>, last updated {lastRunMyt}</>}. The next
                  agent run is scheduled for 20:00 MYT — this page will
                  refresh automatically.
                </span>
              </div>
            </div>
          )}

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
            <TodayFilteredFeed cards={cards} userTools={userTools} />
          )}

          {archive.length > 0 && (
            <div className="mt-12 border-t border-border/60 pt-10">
              <TodayArchive days={archive} />
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
