import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { AdvisorForm } from "@/components/advisor-form"
import { createClient } from "@/lib/supabase/server"
import { toolLabel } from "@/lib/constants"

export const dynamic = "force-dynamic"

const SAMPLE_TASKS = [
  "Summarize a 50-page PDF report into 5 bullet points",
  "Draft a sales email to a CFO based on a LinkedIn profile",
  "Analyze a CSV with 5,000 rows and find anomalies",
  "Brainstorm a Q3 marketing campaign with image mockups",
  "Research a competitor's pricing changes this month",
]

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
        <section className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Advisor</p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Which AI tool should I use for this?
            </h1>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Describe a task. We&apos;ll pick the best tool from your toolkit, give you a copy-paste prompt, and
              flag the tools you should avoid for this specific job &mdash; with sources.
            </p>
            {userTools.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Your toolkit:</span>{" "}
                {userTools.map((t) => toolLabel(t)).join(" · ")}
              </p>
            )}
          </div>
          <AdvisorForm isAuthed={!!user} samples={SAMPLE_TASKS} hasToolkit={userTools.length > 0} />
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
