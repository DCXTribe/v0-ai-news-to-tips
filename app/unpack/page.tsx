import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { UnpackForm } from "@/components/unpack-form"
import { RecentActivity } from "@/components/recent-activity"
import { PackageOpen, Link2, Sparkles, Briefcase } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getAnonUsageState } from "@/lib/anon-usage"
import { roleLabel } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * Unpack page — input is an article. The page communicates the article→tip
 * pipeline visually with a 3-step "how it works" rail in the header, then
 * hands off to the URL-first composer.
 */
export default async function UnpackPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("ai_daily_profiles")
      .select("role, tools")
      .eq("id", user.id)
      .maybeSingle()
    role = profile?.role ?? null
  }

  // Anonymous quota state — read once on the server so the badge appears
  // populated on first paint, no client roundtrip needed.
  const anonState = !user ? await getAnonUsageState() : null

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
          {/* Header — page identity card */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <PackageOpen className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Unpack</p>
                {/* Title sizing matches Today's progression (2xl→3xl→4xl) so
                    long titles don't wrap to 4 lines on phones. */}
                <h1 className="font-display text-balance text-2xl font-semibold leading-[1.15] sm:text-3xl md:text-4xl">
                  Turn any article into things you can do today.
                </h1>
              </div>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              Paste an AI news link or article text. We&apos;ll extract 3-5 actionable tips with copy-paste prompts.
            </p>
            {user && role && (
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
                <Briefcase className="h-3 w-3 text-primary" aria-hidden />
                <span className="text-muted-foreground">Tailored for:</span>
                <span className="font-medium text-foreground">{roleLabel(role)}</span>
              </div>
            )}
          </div>

          {/* How it works — 3-step visual rail. Sets first-time user expectations:
              they paste, we scrape & extract, they get tips.
              Mobile: vertical stack so each step's full label + hint is readable.
              sm+: horizontal 3-col grid with subtle connector arrows. */}
          <ol className="mb-8 flex flex-col gap-2 rounded-2xl border border-border/60 bg-surface-low/60 p-3 sm:grid sm:grid-cols-3 sm:gap-2 md:p-4">
            <Step n={1} Icon={Link2} label="Paste URL" hint="or full text" />
            <Step n={2} Icon={PackageOpen} label="We unpack" hint="scrape + extract" />
            <Step n={3} Icon={Sparkles} label="Get tips" hint="ready to use" last />
          </ol>

          <UnpackForm
            isAuthed={!!user}
            hasProfile={!!role}
            anonRemaining={anonState ? anonState.remaining.unpack : null}
            anonResetsAt={anonState?.resetsAt ?? null}
          />

          <RecentActivity
            kind="paste"
            surfaceLabel="unpacks"
            emptyHint="When you unpack an article, it'll appear here so you can re-open it any time. Drop a URL above to start."
            EmptyIcon={PackageOpen}
          />
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}

function Step({
  n,
  Icon,
  label,
  hint,
  last,
}: {
  n: number
  Icon: typeof Link2
  label: string
  hint: string
  last?: boolean
}) {
  return (
    <li className="relative flex items-center gap-3 rounded-xl bg-card p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Step {n}
        </span>
        <p className="text-sm font-semibold leading-tight text-foreground">{label}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      </div>
      {!last && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1.5 top-1/2 hidden h-px w-3 -translate-y-1/2 bg-border md:block"
        />
      )}
    </li>
  )
}
