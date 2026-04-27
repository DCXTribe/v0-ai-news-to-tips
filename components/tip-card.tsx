import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { SaveButton } from "@/components/save-button"
import { toolLabel } from "@/lib/constants"
import { Clock, ExternalLink, AlertTriangle, ShieldCheck, Sparkles, Users, NotebookPen, ArrowDown, Lock } from "lucide-react"

export type TipCitation = {
  url: string
  title: string
  quote: string
}

export type Tip = {
  id: string
  title: string
  why_it_matters: string | null
  prompt: string
  scenario: string | null
  before_text: string | null
  after_text: string | null
  tools: string[]
  time_saved: string | null
  source_url?: string | null
  source_title?: string | null
  source_publisher?: string | null
  source_published_at?: string | null
  citations?: TipCitation[] | null
  confidence?: "low" | "medium" | "high" | null
  is_stale?: boolean | null
  /** True when the audit script flagged the source as 401/paywalled. Surfaces a
   *  "Subscription required" badge per PRD §3.6 (REQ-LINK-05). */
  is_paywalled?: boolean | null
  /** Wall-clock instant when the agent generated this tip. Surfaced as a small
   *  "Generated HH:MM MYT · Mon DD" chip so users see the precise timing of
   *  each tip in the edition (PRD per-tip transparency requirement).
   *  Optional because on-demand callers (/unpack, /ask) may not write it. */
  created_at?: string | null
}

/**
 * Format a UTC ISO timestamp as "HH:MM MYT · Mon DD" in stable en-US.
 * MYT is UTC+8 with no DST so a constant 8h shift is correct year-round.
 * Returns null for missing input so callers can drop the chip cleanly.
 */
function formatGeneratedAtMyt(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    const myt = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000)
    const hh = String(myt.getUTCHours()).padStart(2, "0")
    const mm = String(myt.getUTCMinutes()).padStart(2, "0")
    const month = myt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
    const day = myt.getUTCDate()
    return `${hh}:${mm} MYT · ${month} ${day}`
  } catch {
    return null
  }
}

function formatPublishedAt(iso: string | null | undefined) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return null
  }
}

function hostFrom(url: string | null | undefined) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

export function TipCard({
  tip,
  newsHeadline,
  newsCategory,
  isAuthed,
  isSaved = false,
}: {
  tip: Tip
  newsHeadline?: string
  newsCategory?: string | null
  isAuthed: boolean
  isSaved?: boolean
}) {
  const citations = tip.citations ?? []
  const sourceHost = hostFrom(tip.source_url)
  const publishedAt = formatPublishedAt(tip.source_published_at)
  const showSource = Boolean(tip.source_url && tip.source_url !== "user-pasted")
  // When the agent generated this tip — shown as a subtle line under the
  // headline so users see the precise timing per tip without crowding the
  // primary metadata chips at the top of the card.
  const generatedAt = formatGeneratedAtMyt(tip.created_at)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-brand-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brand)]">
      {/* Top meta strip */}
      <header className="flex flex-col gap-2.5 border-b border-border/60 bg-surface-low/60 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {newsCategory && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
              <Sparkles className="h-3 w-3" aria-hidden />
              {newsCategory}
            </span>
          )}
          {tip.confidence === "high" && (
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-primary/30 bg-primary/5 text-[11px] font-medium text-primary"
            >
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Source-verified
            </Badge>
          )}
          {tip.is_stale && (
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-amber-500/40 bg-amber-500/10 text-[11px] font-medium text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="h-3 w-3" aria-hidden />
              May be outdated
            </Badge>
          )}
          {tip.time_saved && (
            <span
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--success-soft)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--success)]"
            >
              <Clock className="h-3 w-3" aria-hidden />
              Saves {tip.time_saved}
            </span>
          )}
        </div>

        {newsHeadline && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{newsHeadline}</p>
        )}
        {generatedAt && (
          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/70">
            <Clock className="h-3 w-3" aria-hidden />
            Generated {generatedAt}
          </p>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6">
        {/* Headline + summary */}
        <div className="flex flex-col gap-2">
          <h3 className="text-balance text-xl font-bold leading-tight tracking-tight sm:text-2xl">{tip.title}</h3>
          {tip.why_it_matters && (
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {tip.why_it_matters}
            </p>
          )}
        </div>

        {/* Tool tags */}
        {tip.tools.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {tip.tools.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full font-normal">
                {toolLabel(t)}
              </Badge>
            ))}
          </div>
        )}

        {/* Scenario card */}
        {tip.scenario && (
          <div className="rounded-2xl border border-border/60 bg-surface-low/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground sm:h-10 sm:w-10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                  The Scenario
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{tip.scenario}</p>
              </div>
            </div>
          </div>
        )}

        {/* Before & after — the transformation story.
            Stacked at all widths because cards live in narrow 3-col grids
            (~330px each) where side-by-side comparison would be too cramped.
            Visual hierarchy: Before is muted (dashed border, surface-low),
            connector arrow links the two, After is the sage success state. */}
        {(tip.before_text || tip.after_text) && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                Before & after
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {tip.before_text && (
                <div className="flex gap-3 rounded-xl border border-dashed border-border/70 bg-surface-low/60 px-4 py-3.5">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-high text-muted-foreground">
                    <NotebookPen className="h-3.5 w-3.5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      The old way
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{tip.before_text}</p>
                  </div>
                </div>
              )}
              {tip.before_text && tip.after_text && (
                <div className="flex items-center gap-2 self-center" aria-hidden>
                  <span className="block h-px w-6 bg-[color:var(--success)]/30" />
                  <ArrowDown className="h-3.5 w-3.5 text-[color:var(--success)]" />
                  <span className="block h-px w-6 bg-[color:var(--success)]/30" />
                </div>
              )}
              {tip.after_text && (
                <div className="relative flex gap-3 overflow-hidden rounded-xl border border-[color:var(--success)]/30 bg-[color:var(--success-soft)] px-4 py-3.5">
                  <span className="absolute inset-y-0 left-0 w-1.5 bg-[color:var(--success)]" aria-hidden />
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color:var(--success)]/15 text-[color:var(--success)]">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--success)]">
                      With AI
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{tip.after_text}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* The prompt — dark block */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">The Prompt</span>
            <CopyButton text={tip.prompt} variant="ghost" size="sm" />
          </div>
          <div className="overflow-hidden rounded-2xl bg-inverse-surface p-4 text-inverse-on-surface sm:p-5">
            <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed sm:text-[13px]">
              {tip.prompt}
            </pre>
          </div>
        </div>

        {/* Source — REQ-LINK-02: the *publisher domain* is the link text, not
            the headline. Trust is conferred at a glance ("oh, it's openai.com").
            Title and date demote to supporting metadata.
            REQ-LINK-06: Tavily citations are also clickable, each with its own
            domain badge — no more silent quote-only rendering. */}
        {showSource && (
          <div className="rounded-xl border border-border/60 bg-surface-low/60 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Source</div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={tip.source_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <span className="font-mono text-[13px]">{sourceHost ?? tip.source_url}</span>
                <ExternalLink
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                  aria-hidden
                />
              </a>
              {tip.is_paywalled && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-amber-500/40 bg-amber-500/10 text-[11px] font-medium text-amber-700 dark:text-amber-400"
                >
                  <Lock className="h-3 w-3" aria-hidden />
                  Subscription required
                </Badge>
              )}
            </div>
            {(tip.source_title || tip.source_publisher || publishedAt) && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {tip.source_title && <span className="text-foreground/80">{tip.source_title}</span>}
                {tip.source_title && (tip.source_publisher || publishedAt) && <span aria-hidden> · </span>}
                {tip.source_publisher ?? null}
                {tip.source_publisher && publishedAt && <span aria-hidden> · </span>}
                {publishedAt}
              </p>
            )}
            {citations.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
                {citations.slice(0, 3).map((c) => {
                  const cHost = hostFrom(c.url)
                  return (
                    <li key={c.url} className="text-xs leading-relaxed">
                      <p className="text-foreground">&ldquo;{c.quote}&rdquo;</p>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          {cHost ?? c.url}
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Action bar — primary actions, full width on mobile */}
        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
          <CopyButton text={tip.prompt} className="flex-1 rounded-xl" size="lg" />
          <SaveButton
            tipId={tip.id}
            initialSaved={isSaved}
            isAuthed={isAuthed}
            className="flex-1 rounded-xl"
            size="lg"
            variant={isSaved ? "default" : "outline"}
          />
        </div>
      </div>
    </article>
  )
}
