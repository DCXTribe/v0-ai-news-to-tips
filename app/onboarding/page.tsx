import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/onboarding-form"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/onboarding")

  const { data: profile } = await supabase
    .from("ai_daily_profiles")
    .select("role, tools, skill_level")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <section className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-16">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Personalize</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Tell us about your work</h1>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              We use this to filter and rewrite tips so they fit your role and only suggest tools you actually have.
            </p>
          </div>
          <OnboardingForm
            initialRole={profile?.role ?? null}
            initialTools={profile?.tools ?? []}
            initialSkill={profile?.skill_level ?? "beginner"}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
