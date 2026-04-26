"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Search, Globe, Layers, Sparkles, Database, ShieldCheck } from "lucide-react"
import type { AgentStatus } from "@/lib/agent-status"

/**
 * Live status strip for the overnight research agent.
 *
 * Two surfaces, one component:
 *   1. Top row — same compact summary the strip has always shown:
 *        [dot] Agent idle. · Last run 4m ago · 12 sources · 5 articles · 5 tips
 *   2. Expandable pipeline trace — six-step "what just happened" timeline
 *      that opens beneath the summary when the user taps "View pipeline".
 *
 * Why a synthesized timeline rather than real per-phase timestamps:
 *   The cron processes sources in parallel via Promise.allSettled, so the
 *   whole run finishes in ~15-20 seconds. Per-phase minute-level timestamps
 *   would have to be fabricated — there isn't a real 4-minute gap between
 *   "Tavily search" and "Firecrawl scrape" because they run concurrently
 *   per source. Instead we show real PHASE LABELS in execution order, with
 *   two genuine timestamps: lastRunAt on the "Supabase saved" line (the
 *   moment the latest feed row's created_at was set) and the current poll
 *   time on the "verified" line. This stays honest while still giving the
 *   visible pipeline trace the user asked for.
 *
 * Three states (matching lib/agent-status.ts):
 *   idle    — green dot.   Most of the day. Shows last-run + counts.
 *   running — amber pulse. ~04:00–04:30 MYT, while the cron is reading.
 *   failed  — red dot.     Last run > 28h ago, or no runs ever.
 *
 * Server-renders with `initial` so the strip has correct content on first
 * paint; then polls /api/agent-status every 30s to flip states live during
 * the cron window without requiring a navigation.
 */

function formatRelative(iso: string | null): string {
  if (!iso) return "never"
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return "just now"
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/**
 * Format a UTC ISO timestamp as "HH:MM MYT".
 * MYT is UTC+8, no DST — a constant offset is correct year-round.
 */
function formatMyt(iso: string | null): string | null {
  if (!iso) return null
  const myt = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000)
  const hh = String(myt.getUTCHours()).padStart(2, "0")
  const mm = String(myt.getUTCMinutes()).padStart(2, "0")
  return `${hh}:${mm} MYT`
}

const STATE_COPY: Record<AgentStatus["state"], { label: string; dot: string; ring: string }> = {
  idle: {
    label: "Agent idle.",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
  },
  running: {
    label: "Agent running now.",
    dot: "bg-amber-500 animate-pulse",
    ring: "ring-amber-500/20",
  },
  failed: {
    label: "Last run incomplete.",
    dot: "bg-red-500",
    ring: "ring-red-500/20",
  },
}

const STATE_DETAIL: Record<AgentStatus["state"], (s: AgentStatus) => string> = {
  idle: (s) =>
    `Last run ${formatRelative(s.lastRunAt)} · ${s.sourcesScanned} sources · ${s.articlesRead} articles · ${s.tipsPublished} tips`,
  running: (s) => `Reading ${s.sourcesScanned} sources… (${s.articlesRead} articles in)`,
  failed: () => "Showing the previous edition. We'll retry overnight.",
}

/**
 * The six pipeline steps that map 1:1 to the cron route's execution path.
 * Each step's `count` is filled from the live AgentStatus so the line copy
 * reflects the actual run (e.g. "12 official AI vendor sources" not a
 * hard-coded number).
 */
type PipelineStep = {
  key: string
  icon: typeof Search
  label: (s: AgentStatus) => string
  /** Optional timestamp for this row. Only the "save" and "verified" steps
      have real timestamps; the others are deliberately blank to avoid
      fabricating per-phase clock times for a parallel run. */
  time: (s: AgentStatus, nowIso: string) => string | null
}

const PIPELINE: PipelineStep[] = [
  {
    key: "scan",
    icon: Search,
    label: (s) => `Agent scanned ${s.sourcesScanned} official AI vendor sources`,
    time: () => null,
  },
  {
    key: "tavily",
    icon: Globe,
    label: (s) => `Tavily MCP returned ${s.articlesRead} candidate articles`,
    time: () => null,
  },
  {
    key: "firecrawl",
    icon: Layers,
    label: () => `Firecrawl MCP extracted full article content`,
    time: () => null,
  },
  {
    key: "ai",
    icon: Sparkles,
    label: (s) => `Vercel AI Gateway generated ${s.tipsPublished} role-based tips`,
    time: () => null,
  },
  {
    key: "save",
    icon: Database,
    label: () => `Supabase saved today's edition`,
    time: (s) => formatMyt(s.lastRunAt),
  },
  {
    key: "verified",
    icon: ShieldCheck,
    label: () => `Last status check verified`,
    time: (_s, nowIso) => formatMyt(nowIso),
  },
]

export function AgentActivityStrip({ initial }: { initial: AgentStatus }) {
  const [status, setStatus] = useState<AgentStatus>(initial)
  const [open, setOpen] = useState(false)
  // We keep "now" in state so the "verified" timestamp updates with the
  // 30s poll instead of being frozen at first render. Hydration-safe: the
  // initial value is null and we only fill it client-side after mount.
  const [nowIso, setNowIso] = useState<string | null>(null)

  useEffect(() => {
    setNowIso(new Date().toISOString())
    let cancelled = false
    async function tick() {
      try {
        const res = await fetch("/api/agent-status", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as AgentStatus
        if (!cancelled) {
          setStatus(data)
          setNowIso(new Date().toISOString())
        }
      } catch {
        // Network blips are tolerated silently — the strip simply keeps
        // showing the last known state until the next successful poll.
      }
    }
    const iv = setInterval(tick, 30_000)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [])

  const copy = STATE_COPY[status.state]
  const detail = STATE_DETAIL[status.state](status)
  const showPipeline = status.state !== "failed" && status.lastRunAt !== null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-surface-low/70 px-4 py-3 ring-1 ${copy.ring}`}
    >
      {/* Top summary row — unchanged behaviour, plus the "View pipeline" toggle. */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${copy.dot}`} aria-hidden />
          <p className="text-sm font-semibold tracking-tight">{copy.label}</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{detail}</p>
        {showPipeline && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="agent-pipeline-trace"
            className="ml-auto inline-flex items-center gap-1 self-start rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
          >
            {open ? "Hide pipeline" : "View pipeline"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        )}
      </div>

      {/* Expandable pipeline trace.
          Rendered as an ordered list with a left rail so the visual reads as
          a real timeline. Each row is icon + label + optional timestamp.
          The rail uses the existing border token; no new colours introduced. */}
      {showPipeline && open && (
        <ol
          id="agent-pipeline-trace"
          className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3"
        >
          {PIPELINE.map((step, i) => {
            const Icon = step.icon
            const time = step.time(status, nowIso ?? new Date().toISOString())
            const isLast = i === PIPELINE.length - 1
            return (
              <li key={step.key} className="relative flex items-start gap-3 pl-1">
                {/* Connector rail — only between rows, not after the last one. */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute left-[14px] top-6 h-[calc(100%-12px)] w-px bg-border/60"
                  />
                )}
                <span className="relative z-10 mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="flex flex-1 flex-col gap-0.5 pt-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <p className="text-xs leading-relaxed text-foreground sm:text-sm">{step.label(status)}</p>
                  {time && (
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground sm:text-xs">
                      {time}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
