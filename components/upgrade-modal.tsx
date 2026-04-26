"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Check, Lock, Sparkles } from "lucide-react"

/**
 * Reusable paywall modal (PRD v1.4 §15.6).
 *
 * Surfaces:
 *   - `/history`        → free user lands → modal opens automatically
 *   - `/today/[date]`   → free user clicks past edition → modal opens
 *   - Library / footer  → can be opened explicitly via `defaultOpen`
 *
 * Dismissal contract:
 *   - Once a session, the modal remembers it was dismissed via sessionStorage
 *     under the key `ai-daily:upgrade-dismissed`. PRD §15.6 explicitly forbids
 *     "nag" behavior — re-mounting the page should NOT re-pop the modal in
 *     the same session.
 *   - The "next" prop survives into the redirect URL so the user lands back on
 *     the page they were trying to reach after redeeming a promo.
 *
 * The modal is always rendered (not conditionally) so the parent server
 * component doesn't need a "show modal?" branch — controlled state lives
 * here.
 */

const DISMISS_KEY = "ai-daily:upgrade-dismissed"

export function UpgradeModal({
  defaultOpen = true,
  next = "/history",
  reason = "past-editions",
}: {
  /** Whether to open the modal on mount. Default true (calling page already
   *  decided the viewer is unpaid). */
  defaultOpen?: boolean
  /** Path to send the viewer back to after they redeem a promo. */
  next?: string
  /** Used in copy + analytics breadcrumbs to explain *why* we paywalled. */
  reason?: "past-editions" | "single-edition" | "manual"
}) {
  const [open, setOpen] = useState(false)

  // Respect the per-session dismissal so we don't nag.
  useEffect(() => {
    if (!defaultOpen) return
    if (typeof window === "undefined") return
    let dismissed = false
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1"
    } catch {
      // sessionStorage can throw in private mode / SSR previews — ignore.
    }
    if (!dismissed) setOpen(true)
  }, [defaultOpen])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      try {
        window.sessionStorage.setItem(DISMISS_KEY, "1")
      } catch {
        // ignore
      }
    }
  }

  const heading =
    reason === "single-edition"
      ? "This edition is in the archive"
      : "Unlock the full archive"

  const lede =
    reason === "single-edition"
      ? "Past editions are part of the paid plan. Today's tips are always free."
      : "Today's tips are always free. The full back-catalog of past editions — and the daily archive going forward — comes with the paid plan."

  const upgradeHref = `/upgrade?next=${encodeURIComponent(next)}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Lock className="h-3 w-3" aria-hidden />
            Paid feature
          </div>
          <DialogTitle className="text-balance text-xl font-bold tracking-tight">
            {heading}
          </DialogTitle>
          <DialogDescription className="text-pretty leading-relaxed">
            {lede}
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-2 space-y-2 text-sm">
          <FeatureRow>Browse every past edition by date</FeatureRow>
          <FeatureRow>Re-read tips you missed before you signed up</FeatureRow>
          <FeatureRow>Same source pills, same Save-to-Library</FeatureRow>
        </ul>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row sm:gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} className="sm:flex-1">
            Maybe later
          </Button>
          <Button asChild className="sm:flex-1">
            <Link href={upgradeHref}>
              <Sparkles className="h-4 w-4" aria-hidden />
              See upgrade options
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FeatureRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[color:var(--success-soft)] text-[color:var(--success)]">
        <Check className="h-3 w-3" aria-hidden />
      </span>
      <span className="text-foreground/90">{children}</span>
    </li>
  )
}
