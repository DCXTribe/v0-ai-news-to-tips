import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TipCard, type Tip } from "@/components/tip-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, Sparkles, PackageOpen, MessageCircleQuestion, Clock, BookmarkCheck, TrendingUp, ChevronRight } from "lucide-react"
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
              <div className="flex w-full gap-2 sm:w-auto">
                <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl sm:flex-initial">
                  <Link href="/unpack">
                    <PackageOpen className="h-4 w-4" aria-hidden />
                    <span>Unpack</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1 rounded-xl sm:flex-initial">
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

          {/* Tabs */}
          <Tabs defaultValue="saved">
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="saved" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Saved <span className="text-muted-foreground">({saves.length})</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-3.5 w-3.5" aria-hidden />
                History <span className="text-muted-foreground">({history.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="mt-6">
              {saves.length === 0 ? (
                <EmptySaved />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {saves.map(({ tip }) => (
                    <TipCard key={tip.id} tip={tip} isAuthed isSaved />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {history.length === 0 ? (
                <EmptyHistory />
              ) : (
                <ul className="flex flex-col gap-3">
                  {history.map((h) => (
                    <li key={h.id}>
                      <Link
                        href={`/library/history/${h.id}`}
                        className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-brand-soft)] sm:p-5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                              {h.kind === "paste" ? "Article" : "Question"}
                            </span>
                            <span>{new Date(h.created_at).toLocaleString()}</span>
                            <span aria-hidden>·</span>
                            <span>
                              {h.tip_ids?.length ?? 0} tip{(h.tip_ids?.length ?? 0) === 1 ? "" : "s"}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-foreground">
                            {h.input}
                          </p>
                          {h.summary && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {h.summary}
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
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

function EmptySaved() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-low/60 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary">
        <BookmarkCheck className="h-5 w-5" aria-hidden />
      </div>
      <div className="max-w-sm">
        <p className="font-semibold">Your playbook is empty</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Browse{" "}
          <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
            today&apos;s tips
          </Link>{" "}
          and tap <span className="font-medium text-foreground">Save</span> to keep the ones that work for your job.
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/">
            <Sparkles className="h-4 w-4" aria-hidden />
            See today&apos;s tips
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/unpack">
            <PackageOpen className="h-4 w-4" aria-hidden />
            Unpack an article
          </Link>
        </Button>
      </div>
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-low/60 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-high text-muted-foreground">
        <History className="h-5 w-5" aria-hidden />
      </div>
      <div className="max-w-sm">
        <p className="font-semibold">No activity yet</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Your past unpacks and questions will appear here.
        </p>
      </div>
    </div>
  )
}
