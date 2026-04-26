import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { TipCard } from "@/components/tip-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, Sparkles, Lock } from "lucide-react"
import { getFeedForDate } from "@/lib/feed"
import { getViewerTier } from "@/lib/tier"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Returns today's date in Asia/Kuala_Lumpur as a YYYY-MM-DD string. Mirrors
 * the same predicate the RLS policy uses on `ai_daily_feed`, so we can decide
 * server-side whether a given URL is the "free" edition or a paywalled past
 * edition without hitting the database first.
 */
function todayInMyt(): string {
  // 'en-CA' formats as YYYY-MM-DD, which is exactly the date format we store.
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" })
}

export default async function TodayDatePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params

  // 1. Validate URL segment shape — anything else is a 404 (don't even hit DB).
  if (!ISO_DATE_RE.test(date)) notFound()

  // 2. Future-dated URLs are always 404 — no edition exists "tomorrow".
  if (date > todayInMyt()) notFound()

  // 3. Tier gate: past editions require paid; today's edition is open to all.
  //    We do this BEFORE the DB read so free users see a real upgrade page
  //    instead of an RLS-empty result that looks like a broken edition.
  const isToday = date === todayInMyt()
  const { tier, isAuthed } = await getViewerTier()

  if (!isToday && tier !== "paid") {
    // Anonymous → bounce through auth so promo redemption (which requires
    // a user row) lands cleanly. Logged-in free → straight to upgrade.
    if (!isAuthed) {
      redirect(`/auth/login?next=${encodeURIComponent(`/upgrade?next=/today/${date}`)}`)
    }
    redirect(`/upgrade?next=${encodeURIComponent(`/today/${date}`)}`)
  }

  // 4. Fetch the edition. RLS is the second layer of defense — if somehow a
  //    free viewer reaches this point with a past-date URL, the query just
  //    returns null and we render notFound (instead of leaking content).
  const items = await getFeedForDate(date)
  if (!items || items.length === 0) notFound()

  // 5. Per-viewer save state, used to highlight already-saved tips.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let savedSet = new Set<string>()
  if (user) {
    const { data: saves } = await supabase
      .from("ai_daily_saves")
      .select("tip_id")
      .eq("user_id", user.id)
    savedSet = new Set((saves ?? []).map((r) => r.tip_id as string))
  }

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const totalTips = items.reduce((acc, it) => acc + (it.ai_daily_tips?.length ?? 0), 0)

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:py-14">
          {/* Breadcrumb back to history */}
          <div className="mb-4">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground">
              <Link href="/history">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Edition history
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  {isToday ? "Today" : "Past edition"}
                </span>
                <span className="text-xs text-muted-foreground">{dateLabel}</span>
                {!isToday && tier === "paid" && (
                  <Badge variant="secondary" className="rounded-full font-normal">
                    <Sparkles className="mr-1 h-3 w-3" aria-hidden />
                    Paid
                  </Badge>
                )}
              </div>
              <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                {isToday ? "Today's tips" : `Tips from ${dateLabel}`}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalTips} tip{totalTips === 1 ? "" : "s"} drawn from official AI vendor blogs that day.
              </p>
            </div>
          </div>

          {/* Tip list — keep it simple; this is a re-read view, not a filter
              surface. No chips, no filter pills. The whole point is the date
              context. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.flatMap((item) =>
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

          {/* Footer CTA — back to live edition */}
          <div className="mt-12 flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-surface-low/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-medium text-foreground">Want today&apos;s edition?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The latest tips refresh every morning at 4 AM MYT.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/history">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Browse all editions
                </Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/today">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Read today
                </Link>
              </Button>
            </div>
          </div>

          {/* Tier hint — appears only for paid users; reminds free users on
              other pages that they're using a member feature here. */}
          {tier === "paid" && !isToday && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              Past editions are part of your paid membership.
            </p>
          )}
        </section>
      </main>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
