"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { TipCard, type Tip } from "@/components/tip-card"
import { ResultsCta } from "@/components/results-cta"
import { toast } from "sonner"
import { Loader2, Sparkles, Link2 } from "lucide-react"

export function UnpackForm({ isAuthed, hasProfile }: { isAuthed: boolean; hasProfile: boolean }) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [tips, setTips] = useState<Tip[] | null>(null)
  const [source, setSource] = useState<{ url: string; title: string; publisher: string | null } | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim().length < 20) {
      toast.error("Paste an article URL or at least a short excerpt.")
      return
    }
    setLoading(true)
    setSummary(null)
    setTips(null)
    setSource(null)
    try {
      const res = await fetch("/api/unpack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? "Failed")
      }
      const data = (await res.json()) as {
        summary: string
        tips: Tip[]
        source: { url: string; title: string; publisher: string | null } | null
      }
      setSummary(data.summary)
      setTips(data.tips)
      setSource(data.source)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="border-border/70 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="article-input" className="flex items-center gap-1.5 text-sm font-medium">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                Article URL or pasted text
              </Label>
              <Textarea
                id="article-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
                placeholder="https://openai.com/blog/... or paste the article content here"
                className="resize-y rounded-xl"
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
              <Button type="submit" disabled={loading} size="lg" className="ml-auto rounded-xl">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Unpacking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Unpack into tips
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {summary && (
        <div className="rounded-2xl border border-border/70 bg-accent/40 p-5">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            What this article said
          </div>
          <p className="text-sm leading-relaxed">{summary}</p>
          {source && (
            <p className="mt-2 text-xs text-muted-foreground">
              Source:{" "}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {source.title}
              </a>
              {source.publisher ? ` · ${source.publisher}` : ""}
            </p>
          )}
        </div>
      )}

      {tips && tips.length > 0 && (
        <div className="flex flex-col gap-5">
          <ResultsCta isAuthed={isAuthed} kind="unpack" />
          <div>
            <h2 className="font-display mb-4 text-2xl font-semibold tracking-tight">
              {tips.length} tip{tips.length === 1 ? "" : "s"} for you
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {tips.map((t) => (
                <TipCard key={t.id} tip={t} isAuthed={isAuthed} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
