import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { type Tip } from "@/components/tip-card"
import { LibraryTabs } from "@/components/library-tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, PackageOpen, MessageCircleQuestion, Clock, BookmarkCheck, TrendingUp, Compass } from "lucide-react"
import { parseTimeSavedToMinutes, formatMinutes } from "@/lib/time"
import { toolLabel } from "@/lib/constants"

export const dynamic = "force-dynamic"

type HistoryRow = {
  id: string
  kind: string
  input: string
  summary: string | null
  created_at: string
  tip_ids: string[]
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/library")

  const { data: savesRaw } = await supabase
    .from("ai_daily_saves")
    .select("status, created_at, tip:ai_daily_tips(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200)

  const saves = (savesRaw ?? []).flatMap((row) => {
    const t = row.tip as unknown as Tip | null
    return t ? [{ tip: t, status: row.status as string, savedAt: row.created_at as string }] : []
  })

  const { data: historyRaw } = await supabase
    .from("ai_daily_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
  const history = (historyRaw ?? []) as HistoryRow[]

  // ---- Stats: time saved, tools breakdown ---------------------------------
  const totalMinutes = saves.reduce((sum, s) => sum + parseTimeSavedToMinutes(s.tip.time_saved), 0)
  const tipsWithTimeSaved = saves.filter((s) => parseTimeSavedToMinutes(s.tip.time_saved) > 0).length
  const weeklyMinutes = totalMinutes // assumes once-per-week usage of each saved tip
  const monthlyMinutes = weeklyMinutes * 4

  const toolCounts = new Map<string, number>()
  for (const { tip } of saves) {
    for (const t of tip.tools ?? []) {
      toolCounts.set(t, (toolCounts.get(t) ?? 0) + 1)
    }
  }
  const topTools = [...toolCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <div className="flex min-h-svh flex-col pb-24 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:mb-8">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <BookmarkCheck className="h-3 w-3" aria-hidden />
              Your library
            </span>
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Your AI playbook</h1>
                <p className="mt-1.5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Tips you saved, ready to copy when you need them. The time savings below assume you run each saved
                  tip about once a week.
                </p>
              </div>
              {/* Action row — three primary surfaces. On mobile, buttons are
                  larger (h-11 = 44px) for comfortable touch targets and use
                  flex-1 so they share width evenly. At sm+ they collapse back
                  to compact size to sit alongside the title. */}
              <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-2">
                <Button asChild variant="outline" className="h-11 rounded-xl sm:h-9">
                  <Link href="/advisor">
                    <Compass className="h-4 w-4" aria-hidden />
                    <span>Advisor</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-xl sm:h-9">
                  <Link href="/unpack">
                    <PackageOpen className="h-4 w-4" aria-hidden />
                    <span>Unpack</span>
                  </Link>
                </Button>
                <Button asChild className="h-11 rounded-xl sm:h-9">
                  <Link href="/ask">
                    <MessageCircleQuestion className="h-4 w-4" aria-hidden />
                    <span>Ask</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats grid — time-saved values use sage success accent so the
              "value of AI" story has its own visual identity, separate from
              brand/coral CTAs. */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Clock className="h-4 w-4" aria-hidden />}
              label="Time saved per use"
              value={formatMinutes(totalMinutes)}
              hint={
                tipsWithTimeSaved > 0
                  ? `Across ${tipsWithTimeSaved} tip${tipsWithTimeSaved === 1 ? "" : "s"} with estimates`
                  : "Save tips with time estimates"
              }
              tone="success"
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" aria-hidden />}
              label="If you use weekly"
              value={`~${formatMinutes(monthlyMinutes)}/mo`}
              hint="Estimated monthly savings"
              tone="success"
            />
            <StatCard
              icon={<BookmarkCheck className="h-4 w-4" aria-hidden />}
              label="Saved tips"
              value={String(saves.length)}
              hint={saves.length === 0 ? "Start with today's feed" : "In your playbook"}
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
              label="Top tool"
              value={topTools[0] ? toolLabel(topTools[0][0]) : "—"}
              hint={topTools[0] ? `Used in ${topTools[0][1]} tip${topTools[0][1] === 1 ? "" : "s"}` : "Save your first tip"}
            />
          </div>

          {/* Tools breakdown row (hidden if no saves) */}
          {topTools.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-surface-low/50 px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Your toolkit
              </span>
              {topTools.map(([tool, count]) => (
                <Badge key={tool} variant="secondary" className="rounded-full font-normal">
                  {toolLabel(tool)} <span className="ml-1 text-muted-foreground">· {count}</span>
                </Badge>
              ))}
            </div>
          )}

          {/* Tabs (client) — saved + history with search */}
          <LibraryTabs saves={saves} history={history} />
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone?: "neutral" | "success" | "primary"
}) {
  const containerClass =
    tone === "success"
      ? "border-[color:var(--success)]/25 bg-[color:var(--success-soft)]"
      : tone === "primary"
        ? "border-primary/20 bg-primary/5"
        : "border-border/60 bg-card"
  const accentClass =
    tone === "success"
      ? "text-[color:var(--success)]"
      : tone === "primary"
        ? "text-primary"
        : "text-muted-foreground"
  const valueClass =
    tone === "success"
      ? "text-[color:var(--success)]"
      : tone === "primary"
        ? "text-primary"
        : "text-foreground"

  return (
    <div className={`flex flex-col gap-1.5 rounded-2xl border p-4 shadow-sm sm:gap-2 sm:p-5 ${containerClass}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${accentClass}`}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-xl font-bold leading-tight tracking-tight sm:text-2xl ${valueClass}`}>{value}</div>
      <div className="text-[11px] leading-snug text-muted-foreground sm:text-xs">{hint}</div>
    </div>
  )
}


