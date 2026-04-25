import { generateText, Output } from "ai"
import { z } from "zod"
import { ROLES, TOOLS } from "@/lib/constants"

const MODEL = "openai/gpt-5-mini"

const tipSchema = z.object({
  title: z.string().describe("Action-oriented tip title, 4-9 words, no fluff"),
  why_it_matters: z.string().describe("One sentence explaining the practical benefit for the reader"),
  prompt: z
    .string()
    .describe(
      "A copy-paste ready prompt. Include placeholders in [SQUARE_BRACKETS] for things the user must replace. Should work in any major chat AI.",
    ),
  scenario: z
    .string()
    .describe("A short, concrete real-world scenario, 1-3 sentences. Example: 'You're prepping for a Monday meeting...'"),
  before_text: z.string().describe("How someone does this WITHOUT AI - the slow/manual way, 1-2 sentences"),
  after_text: z.string().describe("How they do it WITH AI using this tip, 1-2 sentences"),
  tools: z
    .array(z.string())
    .describe(
      "Subset of tool ids that this tip works on. Valid ids: " + TOOLS.map((t) => t.value).join(", "),
    ),
  time_saved: z.string().describe("Approximate time saved per use, e.g. '15 min', '1 hour'"),
})

const feedItemSchema = z.object({
  headline: z.string().describe("A short news-style headline about a recent AI capability or update"),
  summary: z
    .string()
    .describe("2-3 sentences explaining the news in plain language for a non-technical office worker"),
  category: z.string().describe("One of: New feature, Best practice, Workflow, Productivity, Industry update"),
  source_label: z.string().describe("Plain-English source descriptor, e.g. 'OpenAI', 'Microsoft', 'General'"),
  tip: tipSchema,
})

const dailyFeedSchema = z.object({
  items: z.array(feedItemSchema).min(5).max(6),
})

export type GeneratedTip = z.infer<typeof tipSchema>
export type GeneratedFeedItem = z.infer<typeof feedItemSchema>

const SYSTEM_BASE = `You are an editor for "AI Daily", a publication that turns recent AI news and capabilities into immediately usable tips for everyday office workers.

Your audience is NON-TECHNICAL professionals (marketers, managers, salespeople, HR, finance, teachers, etc.). They have heard about AI but don't know how to actually use it on Monday morning.

Rules for every tip you produce:
1. Be PRACTICAL. The reader must be able to do this in under 5 minutes.
2. Prompts must be COPY-PASTE READY with [BRACKETED] placeholders for the user's own content.
3. Avoid jargon. Never say "leverage", "synergy", or "ideate". Say "use", "save time".
4. Tips must work for the user's available tools. If a tip needs Copilot Pro, do NOT tag it with copilot_free.
5. Scenarios must be concrete (a meeting, an email, a spreadsheet) - never abstract.
6. Before/after must show real time savings, not vague benefits.`

export async function generateDailyFeed() {
  const today = new Date().toISOString().slice(0, 10)
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: dailyFeedSchema }),
    system: SYSTEM_BASE,
    prompt: `Generate today's edition (${today}) of AI Daily: 5-6 distinct news items, each paired with one usable tip.

Cover a mix of:
- A recent capability in Microsoft Copilot (Free or Pro/M365)
- A recent capability in ChatGPT (Free or Plus)
- A capability in Google Gemini, Claude, or Perplexity
- A general best-practice or workflow that uses AI to save time on a common office task
- An overlooked feature most people don't know exists

Each item should feel timely and actionable. Vary the categories. Make at least one tip work on free tools.`,
  })
  return output.items
}

export async function generateTipsFromArticle(args: {
  articleText: string
  role?: string | null
  tools?: string[] | null
}) {
  const { articleText, role, tools } = args
  const roleLine = role ? `The reader's role is: ${ROLES.find((r) => r.value === role)?.label ?? role}.` : ""
  const toolsLine =
    tools && tools.length > 0
      ? `The reader has access to ONLY these tools: ${tools.join(", ")}. Do not generate tips that require other tools.`
      : "Generate tips that work across major AI tools (Copilot, ChatGPT, Gemini, Claude, Perplexity)."

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        summary: z.string().describe("One paragraph plain-English summary of what's in the article."),
        tips: z.array(tipSchema).min(3).max(5),
      }),
    }),
    system: SYSTEM_BASE,
    prompt: `Read the following AI news article (or pasted content) and translate it into 3-5 immediately usable tips for the reader.

${roleLine}
${toolsLine}

Article / pasted content:
"""
${articleText.slice(0, 12000)}
"""`,
  })
  return output
}

export async function generateTipsFromQuestion(args: {
  question: string
  role?: string | null
  tools?: string[] | null
}) {
  const { question, role, tools } = args
  const roleLine = role ? `The reader's role is: ${ROLES.find((r) => r.value === role)?.label ?? role}.` : ""
  const toolsLine =
    tools && tools.length > 0
      ? `The reader has access to ONLY these tools: ${tools.join(", ")}. Do not generate tips that require other tools.`
      : "Generate tips that work across major AI tools."

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        summary: z.string().describe("One sentence framing of how AI can help with the user's question."),
        tips: z.array(tipSchema).min(3).max(5),
      }),
    }),
    system: SYSTEM_BASE,
    prompt: `The reader asked: "${question}"

${roleLine}
${toolsLine}

Generate 3-5 immediately usable tips that answer their question with copy-paste prompts and concrete scenarios.`,
  })
  return output
}
