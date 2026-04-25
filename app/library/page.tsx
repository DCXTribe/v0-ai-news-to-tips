import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TipCard, type Tip } from "@/components/tip-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { History, Sparkles, FileText, MessageCircleQuestion } from "lucide-react"

export const dynamic = "force-dynamic"

type HistoryRow = {
  id: string
  kind: string
  input: string
  summary: string | null
  created_at: string
  tip_ids: string[]
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/library")

  // Saved tips with full tip data
  const { data: savesRaw } = await supabase
    .from("ai_daily_saves")
    .select("status, created_at, tip:ai_daily_tips(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const saves =
    (savesRaw ?? []).flatMap((row) => {
      const t = row.tip as unknown as Tip | null
      return t ? [{ tip: t, status: row.status as string }] : []
    }) ?? []

  // History
  const { data: historyRaw } = await supabase
    .from("ai_daily_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
  const history = (historyRaw ?? []) as HistoryRow[]

  return (
    <div className="flex min-h-svh flex-col pb-20 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Library</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Your AI playbook</h1>
              <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
                Tips you saved and translations you&apos;ve generated. Build a personal collection of prompts that
                actually work for your job.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/translate">
                  <FileText className="h-4 w-4" aria-hidden />
                  Translate article
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/ask">
                  <MessageCircleQuestion className="h-4 w-4" aria-hidden />
                  Ask a question
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="saved">
            <TabsList>
              <TabsTrigger value="saved">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Saved tips ({saves.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-3.5 w-3.5" aria-hidden />
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="mt-6">
              {saves.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="font-medium">No saved tips yet</p>
                      <p className="text-sm text-muted-foreground">
                        Browse{" "}
                        <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
                          today&apos;s tips
                        </Link>{" "}
                        and tap &quot;Save&quot; on the ones you want to use.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {saves.map(({ tip }) => (
                    <TipCard key={tip.id} tip={tip} isAuthed isSaved />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {history.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <History className="h-8 w-8 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="font-medium">No translations yet</p>
                      <p className="text-sm text-muted-foreground">
                        Your past translations and questions will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ul className="flex flex-col gap-3">
                  {history.map((h) => (
                    <li key={h.id}>
                      <Card>
                        <CardContent className="flex flex-col gap-2 py-4">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                              {h.kind === "paste" ? "Article" : "Question"}
                            </span>
                            <span>{new Date(h.created_at).toLocaleString()}</span>
                            <span>·</span>
                            <span>
                              {h.tip_ids?.length ?? 0} tip{(h.tip_ids?.length ?? 0) === 1 ? "" : "s"}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm">{h.input}</p>
                          {h.summary && <p className="text-sm text-muted-foreground">{h.summary}</p>}
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
