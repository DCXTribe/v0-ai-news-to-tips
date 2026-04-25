import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { TipCard, type Tip } from "@/components/tip-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, History, MessageCircleQuestion, PackageOpen } from "lucide-react"

export const dynamic = "force-dynamic"

type HistoryRow = {
  id: string
  user_id: string
  kind: string
  input: string
  summary: string | null
  created_at: string
  tip_ids: string[]
}

function isUrl(s: string) {
  return /^https?:\/\//i.test(s.trim())
}

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/library/history/${id}`)

  // RLS guarantees we only read this user's history rows
  const { data: historyRow } = await supabase
    .from("ai_daily_history")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!historyRow) notFound()
  const history = historyRow as HistoryRow

  // Pull the linked tips. RLS allows the owner to read their own tips.
  let tips: Tip[] = []
  if (history.tip_ids?.length) {
    const { data: tipRows } = await supabase
      .from("ai_daily_tips")
      .select("*")
      .in("id", history.tip_ids)
      .order("created_at", { ascending: true })
    tips = (tipRows ?? []) as Tip[]
  }

  // Lookup which of these tips the user has explicitly saved to their library
  let savedSet = new Set<string>()
  if (tips.length) {
    const { data: saves } = await supabase
      .from("ai_daily_saves")
      .select("tip_id")
      .eq("user_id", user.id)
      .in("tip_id", tips.map((t) => t.id))
    savedSet = new Set((saves ?? []).map((r) => r.tip_id))
  }

  const kindLabel = history.kind === "paste" ? "Article unpack" : "Question"
  const kindIcon = history.kind === "paste" ? PackageOpen : MessageCircleQuestion
  const KindIcon = kindIcon
  const inputIsUrl = history.kind === "paste" && isUrl(history.input)

  return (
    <div className="flex min-h-svh flex-col pb-24 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Breadcrumb back */}
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 rounded-full text-muted-foreground">
            <Link href="/library">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to library
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-primary/25 bg-primary/5 text-primary"
              >
                <KindIcon className="h-3 w-3" aria-hidden />
                {kindLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(history.created_at).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-xs text-muted-foreground" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <History className="h-3 w-3" aria-hidden />
                {tips.length} tip{tips.length === 1 ? "" : "s"} generated
              </span>
            </div>
            <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              {history.kind === "paste" ? "What you unpacked" : "What you asked"}
            </h1>
          </div>

          {/* Input + summary card */}
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {history.kind === "paste" ? "Article" : "Question"}
              </div>
              {inputIsUrl ? (
                <a
                  href={history.input}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm font-medium text-foreground underline-offset-4 hover:underline sm:text-base"
                >
                  {history.input}
                </a>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">
                  {history.input}
                </p>
              )}
            </div>
            {history.summary && (
              <div className="border-t border-border/60 pt-4">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Summary
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{history.summary}</p>
              </div>
            )}
          </div>

          {/* Tips grid */}
          {tips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-low/60 p-10 text-center text-sm text-muted-foreground">
              The generated tips for this session are no longer available.
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">Generated tips</h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                {tips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} isAuthed isSaved={savedSet.has(tip.id)} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
