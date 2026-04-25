import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { SaveButton } from "@/components/save-button"
import { toolLabel } from "@/lib/constants"
import { Clock, ArrowRight, ExternalLink, AlertTriangle, ShieldCheck } from "lucide-react"

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
    <Card className="flex flex-col">
      <CardHeader className="gap-3 pb-3">
        {(newsHeadline || newsCategory) && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {newsCategory && (
                <span className="text-xs font-medium uppercase tracking-wide text-primary">{newsCategory}</span>
              )}
              {tip.is_stale && (
                <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  May be outdated
                </Badge>
              )}
            </div>
            {newsHeadline && <p className="text-sm leading-relaxed text-muted-foreground">{newsHeadline}</p>}
          </div>
        )}

        <h3 className="text-balance text-xl font-semibold leading-tight tracking-tight">{tip.title}</h3>
        {tip.why_it_matters && (
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{tip.why_it_matters}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tip.tools.map((t) => (
            <Badge key={t} variant="secondary" className="font-normal">
              {toolLabel(t)}
            </Badge>
          ))}
          {tip.time_saved && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Clock className="h-3 w-3" aria-hidden />
              Saves {tip.time_saved}
            </Badge>
          )}
          {tip.confidence === "high" && (
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 font-normal text-primary">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Source-verified
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {tip.scenario && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scenario</span>
            <p className="text-sm leading-relaxed">{tip.scenario}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Copy this prompt</span>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/60 p-3 font-mono text-xs leading-relaxed">
            {tip.prompt}
          </pre>
        </div>

        {(tip.before_text || tip.after_text) && (
          <div className="grid gap-2 sm:grid-cols-2">
            {tip.before_text && (
              <div className="rounded-md border border-border bg-background p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Without AI
                </div>
                <p className="text-sm leading-relaxed">{tip.before_text}</p>
              </div>
            )}
            {tip.after_text && (
              <div className="rounded-md border border-primary/20 bg-accent/40 p-3">
                <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  With AI <ArrowRight className="h-3 w-3" aria-hidden />
                </div>
                <p className="text-sm leading-relaxed text-foreground">{tip.after_text}</p>
              </div>
            )}
          </div>
        )}

        {showSource && (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</div>
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
              <ul className="mt-2 flex flex-col gap-1.5 border-t border-border/60 pt-2">
                {citations.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                    <span className="text-foreground">&ldquo;{c.quote}&rdquo;</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <CopyButton text={tip.prompt} />
          <SaveButton tipId={tip.id} initialSaved={isSaved} isAuthed={isAuthed} />
        </div>
      </CardContent>
    </Card>
  )
}
