import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ROLES, SKILL_LEVELS, toolLabel } from "@/lib/constants"
import { Settings, Sparkles, BookMarked, Mail, Briefcase, Layers, Wrench, Pencil, LogOut } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/profile")

  const { data: profile } = await supabase
    .from("ai_daily_profiles")
    .select("role, tools, skill_level, onboarded, created_at")
    .eq("id", user.id)
    .maybeSingle()

  // Counts for the activity overview cards
  const [{ count: savedCount }, { count: historyCount }] = await Promise.all([
    supabase
      .from("ai_daily_saves")
      .select("tip_id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("ai_daily_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  const tools = (profile?.tools ?? []) as string[]
  const skillValue = profile?.skill_level ?? "beginner"
  const skillMeta = SKILL_LEVELS.find((s) => s.value === skillValue) ?? SKILL_LEVELS[0]
  const roleValue = profile?.role ?? null
  const roleMeta = ROLES.find((r) => r.value === roleValue)

  // Personalization completeness — drives the banner CTA
  const completeness =
    (roleValue ? 1 : 0) + (skillValue ? 1 : 0) + (tools.length > 0 ? 1 : 0)
  const isComplete = completeness === 3

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <section className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Profile</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Your account</h1>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              The shape of your toolkit and your role determine which tips, prompts, and recommendations we generate
              for you.
            </p>
          </div>

          {/* Identity card */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="flex flex-col gap-5 px-5 py-6 sm:px-6 sm:py-7">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-[var(--shadow-brand-soft)]">
                  {(user.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-base font-semibold tracking-tight">{user.email}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" aria-hidden />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!isComplete && (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold">Finish personalizing</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      You&apos;ve completed {completeness} of 3 steps. Tips get sharper with every step.
                    </p>
                  </div>
                  <Button asChild size="sm" className="rounded-xl">
                    <Link href="/onboarding?next=/profile">Resume setup</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity overview */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <Card className="overflow-hidden">
              <CardContent className="flex items-center justify-between gap-3 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                    <BookMarked className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold tracking-tight">{savedCount ?? 0}</span>
                    <span className="text-xs text-muted-foreground">Saved tips</span>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link href="/library">Open</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="flex items-center justify-between gap-3 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold tracking-tight">{historyCount ?? 0}</span>
                    <span className="text-xs text-muted-foreground">Sessions in history</span>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link href="/library">Open</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preferences */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-7">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
                  <p className="text-sm text-muted-foreground">Used to personalize every tip and recommendation.</p>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2 rounded-xl sm:mt-0">
                  <Link href="/onboarding?next=/profile">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Edit preferences
                  </Link>
                </Button>
              </div>

              {/* Role */}
              <PreferenceRow
                Icon={Briefcase}
                label="Role"
                empty={!roleMeta}
                value={roleMeta?.label ?? "Not set"}
                hint={roleMeta ? undefined : "Pick the closest match — we'll rewrite tips to fit."}
              />

              {/* Skill */}
              <PreferenceRow
                Icon={Layers}
                label="AI skill level"
                value={skillMeta.label}
                hint={skillMeta.description}
              />

              {/* Tools */}
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <Wrench className="h-4 w-4" aria-hidden />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Toolkit</p>
                  {tools.length === 0 ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      No tools selected. We&apos;ll show tips that work across major AI tools.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tools.map((t) => (
                        <Badge key={t} variant="secondary" className="rounded-full font-medium">
                          {toolLabel(t)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account actions */}
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col gap-3 px-5 py-6 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight">Account</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/auth/reset-password">
                    <Settings className="h-3.5 w-3.5" aria-hidden />
                    Change password
                  </Link>
                </Button>
                <form action="/auth/sign-out" method="post">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-xl text-muted-foreground hover:text-foreground sm:w-auto"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden />
                    Sign out
                  </Button>
                </form>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Need to delete your account? Email us &mdash; we&apos;ll wipe your library within 48 hours.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function PreferenceRow({
  Icon,
  label,
  value,
  hint,
  empty = false,
}: {
  Icon: typeof Briefcase
  label: string
  value: string
  hint?: string
  empty?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={empty ? "text-sm font-medium text-muted-foreground" : "text-sm font-semibold"}>{value}</p>
        {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
