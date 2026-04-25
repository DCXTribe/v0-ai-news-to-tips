import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { UnpackForm } from "@/components/unpack-form"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Unpack</p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] md:text-5xl">
              Turn an AI news link into things you can do today.
            </h1>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Paste a URL or the article text. We&apos;ll unpack it into 3-5 actionable tips with copy-paste prompts.
              {user && role && <> Tailored for your role and your selected AI tools.</>}
            </p>
          </div>
          <UnpackForm isAuthed={!!user} hasProfile={!!role} />
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
