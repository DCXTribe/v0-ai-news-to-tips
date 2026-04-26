"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Check, AlertCircle } from "lucide-react"

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; paidUntil: string; months: number }
  | { kind: "error"; message: string }

/**
 * Promo redemption form (PRD v1.4 §16.4).
 *
 * Posts to /api/upgrade/promo. On success, refreshes the route so server
 * components re-read the new tier, then bounces to `next` (default /history).
 * On error, surfaces the API's friendly message inline.
 */
export function PromoForm({ next = "/history" }: { next?: string }) {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status.kind === "submitting") return
    setStatus({ kind: "submitting" })

    try {
      const res = await fetch("/api/upgrade/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = (await res.json()) as
        | { ok: true; paid_until: string; paid_months_granted: number }
        | { ok: false; error: string }

      if (!res.ok || !("ok" in data) || !data.ok) {
        const message = "ok" in data && data.ok === false ? data.error : "Something went wrong."
        setStatus({ kind: "error", message })
        return
      }

      setStatus({
        kind: "success",
        paidUntil: data.paid_until,
        months: data.paid_months_granted,
      })

      // Refresh first so server components re-read the tier, then navigate.
      router.refresh()
      // Small delay so the success state is visible before redirect.
      setTimeout(() => router.push(next), 1100)
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." })
    }
  }

  if (status.kind === "success") {
    const expiry = new Date(status.paidUntil).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--success)]/30 bg-[color:var(--success-soft)] p-4">
        <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--success)] text-white">
          <Check className="h-4 w-4" aria-hidden />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-[color:var(--success)]">
            {status.months} month{status.months === 1 ? "" : "s"} of paid access activated.
          </p>
          <p className="mt-0.5 text-foreground/80">Active through {expiry}. Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="promo-code" className="text-sm font-medium">
          Promo code
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="promo-code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EARLY-ACCESS-2026"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            disabled={status.kind === "submitting"}
          />
          <Button
            type="submit"
            disabled={code.trim().length === 0 || status.kind === "submitting"}
            className="rounded-xl sm:w-auto"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {status.kind === "submitting" ? "Redeeming…" : "Redeem"}
          </Button>
        </div>
      </div>

      {status.kind === "error" && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          <span>{status.message}</span>
        </div>
      )}
    </form>
  )
}
