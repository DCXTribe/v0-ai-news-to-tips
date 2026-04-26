import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { UpgradeModal } from "@/components/upgrade-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays, Lock, Sparkles, ArrowRight, BookMarked } from "lucide-react"
import { getViewerTier } from "@/lib/tier"
import { listAvailableEditionDates } from "@/lib/feed"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

type CalendarCell =
  | { kind: "spacer"; key: string }
  | { kind: "day"; date: string; day: number; hasEdition: boolean }

type CalendarMonth = {
  ym: string // YYYY-MM
  label: string // "April 2026"
  cells: CalendarCell[]
  editionCount: number
}

/**
 * Build a 7-column calendar grid for each month that contains at least one
 * edition. Months are ordered newest-first. Days are filled for the entire
 * month (1..lastDay) so the grid reads like a normal calendar even when most
 * days have no edition (handy for showing "we publish daily, here's the
 * coverage so far").
 */
function buildCalendar(dates: string[]): CalendarMonth[] {
  const have = new Set(dates)
  const monthsByYm = new Map<string, { year: number; month: number }>()
  for (const d of dates) {
    const [y, m] = d.split("-")
    const ym = `${y}-${m}`
    if (!monthsByYm.has(ym)) {
      monthsByYm.set(ym, { year: Number(y), month: Number(m) })
    }
  }

  const sortedYms = [...monthsByYm.keys()].sort((a, b) => (a < b ? 1 : -1))

  return sortedYms.map((ym) => {
    const { year, month } = monthsByYm.get(ym)!
    const first = new Date(Date.UTC(year, month - 1, 1))
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const startWeekday = first.getUTCDay() // 0 = Sun

    const cells: CalendarCell[] = []
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ kind: "spacer", key: `${ym}-pad-${i}` })
    }
    let editionCount = 0
    for (let day = 1; day <= lastDay; day += 1) {
      const iso = `${ym}-${String(day).padStart(2, "0")}`
      const hasEdition = have.has(iso)
      if (hasEdition) editionCount += 1
      cells.push({ kind: "day", date: iso, day, hasEdition })
    }

    const label = first.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })

    return { ym, label, cells, editionCount }
  })
}

export default async function HistoryPage() {
  // 1. Anyone hitting /history must be signed in. Anon viewers get sent to
  //    auth, then bounced back here (where the tier gate then triggers the
  //    upgrade modal if they're still on free).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/history")

  // 2. Tier check (PRD §15.6: server-side gate before RLS).
  const { tier } = await getViewerTier()
  const isPaid = tier === "paid"

  // 3. List dates. RLS on `ai_daily_feed` already filters this for free
  //    users (returns only the latest date), so the calendar will render
  //    a single dot for them — but we still show the full month grid
  //    with locks so the upgrade story is visible.
  const dates = await listAvailableEditionDates(120)
  const months = buildCalendar(dates)
  const totalEditions = dates.length

  // The most-recent edition date — anchors the "Today's edition is free" CTA.
  const latestDate = dates[0] ?? null

  return (
    <div className="flex min-h-svh flex-col pb-24 md:pb-0">
      <SiteHeader />

      {/* Free users get the modal auto-open on mount; paid users never see it. */}
      {!isPaid && <UpgradeModal defaultOpen next="/history" reason="past-editions" />}

      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <CalendarDays className="h-3 w-3" aria-hidden />
                Edition history
              </span>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Every past edition, by date
              </h1>
              <p className="mt-1.5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                The daily AI digest publishes every morning. Pick a date below to re-read
                that day&apos;s tips with the same source links and Save-to-Library tools.
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <Badge variant="secondary" className="rounded-full font-normal">
                {totalEditions} {totalEditions === 1 ? "edition" : "editions"} so far
              </Badge>
              {!isPaid && (
                <Badge className="rounded-full bg-primary/10 font-normal text-primary hover:bg-primary/15">
                  <Lock className="mr-1 h-3 w-3" aria-hidden />
                  Free tier · today only
                </Badge>
              )}
            </div>
          </div>

          {/* Free-tier paywall band — sits above the calendar so the value
              is obvious even after the modal is dismissed. */}
          {!isPaid && (
            <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Upgrade for full access
                  </div>
                  <p className="text-pretty text-sm leading-relaxed text-foreground sm:text-base">
                    Today&apos;s edition is always free. Unlock past editions to browse
                    the full archive — same tips, same sources, dated.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {latestDate && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/today">
                        <BookMarked className="h-4 w-4" aria-hidden />
                        Read today
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="rounded-full">
                    <Link href="/upgrade?next=/history">
                      <Sparkles className="h-4 w-4" aria-hidden />
                      See upgrade options
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar */}
          {months.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-low/60 p-10 text-center">
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                No editions yet. The first issue publishes overnight.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {months.map((month) => (
                <MonthGrid key={month.ym} month={month} isPaid={isPaid} latestDate={latestDate} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}

function MonthGrid({
  month,
  isPaid,
  latestDate,
}: {
  month: CalendarMonth
  isPaid: boolean
  latestDate: string | null
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{month.label}</h2>
        <span className="text-xs text-muted-foreground">
          {month.editionCount} {month.editionCount === 1 ? "edition" : "editions"}
        </span>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {month.cells.map((cell) => {
            if (cell.kind === "spacer") {
              return <div key={cell.key} className="aspect-square" aria-hidden />
            }
            return (
              <CalendarDay
                key={cell.date}
                date={cell.date}
                day={cell.day}
                hasEdition={cell.hasEdition}
                isPaid={isPaid}
                isLatest={cell.date === latestDate}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CalendarDay({
  date,
  day,
  hasEdition,
  isPaid,
  isLatest,
}: {
  date: string
  day: number
  hasEdition: boolean
  isPaid: boolean
  isLatest: boolean
}) {
  // Empty calendar cell — day exists in the month but no edition published.
  if (!hasEdition) {
    return (
      <div
        className="flex aspect-square items-center justify-center rounded-lg text-xs text-muted-foreground/40"
        aria-label={`${date}: no edition`}
      >
        {day}
      </div>
    )
  }

  // Today's edition: always free for everyone — links straight to /today.
  if (isLatest) {
    return (
      <Link
        href="/today"
        className="group relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border border-primary/30 bg-primary/10 text-xs font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/15"
        aria-label={`${date}: latest edition (free)`}
      >
        <span>{day}</span>
        <span className="text-[8px] font-bold uppercase tracking-wider">Today</span>
      </Link>
    )
  }

  // Paid viewers — past edition is fully available.
  if (isPaid) {
    return (
      <Link
        href={`/today/${date}`}
        className="flex aspect-square items-center justify-center rounded-lg border border-border bg-surface-low text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        aria-label={`${date}: edition`}
      >
        {day}
      </Link>
    )
  }

  // Free viewers — past edition is gated. Render as a non-link button-styled
  // div so it visually mirrors a clickable day, but route the click to the
  // upgrade flow rather than the (RLS-blocked) past edition page.
  return (
    <Link
      href={`/upgrade?next=${encodeURIComponent(`/today/${date}`)}`}
      className="group relative flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-surface-low/40 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      aria-label={`${date}: edition (paid)`}
    >
      {day}
      <Lock
        className="pointer-events-none absolute right-0.5 top-0.5 h-2.5 w-2.5 text-muted-foreground/60 group-hover:text-primary/70"
        aria-hidden
      />
    </Link>
  )
}
