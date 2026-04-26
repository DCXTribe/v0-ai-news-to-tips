import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { PromoForm } from "@/components/promo-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Check, CalendarRange, Lock, Sparkles } from "lucide-react"
import { getViewerTier } from "@/lib/tier"

export const dynamic = "force-dynamic"

/**
 * Upgrade page (PRD v1.4 §16.4).
 *
 * Single surface that handles two states:
 *   - Free signed-in users see a feature comparison + promo redemption form.
 *   - Already-paid users see a confirmation panel with their expiry date and
 *     a CTA back to /history. (We don't redirect them — pasting a promo code
 *     to extend their grant is a legitimate flow.)
 *
 * Anonymous viewers are bounced through /auth/login because promo redemption
 * needs a user row to attach to.
 *
 * The `next` query param flows through to the form so a successful redeem
 * lands the viewer back on whatever page paywalled them.
 */

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next: nextRaw } = await searchParams
  // Only allow internal paths to prevent open-redirect via this query param.
  const next = nextRaw && nextRaw.startsWith("/") ? nextRaw : "/history"

  const { tier, isAuthed, paidUntil } = await getViewerTier()

  if (!isAuthed) {
    redirect(`/auth/login?next=${encodeURIComponent(`/upgrade?next=${next}`)}`)
  }

  const expiryLabel = paidUntil
    ? new Date(paidUntil).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Eyebrow */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" aria-hidden />
              {tier === "paid" ? "Paid plan active" : "Upgrade"}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {tier === "paid" ? "You're on the paid plan" : "Read every edition, not just today's"}
          </h1>
          <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            {tier === "paid"
              ? "Browse the full archive whenever you want. The form below lets you stack another promo code on top of your existing access."
              : "Today's tips are always free. The full back-catalog of past editions — plus every new edition going forward — comes with the paid plan."}
          </p>

          {/* Paid-state confirmation panel */}
          {tier === "paid" && (
            <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-[color:var(--success)]/30 bg-[color:var(--success-soft)] p-5">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]"
                >
                  <Check className="h-3 w-3" aria-hidden />
                  Active
                </Badge>
                {expiryLabel && (
                  <span className="text-xs text-muted-foreground">Through {expiryLabel}</span>
                )}
              </div>
              <p className="text-sm text-foreground/85">
                You can read any past edition right now. Save tips to your library, copy prompts, browse by date.
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button asChild className="rounded-full">
                  <Link href="/history">
                    <CalendarRange className="h-4 w-4" aria-hidden />
                    Browse archive
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/today">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Read today
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Free-state pricing card */}
          {tier === "free" && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <PlanCard
                name="Free"
                badge="Current"
                lede="Today's edition, every day. No archive."
                features={[
                  "Today's tips, refreshed every morning",
                  "Save tips to your library",
                  "Unpack, Ask, and Advisor flows",
                ]}
              />
              <PlanCard
                highlighted
                name="Paid"
                badge="Promo only for now"
                lede="Everything in Free, plus the full back-catalog."
                features={[
                  "Browse every past edition by date",
                  "Re-read tips from before you signed up",
                  "60-day rolling archive",
                  "Same Save-to-Library, same source pills",
                ]}
              />
            </div>
          )}

          {/* Promo redemption — always shown */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h2 className="text-base font-semibold">
                {tier === "paid" ? "Stack another promo code" : "Have a promo code?"}
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {tier === "paid"
                ? "Stacking adds the new months to your existing expiry."
                : "Paste your code below. Each code grants a fixed number of months of paid access."}
            </p>
            <PromoForm next={next} />
          </div>

          {/* Honest footnote */}
          <p className="mt-6 text-xs text-muted-foreground">
            Stripe checkout is on the roadmap. While we&apos;re in early access, paid is granted via promo codes only.
          </p>
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}

function PlanCard({
  name,
  badge,
  lede,
  features,
  highlighted = false,
}: {
  name: string
  badge: string
  lede: string
  features: string[]
  highlighted?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 sm:p-6 ${
        highlighted ? "border-primary/40 bg-primary/5 shadow-[var(--shadow-brand-soft)]" : "border-border/60 bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{name}</h3>
        <Badge
          variant={highlighted ? "default" : "secondary"}
          className="rounded-full text-[10px] font-medium"
        >
          {badge}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{lede}</p>
      <ul className="mt-1 flex flex-col gap-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full ${
                highlighted ? "bg-primary text-primary-foreground" : "bg-[color:var(--success-soft)] text-[color:var(--success)]"
              }`}
            >
              <Check className="h-3 w-3" aria-hidden />
            </span>
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
