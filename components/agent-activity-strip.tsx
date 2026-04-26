"use client"

import { useEffect, useState } from "react"
import type { AgentStatus } from "@/lib/agent-status"

/**
 * Live status strip for the overnight research agent.
 *
 * Three states (matching lib/agent-status.ts):
 *   idle    — green dot.   Most of the day. Shows last-run + counts.
 *   running — amber pulse. ~04:00–04:30 MYT, while the cron is reading.
 *   failed  — red dot.     Last run > 28h ago, or no runs ever.
 *
 * Server-renders with `initial` so the strip has correct content on first
 * paint; then polls /api/agent-status every 30s to flip states live during
 * the cron window without requiring a navigation.
 *
 * Visual: full-width pill aligned to the existing surface-low token, two
 * rows on mobile (label / metadata), one row on desktop. No new colors —
 * the status dot uses Tailwind's emerald/amber/red 500s which read clearly
 * on both light + dark themes.
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

export function AgentActivityStrip({ initial }: { initial: AgentStatus }) {
  const [status, setStatus] = useState<AgentStatus>(initial)

  useEffect(() => {
    let cancelled = false
    async function tick() {
      try {
        const res = await fetch("/api/agent-status", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as AgentStatus
        if (!cancelled) setStatus(data)
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

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-surface-low/70 px-4 py-3 ring-1 ${copy.ring} sm:flex-row sm:items-center sm:gap-3`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${copy.dot}`}
          aria-hidden
        />
        <p className="text-sm font-semibold tracking-tight">{copy.label}</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{detail}</p>
    </div>
  )
}
