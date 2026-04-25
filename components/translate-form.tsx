"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { TipCard, type Tip } from "@/components/tip-card"
import { toast } from "sonner"
import { Loader2, Wand2 } from "lucide-react"

export function TranslateForm({ isAuthed, hasProfile }: { isAuthed: boolean; hasProfile: boolean }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [tips, setTips] = useState<Tip[] | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim().length < 20) {
      toast.error("Paste an article URL or at least a short excerpt.")
      return
    }
    setLoading(true)
    setSummary(null)
    setTips(null)
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? "Failed")
      }
      const data = (await res.json()) as { summary: string; tips: Tip[] }
      setSummary(data.summary)
      setTips(data.tips)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="article-input">Article URL or pasted text</Label>
              <Textarea
                id="article-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
                placeholder="https://openai.com/blog/... or paste the article content here"
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Tip: pasting the full text works better than a URL behind a paywall.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {!isAuthed && (
                <p className="text-xs text-muted-foreground">
                  Sign in to save these tips to your library and tailor them to your role.
                </p>
              )}
              {isAuthed && !hasProfile && (
                <p className="text-xs text-muted-foreground">
                  Set your role and tools in{" "}
                  <a href="/onboarding" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Preferences
                  </a>{" "}
                  to personalize results.
                </p>
              )}
              <Button type="submit" disabled={loading} className="ml-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" aria-hidden />
                    Translate into tips
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {summary && (
        <div className="rounded-md border border-border bg-accent/30 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Summary</div>
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>
      )}

      {tips && tips.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            {tips.length} tip{tips.length === 1 ? "" : "s"} for you
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {tips.map((t) => (
              <TipCard key={t.id} tip={t} isAuthed={isAuthed} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
