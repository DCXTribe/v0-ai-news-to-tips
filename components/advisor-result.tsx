"use client"

import { CopyButton } from "@/components/copy-button"
import { toolLabel } from "@/lib/constants"
import { Award, AlertTriangle, ArrowUpRight, ExternalLink, ShieldCheck, Lightbulb } from "lucide-react"

export type AdvisorOutput = {
  task_summary: string
  best_pick: {
    tool: string
    reason: string
    prompt: string
    watch_outs: string[]
  }
  alternatives: Array<{
    tool: string
    reason: string
    when_to_pick_this: string
  }>
  avoid: Array<{
    tool: string
    reason: string
  }>
  citations: Array<{
    url: string
    title: string
    quote: string
  }>
  scoped_to_toolkit?: boolean
}

export function AdvisorResult({ data }: { data: AdvisorOutput }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Task summary strip */}
      <div className="rounded-2xl border border-border/60 bg-surface-low/60 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Task</div>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground">{data.task_summary}</p>
        {data.scoped_to_toolkit && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Scoped to the tools in your toolkit. Update them in onboarding to broaden recommendations.
          </p>
        )}
      </div>

      {/* Best pick — sage success card, the headline answer */}
      <section
        aria-labelledby="best-pick-heading"
        className="relative overflow-hidden rounded-2xl border border-[color:var(--success)]/30 bg-[color:var(--success-soft)] p-5 shadow-sm sm:p-6"
      >
        <span className="absolute inset-y-0 left-0 w-1.5 bg-[color:var(--success)]" aria-hidden />
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--success)]/15 text-[color:var(--success)]">
              <Award className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--success)]">
                Best pick
              </div>
              <h2 id="best-pick-heading" className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {toolLabel(data.best_pick.tool)}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{data.best_pick.reason}</p>
            </div>
          </div>

          {/* Copy-paste prompt */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ready prompt
              </span>
              <CopyButton text={data.best_pick.prompt} label="Copy prompt" />
            </div>
            <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground">
              {data.best_pick.prompt}
            </pre>
          </div>

          {/* Watch-outs */}
          {data.best_pick.watch_outs.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                Watch-outs
              </div>
              <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
                {data.best_pick.watch_outs.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Alternatives + Avoid grid */}
      {(data.alternatives.length > 0 || data.avoid.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Alternatives */}
          {data.alternatives.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-primary" aria-hidden />
                Strong alternatives
              </div>
              <ul className="flex flex-col gap-3">
                {data.alternatives.map((alt) => (
                  <li key={alt.tool} className="flex flex-col gap-1 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {toolLabel(alt.tool)}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/85">{alt.reason}</p>
                    <p className="text-xs italic leading-relaxed text-muted-foreground">
                      Pick this when: {alt.when_to_pick_this}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avoid */}
          {data.avoid.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                Avoid for this task
              </div>
              <ul className="flex flex-col gap-3">
                {data.avoid.map((a) => (
                  <li key={a.tool} className="flex flex-col gap-1 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="text-sm font-semibold text-foreground">{toolLabel(a.tool)}</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{a.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Citations */}
      {data.citations.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-surface-low/40 p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sources
          </div>
          <ul className="flex flex-col gap-2">
            {data.citations.map((c, i) => (
              <li key={`${c.url}-${i}`}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 text-sm leading-relaxed text-foreground hover:text-primary"
                >
                  <ExternalLink
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:text-primary"
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="font-medium underline-offset-4 group-hover:underline">{c.title}</span>
                    {c.quote && (
                      <span className="ml-1 text-muted-foreground">&mdash; &ldquo;{c.quote}&rdquo;</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
