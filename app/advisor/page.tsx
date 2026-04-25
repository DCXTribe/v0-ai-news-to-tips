import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { AdvisorForm } from "@/components/advisor-form"
import { RecentActivity } from "@/components/recent-activity"
import { Compass, Settings2, Award, ArrowUpRight, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { toolLabel } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * Advisor page — purpose: pick the best tool for a task.
 *
 * The "constraints" being fed to the algorithm (the user's toolkit) are
 * surfaced prominently in the header — these decide what we can recommend,
 * so they should be visible, scannable, and editable in one click.
 *
 * The "what you'll get" preview shows the 3-pane output structure (Best /
 * Alternatives / Avoid) so users know what to expect.
 */
export default async function AdvisorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userTools: string[] = []
  if (user) {
    const { data: profile } = await supabase
      .from("ai_daily_profiles")
      .select("tools")
      .eq("id", user.id)
      .maybeSingle()
    userTools = (profile?.tools as string[] | null) ?? []
  }

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
          {/* Header — page identity */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-brand-soft)]">
                <Compass className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advisor</p>
                <h1 className="font-display text-balance text-3xl font-semibold leading-[1.15] md:text-4xl">
                  Which AI tool should I use for this?
                </h1>
              </div>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              Describe a task. We&apos;ll pick the best tool from your toolkit, give you a copy-paste prompt, and
              flag the tools you should avoid &mdash; with sources.
            </p>
          </div>

          {/* Toolkit chip strip — the constraints. The algorithm only picks
              from these tools, so they need to be visible and editable.
              Header stacks vertically on the smallest screens to keep both the
              "Choosing from" label and the "Edit toolkit" CTA fully readable. */}
          <div className="mb-6 rounded-2xl border border-border/60 bg-surface-low/60 p-4 md:p-5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                Choosing from {userTools.length > 0 && <span className="text-muted-foreground">({userTools.length})</span>}
              </p>
              <Link
                href="/onboarding?next=/advisor"
                className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                <Settings2 className="h-3 w-3" aria-hidden />
                {userTools.length > 0 ? "Edit toolkit" : "Set up toolkit"}
              </Link>
            </div>
            {userTools.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {userTools.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {toolLabel(t)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                You haven&apos;t set up your toolkit yet, so we&apos;ll recommend from all major AI tools. Add your
                tools so we only suggest ones you can actually use.
              </p>
            )}
          </div>

          {/* What you'll get — 3-pane preview of the recommendation structure.
              On phones the elaborate cards crowded each other; we collapse to
              a single compact bar showing the three sections inline. The cards
              return at sm+ where the width supports them. */}
          <div className="mb-8">
            <div
              role="presentation"
              aria-label="What you'll get"
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-surface-low/60 px-3 py-2.5 text-[11px] sm:hidden"
            >
              <CompactPane Icon={Award} label="Best" tone="success" />
              <span aria-hidden className="h-3 w-px bg-border" />
              <CompactPane Icon={ArrowUpRight} label="Alternatives" tone="brand" />
              <span aria-hidden className="h-3 w-px bg-border" />
              <CompactPane Icon={AlertTriangle} label="Avoid" tone="warn" />
            </div>
            <ul className="hidden grid-cols-3 gap-3 text-xs sm:grid">
              <Pane Icon={Award} label="Best pick" tone="success" hint="with prompt" />
              <Pane Icon={ArrowUpRight} label="Alternatives" tone="brand" hint="when to use" />
              <Pane Icon={AlertTriangle} label="Avoid" tone="warn" hint="why not" />
            </ul>
          </div>

          <AdvisorForm isAuthed={!!user} hasToolkit={userTools.length > 0} />

          <RecentActivity
            kind="advisor"
            surfaceLabel="recommendations"
            emptyHint="When you ask the Advisor which tool to use, your recommendations are saved here for easy reference."
            EmptyIcon={Compass}
          />
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}

function CompactPane({
  Icon,
  label,
  tone,
}: {
  Icon: typeof Award
  label: string
  tone: "success" | "brand" | "warn"
}) {
  // Mobile-only inline version. No background card — just the icon + label
  // sharing one row. Used when the 3-card layout doesn't fit at phone widths.
  const color =
    tone === "success"
      ? "text-[color:var(--success)]"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : "text-primary"
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate font-semibold">{label}</span>
    </span>
  )
}

function Pane({
  Icon,
  label,
  hint,
  tone,
}: {
  Icon: typeof Award
  label: string
  hint: string
  tone: "success" | "brand" | "warn"
}) {
  // Each pane uses a single thematic accent that maps to the AdvisorResult
  // sections, so users see the visual language before the recommendation arrives.
  const styles =
    tone === "success"
      ? {
          card: "border-[color:var(--success)]/30 bg-[color:var(--success-soft)]",
          iconBg: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
          label: "text-[color:var(--success)]",
        }
      : tone === "warn"
      ? {
          card: "border-amber-200/70 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30",
          iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
          label: "text-amber-700 dark:text-amber-300",
        }
      : {
          card: "border-primary/25 bg-primary/5",
          iconBg: "bg-primary/15 text-primary",
          label: "text-primary",
        }

  return (
    <li className={`flex flex-col gap-1 rounded-xl border p-3 ${styles.card}`}>
      <div className={`grid h-7 w-7 place-items-center rounded-lg ${styles.iconBg}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles.label}`}>{label}</p>
      <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
    </li>
  )
}
