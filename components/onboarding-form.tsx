"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ROLES, TOOLS, SKILL_LEVELS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function OnboardingForm({
  initialRole,
  initialTools,
  initialSkill,
}: {
  initialRole: string | null
  initialTools: string[]
  initialSkill: string
}) {
  const [role, setRole] = useState<string | null>(initialRole)
  const [tools, setTools] = useState<string[]>(initialTools)
  const [skill, setSkill] = useState<string>(initialSkill)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const toggleTool = (value: string) => {
    setTools((curr) => (curr.includes(value) ? curr.filter((t) => t !== value) : [...curr, value]))
  }

  const onSave = () => {
    if (!role) {
      toast.error("Pick the option that best matches your role.")
      return
    }
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
      toast.success("Preferences saved")
      router.push("/library")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Your role</h2>
            <p className="text-sm text-muted-foreground">Pick the closest match. We&apos;ll rewrite tips to fit.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROLES.map((r) => {
              const selected = role === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-background hover:bg-accent/50"
                  }`}
                  aria-pressed={selected}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">AI tools you have access to</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll only show tips that work with these. Select all that apply.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {TOOLS.map((t) => {
              const checked = tools.includes(t.value)
              return (
                <label
                  key={t.value}
                  htmlFor={`tool-${t.value}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition ${
                    checked
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-background hover:bg-accent/50"
                  }`}
                >
                  <Checkbox id={`tool-${t.value}`} checked={checked} onCheckedChange={() => toggleTool(t.value)} />
                  <span>{t.label}</span>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Your AI skill level</h2>
            <p className="text-sm text-muted-foreground">We&apos;ll adjust the depth of explanations.</p>
          </div>
          <RadioGroup value={skill} onValueChange={setSkill} className="grid gap-2 sm:grid-cols-3">
            {SKILL_LEVELS.map((s) => {
              const selected = skill === s.value
              return (
                <Label
                  key={s.value}
                  htmlFor={`skill-${s.value}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                    selected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-background hover:bg-accent/50"
                  }`}
                >
                  <RadioGroupItem value={s.value} id={`skill-${s.value}`} className="mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                  </div>
                </Label>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isPending} size="lg">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving...
            </>
          ) : (
            "Save preferences"
          )}
        </Button>
      </div>
    </div>
  )
}
