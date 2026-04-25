import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { SaveButton } from "@/components/save-button"
import { toolLabel } from "@/lib/constants"
import { Clock, ArrowRight } from "lucide-react"

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
  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-3 pb-3">
        {(newsHeadline || newsCategory) && (
          <div className="flex flex-col gap-2">
            {newsCategory && (
              <span className="text-xs font-medium uppercase tracking-wide text-primary">{newsCategory}</span>
            )}
            {newsHeadline && (
              <p className="text-sm leading-relaxed text-muted-foreground">{newsHeadline}</p>
            )}
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
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Copy this prompt
          </span>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/60 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
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

        <div className="mt-auto flex items-center gap-2 pt-2">
          <CopyButton text={tip.prompt} />
          <SaveButton tipId={tip.id} initialSaved={isSaved} isAuthed={isAuthed} />
        </div>
      </CardContent>
    </Card>
  )
}
