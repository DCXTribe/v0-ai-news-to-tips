import Link from "next/link"
import { ChevronRight, History, type LucideIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

type RecentActivityProps = {
  /** History row kind to filter by. Currently used: "paste" (Unpack), "question" (Ask), "advisor". */
  kind: "paste" | "question" | "advisor"
  /** Heading & empty-state copy depend on which surface this is on. */
  surfaceLabel: string
  /** Empty-state message — what action will create their first row. */
  emptyHint: string
  /** Lucide icon for the empty state. */
  EmptyIcon: LucideIcon
  limit?: number
}

type HistoryRow = {
  id: string
  kind: string
  input: string
  summary: string | null
  tip_ids: string[] | null
  created_at: string
}

/**
 * Server component. Renders a small "Your recent X" panel for logged-in users
 * on the Unpack / Ask / Advisor pages. Anonymous users see nothing — anonymous
 * activity isn't persisted to ai_daily_history.
 *
 * Each row links to /library/history/[id] for the full detail view.
 */
export async function RecentActivity({ kind, surfaceLabel, emptyHint, EmptyIcon, limit = 5 }: RecentActivityProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("ai_daily_history")
    .select("id, kind, input, summary, tip_ids, created_at")
    .eq("user_id", user.id)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(limit)

  const rows = (data ?? []) as HistoryRow[]

  return (
    <section className="mt-12 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="text-base font-semibold tracking-tight">Your recent {surfaceLabel}</h2>
        </div>
        {rows.length > 0 && (
          <Link
            href="/library?tab=history"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            See all in Library
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-surface-low/60 p-5 text-sm text-muted-foreground">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-high">
            <EmptyIcon className="h-4 w-4" aria-hidden />
          </div>
          <p className="leading-relaxed">{emptyHint}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/library/history/${r.id}`}
                className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-brand-soft)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(r.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {r.tip_ids?.length ?? 0} tip{(r.tip_ids?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-relaxed text-foreground">{r.input}</p>
                  {r.summary && (
                    <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted-foreground">{r.summary}</p>
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
    </section>
  )
}
