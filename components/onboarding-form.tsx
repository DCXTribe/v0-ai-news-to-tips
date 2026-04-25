"use client"

import { useState, useTransition, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ROLES, TOOLS, SKILL_LEVELS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, ArrowRight, Check, Sparkles, Briefcase, Layers, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = 0 | 1 | 2 | 3 // 0: role, 1: skill, 2: tools, 3: done

const stepMeta: { id: Step; label: string; Icon: typeof Briefcase }[] = [
  { id: 0, label: "Your role", Icon: Briefcase },
  { id: 1, label: "Skill level", Icon: Layers },
  { id: 2, label: "Your toolkit", Icon: Wrench },
]

export function OnboardingForm({
  initialRole,
  initialTools,
  initialSkill,
  // When called from /profile, redirect back here with a friendlier toast.
  // When called fresh from /onboarding it goes to /library to start using the app.
  redirectTo = "/library",
}: {
  initialRole: string | null
  initialTools: string[]
  initialSkill: string
  redirectTo?: string
}) {
  const [step, setStep] = useState<Step>(0)
  const [role, setRole] = useState<string | null>(initialRole)
  const [tools, setTools] = useState<string[]>(initialTools)
  const [skill, setSkill] = useState<string>(initialSkill || "beginner")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const toolGroups = useMemo(() => {
    const groups: Record<string, typeof TOOLS[number][]> = {}
    for (const t of TOOLS) {
      const g = (t as { group?: string }).group ?? "Other"
      if (!groups[g]) groups[g] = []
      groups[g].push(t)
    }
    return groups
  }, [])

  const toggleTool = (value: string) => {
    setTools((curr) => (curr.includes(value) ? curr.filter((t) => t !== value) : [...curr, value]))
  }

  const onSave = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        toast.error("Please sign in again.")
        return
      }
      const { error } = await supabase.from("ai_daily_profiles").upsert({
        id: userId,
        role,
        tools,
        skill_level: skill,
        onboarded: true,
        updated_at: new Date().toISOString(),
      })
      if (error) {
        toast.error("Couldn't save: " + error.message)
        return
      }
      setStep(3)
    })
  }

  const canAdvance =
    (step === 0 && !!role) || (step === 1 && !!skill) || step === 2 // tools optional but encouraged

  // Done screen
  if (step === 3) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-12">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-brand-soft)]">
            <Sparkles className="h-7 w-7" aria-hidden />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">You&apos;re all set</h2>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Tips, prompts, and tool recommendations are now tuned to a {skillLabel(skill).toLowerCase()}{" "}
              {roleLabel(role)} who uses {tools.length === 0 ? "any AI tool" : `${tools.length} tool${tools.length === 1 ? "" : "s"}`}.
            </p>
          </div>
          <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row">
            <Button onClick={() => router.push(redirectTo)} className="rounded-xl">
              {redirectTo === "/library" ? "Open my library" : "Continue"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button onClick={() => setStep(0)} variant="ghost" className="rounded-xl">
              Edit again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress rail — desktop & mobile */}
      <ol className="flex items-center gap-2 sm:gap-3" aria-label="Setup steps">
        {stepMeta.map((meta, i) => {
          const isDone = i < step
          const isCurrent = i === step
          return (
            <li key={meta.id} className="flex flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => i <= step && setStep(meta.id)}
                disabled={i > step}
                className={cn(
                  "group flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition sm:gap-3 sm:px-4",
                  isCurrent && "border-primary bg-accent text-foreground shadow-[var(--shadow-brand-soft)]",
                  isDone && "border-primary/40 bg-card text-foreground hover:border-primary/60",
                  !isCurrent && !isDone && "border-border/60 bg-surface-low text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                    isCurrent && "bg-primary text-primary-foreground",
                    isDone && "bg-[color:var(--success)] text-[color:var(--success-foreground)]",
                    !isCurrent && !isDone && "bg-surface-high text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" aria-hidden /> : <meta.Icon className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <span className="hidden text-sm font-medium sm:inline">{meta.label}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide sm:hidden">
                  {`${i + 1}/${stepMeta.length}`}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Step body */}
      {step === 0 && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">What best describes your role?</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We&apos;ll rewrite tips so they sound useful for your job.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLES.map((r) => {
                const selected = role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
                      selected
                        ? "border-primary bg-accent text-foreground shadow-[var(--shadow-brand-soft)]"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
                    )}
                    aria-pressed={selected}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">How comfortable are you with AI?</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sets the depth of explanations and the sophistication of prompts we generate.
              </p>
            </div>
            <RadioGroup value={skill} onValueChange={setSkill} className="grid gap-3 sm:grid-cols-3">
              {SKILL_LEVELS.map((s) => {
                const selected = skill === s.value
                return (
                  <Label
                    key={s.value}
                    htmlFor={`skill-${s.value}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                      selected
                        ? "border-primary bg-accent text-foreground shadow-[var(--shadow-brand-soft)]"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
                    )}
                  >
                    <RadioGroupItem value={s.value} id={`skill-${s.value}`} className="mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold">{s.label}</span>
                      <span className="text-xs leading-relaxed text-muted-foreground">{s.description}</span>
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="flex flex-col gap-5 pt-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">Which AI tools do you use?</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We&apos;ll only suggest tips that work with these. You can change this anytime in your profile.
              </p>
            </div>

            {Object.entries(toolGroups).map(([group, list]) => (
              <div key={group} className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {list.map((t) => {
                    const checked = tools.includes(t.value)
                    return (
                      <label
                        key={t.value}
                        htmlFor={`tool-${t.value}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition",
                          checked
                            ? "border-primary bg-accent text-foreground shadow-[var(--shadow-brand-soft)]"
                            : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
                        )}
                      >
                        <Checkbox id={`tool-${t.value}`} checked={checked} onCheckedChange={() => toggleTool(t.value)} />
                        <span className="font-medium">{t.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}

            {tools.length === 0 && (
              <p className="rounded-lg border border-dashed border-border bg-surface-low/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                You can skip this step. We&apos;ll suggest tips that work across major AI tools.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer — back / next / save */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="lg"
          className="rounded-xl"
          onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
          disabled={step === 0 || isPending}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>

        {step < 2 ? (
          <Button
            size="lg"
            className="rounded-xl"
            onClick={() => setStep((s) => Math.min(2, s + 1) as Step)}
            disabled={!canAdvance}
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button size="lg" className="rounded-xl" onClick={onSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving...
              </>
            ) : (
              <>
                Save preferences
                <Check className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function roleLabel(value: string | null): string {
  if (!value) return "professional"
  return ROLES.find((r) => r.value === value)?.label.toLowerCase() ?? value
}

function skillLabel(value: string): string {
  return SKILL_LEVELS.find((s) => s.value === value)?.label ?? "Beginner"
}
