import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AskForm } from "@/components/ask-form"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const SAMPLE_QUESTIONS = [
  "How do I use ChatGPT to clean up an Excel spreadsheet?",
  "How can Copilot help me draft my weekly status update?",
  "How do I summarize a 30-minute Teams meeting with AI?",
  "How do I rewrite a long email to be 3 sentences?",
  "How can I use Claude Projects to research a competitor?",
]

export default async function AskPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Ask</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ask anything. Get prompts that actually work.
            </h1>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Describe a task or a question. We&apos;ll generate practical tips with copy-paste prompts you can use in
              Copilot, ChatGPT, Gemini, Claude or Perplexity.
            </p>
          </div>
          <AskForm isAuthed={!!user} samples={SAMPLE_QUESTIONS} />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
