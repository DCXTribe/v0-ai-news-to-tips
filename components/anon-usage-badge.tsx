"use client"

import Link from "next/link"
import { Sparkles, Lock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * AnonUsageBadge — surfaces the anonymous user's remaining free use of a
 * specific feature (Unpack / Ask / Advisor). Two variants:
 *
 *  • `available` — single quiet pill: "1 free use this week" + sign-up
 *    nudge. Sits above the form's submit button.
 *  • `exhausted` — full callout card replacing the input area, telling
 *    the user their free use is spent and pointing to sign-up.
 *
 * Logged-in users never see this — the parent renders nothing for them.
 */

export type AnonUsageBadgeKind = "unpack" | "ask" | "advisor"

const COPY: Record<AnonUsageBadgeKind, { noun: string; verb: string }> = {
  unpack: { noun: "unpack", verb: "unpack another article" },
  ask: { noun: "question", verb: "ask another question" },
  advisor: { noun: "recommendation", verb: "get another recommendation" },
}

function formatResetDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function AnonUsageBadge({
  kind,
  remaining,
  resetsAt,
  className,
}: {
  kind: AnonUsageBadgeKind
  remaining: boolean
  resetsAt: number
  className?: string
}) {
  if (remaining) {
    return (
      <div
        className={cn(
          "inline-flex flex-wrap items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs",
          className,
        )}
        role="status"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="font-medium text-foreground">1 free {COPY[kind].noun} this week</span>
        <span aria-hidden className="hidden h-3 w-px bg-primary/20 sm:block" />
        <Link
          href="/auth/sign-up"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up for unlimited
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-surface-low/80 p-5 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left",
        className,
      )}
      role="status"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-xl bg-accent text-primary sm:self-auto">
        <Lock className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-foreground">
          You&apos;ve used your free {COPY[kind].noun} this week
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Sign up free to {COPY[kind].verb} now, save tips to your library, and get tailored results.
          <span className="ml-1 text-muted-foreground/80">Resets {formatResetDate(resetsAt)}.</span>
        </p>
      </div>
      <Link
        href="/auth/sign-up"
        className="inline-flex items-center justify-center gap-1.5 self-center whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-brand)] transition hover:opacity-90 sm:self-auto"
      >
        Sign up free
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  )
}
