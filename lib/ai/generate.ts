import { generateText, Output } from "ai"
import { z } from "zod"
import { ROLES, TOOLS } from "@/lib/constants"
import type { FirecrawlScrapeResult } from "@/lib/mcp/firecrawl"
import type { TavilyResult } from "@/lib/mcp/tavily"

const MODEL = "openai/gpt-5-mini"

// ---------- Shared schemas ----------

const citationSchema = z.object({
  url: z.string().describe("Exact URL the claim came from"),
  title: z.string().describe("Title or short label of the source"),
  quote: z
    .string()
    .describe("Short verbatim quote (under 200 chars) from the source that backs the tip"),
})

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
    .describe("Subset of tool ids that this tip works on. Valid ids: " + TOOLS.map((t) => t.value).join(", ")),
  time_saved: z.string().describe("Approximate time saved per use, e.g. '15 min', '1 hour'"),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe(
      "How well the cited sources support this tip. 'high' = directly supported, 'medium' = inferred from source, 'low' = best guess.",
    ),
  citations: z
    .array(citationSchema)
    .describe("0-3 citations from the provided sources. ONLY use the URLs given to you. Empty array if none apply."),
})

const feedItemSchema = z.object({
  headline: z.string().describe("A short news-style headline, ideally close to the source title"),
  summary: z.string().describe("2-3 sentences explaining the news in plain language for a non-technical office worker"),
  category: z.string().describe("One of: New feature, Best practice, Workflow, Productivity, Industry update"),
  source_label: z.string().describe("Plain-English source descriptor, e.g. 'OpenAI', 'Microsoft', 'Anthropic'"),
  tip: tipSchema,
})

export type GeneratedTip = z.infer<typeof tipSchema>
export type GeneratedFeedItem = z.infer<typeof feedItemSchema>
export type GeneratedCitation = z.infer<typeof citationSchema>

// ---------- System prompt ----------

const SYSTEM_BASE = `You are an editor for "AI Daily", a publication that turns recent AI news into immediately usable tips for everyday office workers.

Your audience is NON-TECHNICAL professionals (marketers, managers, salespeople, HR, finance, teachers, etc.). They have heard about AI but don't know how to actually use it on Monday morning.

Rules for every tip you produce:
1. Be PRACTICAL. The reader must be able to do this in under 5 minutes.
2. Prompts must be COPY-PASTE READY with [BRACKETED] placeholders for the user's own content.
3. Avoid jargon. Never say "leverage", "synergy", or "ideate". Say "use", "save time".
4. Tips must work for the user's available tools. If a tip needs Copilot Pro, do NOT tag it with copilot_free.
5. Scenarios must be concrete (a meeting, an email, a spreadsheet) - never abstract.
6. Before/after must show real time savings, not vague benefits.

GROUNDING RULES (critical):
- When source material is provided, your tip MUST be supported by that material.
- Cite ONLY URLs that are explicitly listed in the provided sources. Never invent a URL.
- Quotes in citations must be VERBATIM (no paraphrasing) and under 200 characters.
- Set confidence to "high" only if the source directly describes the capability you're recommending.
- If the sources are thin or only tangentially related, set confidence to "low" and use few or zero citations.
- Never claim a vendor "just released" something unless the source clearly states a release.`

// ---------- 1. Daily feed: generate tip from a single scraped news article ----------

export async function generateTipFromNewsItem(args: {
  article: FirecrawlScrapeResult
  vendor: string
}): Promise<GeneratedFeedItem> {
  const { article, vendor } = args

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: feedItemSchema }),
    system: SYSTEM_BASE,
    prompt: `Below is a recent post from ${article.publisher ?? vendor}. Translate it into ONE news-style entry with a usable tip.

The reader is a generalist office worker. Make the tip work on the most accessible tool tier available (free where possible).

The ONLY citation URL you may use is: ${article.url}
Quote text directly from the article markdown.

Source title: ${article.title}
Source URL: ${article.url}
${article.publishedAt ? `Published: ${article.publishedAt}` : ""}

Article markdown (truncated):
"""
${article.markdown.slice(0, 10000)}
"""`,
  })

  // Hard guard: strip any citations that aren't the canonical URL
  output.tip.citations = output.tip.citations.filter((c) => c.url === article.url)
  return output
}

// ---------- 2. Translate: tips from a single scraped article ----------

export async function generateTipsFromArticle(args: {
  article: FirecrawlScrapeResult
  role?: string | null
  tools?: string[] | null
}) {
  const { article, role, tools } = args
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
    prompt: `Read the following AI news article and translate it into 3-5 immediately usable tips for the reader.

${roleLine}
${toolsLine}

The ONLY citation URL you may use is: ${article.url}

Source title: ${article.title}
Source URL: ${article.url}
${article.publishedAt ? `Published: ${article.publishedAt}` : ""}

Article markdown (truncated):
"""
${article.markdown.slice(0, 10000)}
"""`,
  })

  // Hard guard
  output.tips = output.tips.map((t) => ({
    ...t,
    citations: t.citations.filter((c) => c.url === article.url),
  }))
  return output
}

// ---------- 3. Ask: tips grounded in Tavily search results ----------

export async function generateTipsFromQuestion(args: {
  question: string
  searchAnswer: string | null
  searchResults: TavilyResult[]
  role?: string | null
  tools?: string[] | null
}) {
  const { question, searchAnswer, searchResults, role, tools } = args
  const roleLine = role ? `The reader's role is: ${ROLES.find((r) => r.value === role)?.label ?? role}.` : ""
  const toolsLine =
    tools && tools.length > 0
      ? `The reader has access to ONLY these tools: ${tools.join(", ")}. Do not generate tips that require other tools.`
      : "Generate tips that work across major AI tools."

  const allowedUrls = new Set(searchResults.map((r) => r.url))
  const sourcesBlock = searchResults
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}
URL: ${r.url}
${r.publishedDate ? `Date: ${r.publishedDate}` : ""}
Snippet: ${r.content.slice(0, 600)}`,
    )
    .join("\n\n")

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

Use the sources below to ground your tips. ${
      searchAnswer ? `A search engine summarized the topic as: "${searchAnswer}".` : ""
    } You MAY only cite URLs from this list:
${Array.from(allowedUrls).join("\n")}

Sources:
${sourcesBlock}

Generate 3-5 immediately usable tips that answer their question with copy-paste prompts and concrete scenarios. Cite the sources that support each tip.`,
  })

  // Hard guard against hallucinated URLs
  output.tips = output.tips.map((t) => ({
    ...t,
    citations: t.citations.filter((c) => allowedUrls.has(c.url)),
  }))
  return output
}
