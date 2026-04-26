import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { AskForm } from "@/components/ask-form"
import { RecentActivity } from "@/components/recent-activity"
import { MessageCircleQuestion, Globe2, Quote, Youtube, Briefcase } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getAnonUsageState } from "@/lib/anon-usage"
import { roleLabel } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * Ask page — purpose: free-form question, web-grounded answer.
 *
 * The differentiator vs Unpack/Advisor is that Ask searches the live web in
 * real time and cites every claim. The header surfaces this with a "real-time
 * sources" strip showing the three things we ground in: web articles, citation
 * quotes, optional video walkthroughs.
 */

const SAMPLE_QUESTIONS = [
  "How do I use ChatGPT to clean up an Excel spreadsheet?",
  "How can Copilot help me draft my weekly status update?",
  "How do I summarize a 30-minute Teams meeting with AI?",
  "How do I rewrite a long email to be 3 sentences?",
  "How can I use Claude Projects to research a competitor?",
]

export default async function AskPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("ai_daily_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    role = profile?.role ?? null
  }

  // Anonymous quota state for the form's badge / gate.
  const anonState = !user ? await getAnonUsageState() : null

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
          {/* Header — page identity */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <MessageCircleQuestion className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Ask</p>
                {/* Matches Today's mobile progression (2xl→3xl→4xl). */}
                <h1 className="font-display text-balance text-2xl font-semibold leading-[1.15] sm:text-3xl md:text-4xl">
                  Ask anything. Get prompts that actually work.
                </h1>
              </div>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              Describe a task or question. We&apos;ll search the web in real time and ground every tip in cited
              sources you can verify.
            </p>
            {user && role && (
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
                <Briefcase className="h-3 w-3 text-primary" aria-hidden />
                <span className="text-muted-foreground">Tailored for:</span>
                <span className="font-medium text-foreground">{roleLabel(role)}</span>
              </div>
            )}
          </div>

          {/* Real-time sources strip — what makes Ask different from Unpack/Advisor.
              Mobile: vertical stack so each cue's full label + hint stays readable.
              sm+: horizontal 3-col grid. */}
          <div className="mb-8 flex flex-col gap-2 rounded-2xl border border-border/60 bg-surface-low/60 p-3 sm:grid sm:grid-cols-3 sm:gap-3 md:p-4">
            <Cue Icon={Globe2} label="Live web" hint="searched on the fly" />
            <Cue Icon={Quote} label="Cited" hint="every claim sourced" />
            <Cue Icon={Youtube} label="Videos" hint="optional walkthroughs" />
          </div>

          <AskForm
            isAuthed={!!user}
            samples={SAMPLE_QUESTIONS}
            anonRemaining={anonState ? anonState.remaining.ask : null}
            anonResetsAt={anonState?.resetsAt ?? null}
          />

          <RecentActivity
            kind="question"
            surfaceLabel="questions"
            emptyHint="Your past questions and the tips we generated will live here. Ask one above to get started."
            EmptyIcon={MessageCircleQuestion}
          />
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}

function Cue({ Icon, label, hint }: { Icon: typeof Globe2; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-foreground">{label}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
