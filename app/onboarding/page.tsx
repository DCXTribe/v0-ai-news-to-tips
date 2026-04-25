import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/onboarding-form"

export const dynamic = "force-dynamic"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/onboarding")

  const { data: profile } = await supabase
    .from("ai_daily_profiles")
    .select("role, tools, skill_level, onboarded")
    .eq("id", user.id)
    .maybeSingle()

  const params = await searchParams
  // Whitelist the redirect target so it can't be abused as an open redirect.
  const safeNext =
    params.next && /^\/[a-zA-Z0-9/_-]*$/.test(params.next) ? params.next : "/library"

  const isReturning = !!profile?.onboarded

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <section className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {isReturning ? "Edit preferences" : "Welcome"}
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {isReturning ? "Update what we know about you" : "Let's tune your feed in 30 seconds"}
            </h1>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              {isReturning
                ? "Change anything below and we'll re-personalize tips, prompts, and tool recommendations on your next visit."
                : "Three quick questions. Skip any of them — but the more you tell us, the more useful every tip becomes."}
            </p>
          </div>
          <OnboardingForm
            initialRole={profile?.role ?? null}
            initialTools={profile?.tools ?? []}
            initialSkill={profile?.skill_level ?? "beginner"}
            redirectTo={safeNext}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
