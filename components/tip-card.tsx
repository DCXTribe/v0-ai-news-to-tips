import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { SaveButton } from "@/components/save-button"
import { toolLabel } from "@/lib/constants"
import { Clock, ExternalLink, AlertTriangle, ShieldCheck, Users, Sparkles, NotebookPen } from "lucide-react"

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

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(184,0,53,0.04)] transition-all hover:shadow-[0_8px_30px_rgba(184,0,53,0.08)]">
      {/* Top meta strip */}
      <header className="flex flex-col gap-3 border-b border-border/60 bg-surface-low/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {newsCategory && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" aria-hidden />
              {newsCategory}
            </span>
          )}
          {tip.confidence === "high" && (
            <Badge variant="outline" className="gap-1 rounded-full border-primary/30 bg-primary/5 text-[11px] font-medium text-primary">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Source-verified
            </Badge>
          )}
          {tip.is_stale && (
            <Badge variant="outline" className="gap-1 rounded-full border-amber-500/40 bg-amber-500/10 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              May be outdated
            </Badge>
          )}
          {tip.time_saved && (
            <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Saves {tip.time_saved}
            </span>
          )}
        </div>

        {newsHeadline && (
          <p className="text-sm leading-relaxed text-muted-foreground">{newsHeadline}</p>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 py-6 sm:px-6">
        {/* Headline + summary */}
        <div className="flex flex-col gap-2">
          <h3 className="text-balance text-2xl font-bold leading-tight tracking-tight">{tip.title}</h3>
          {tip.why_it_matters && (
            <p className="text-pretty text-base leading-relaxed text-muted-foreground">{tip.why_it_matters}</p>
          )}
        </div>

        {/* Tool tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tip.tools.map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full font-normal">
              {toolLabel(t)}
            </Badge>
          ))}
        </div>

        {/* Scenario card */}
        {tip.scenario && (
          <div className="rounded-2xl border border-border/60 bg-surface-low/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-highest text-primary">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                  The Scenario
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{tip.scenario}</p>
              </div>
            </div>
          </div>
        )}

        {/* Without AI / With AI comparison */}
        {(tip.before_text || tip.after_text) && (
          <div className="flex flex-col gap-3">
            {tip.before_text && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <NotebookPen className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide">Without AI</div>
                    <p className="truncate text-sm text-muted-foreground">{tip.before_text}</p>
                  </div>
                </div>
              </div>
            )}
            {tip.after_text && (
              <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 shadow-[0_4px_20px_rgba(184,0,53,0.05)]">
                <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
                <div className="flex min-w-0 items-center gap-3 pl-1">
                  <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">With AI</div>
                    <p className="truncate text-sm text-primary/90">{tip.after_text}</p>
                  </div>
                </div>
                {tip.time_saved && (
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {tip.time_saved}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* The prompt — dark block */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">The Prompt</span>
            <CopyButton text={tip.prompt} variant="ghost" size="sm" />
          </div>
          <div className="overflow-hidden rounded-2xl bg-inverse-surface p-5 text-inverse-on-surface">
            <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">{tip.prompt}</pre>
          </div>
        </div>

        {/* Source */}
        {showSource && (
          <div className="rounded-xl border border-border/60 bg-surface-low/60 p-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Source</div>
            <a
              href={tip.source_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-1.5 text-sm font-medium leading-snug text-foreground hover:underline"
            >
              <span className="line-clamp-2">{tip.source_title ?? tip.source_url}</span>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              {tip.source_publisher ?? sourceHost}
              {publishedAt ? ` · ${publishedAt}` : ""}
            </p>
            {citations.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1.5 border-t border-border/60 pt-2.5">
                {citations.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                    <span className="text-foreground">&ldquo;{c.quote}&rdquo;</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
          <CopyButton text={tip.prompt} className="flex-1 rounded-xl" size="lg" />
          <SaveButton tipId={tip.id} initialSaved={isSaved} isAuthed={isAuthed} className="flex-1 rounded-xl" size="lg" />
        </div>

        {tip.time_saved && !tip.after_text && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden /> Typical time saved: {tip.time_saved}
          </p>
        )}
      </div>
    </article>
  )
}
