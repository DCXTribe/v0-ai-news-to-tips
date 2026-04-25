import { generateText, Output } from "ai"
import { z } from "zod"
import { ROLES, TOOLS, SKILL_LEVELS } from "@/lib/constants"
import type { FirecrawlScrapeResult } from "@/lib/mcp/firecrawl"
import type { TavilyResult } from "@/lib/mcp/tavily"

const MODEL = "openai/gpt-5-mini"

// Map a stored skill_level to a precise instruction the model can follow.
function skillInstruction(skill: string | null | undefined): string {
  const value = skill ?? "beginner"
  const known = SKILL_LEVELS.find((s) => s.value === value)?.value ?? "beginner"
  if (known === "beginner") {
    return "The reader is a BEGINNER with AI tools. Explain every step. Spell out where to click. No jargon. Keep prompts short and surface-level."
  }
  if (known === "intermediate") {
    return "The reader is an INTERMEDIATE user (uses AI a few times a week). Skip the basics. Give richer prompts with structure (sections, bullets, role-play framing)."
  }
  return "The reader is an ADVANCED power user. Use sophisticated patterns: chain-of-thought, multi-shot examples, role + constraints, output schemas. Skip basic explanations."
}

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

// ---------- Tool Advisor schemas ----------

const toolPickSchema = z.object({
  tool: z
    .string()
    .describe(
      "Tool id from this list (use exactly one of these strings): " + TOOLS.map((t) => t.value).join(", "),
    ),
  reason: z.string().describe("Why this tool fits the task. 1-2 plain-English sentences."),
})

const advisorSchema = z.object({
  task_summary: z.string().describe("One sentence rephrasing of the user's task in plain language."),
  best_pick: toolPickSchema.extend({
    prompt: z
      .string()
      .describe("Copy-paste ready prompt for this tool. Use [BRACKETED] placeholders for the user's content."),
    watch_outs: z
      .array(z.string())
      .describe("0-3 short heads-ups about limits, file size, privacy, etc. Empty array if none."),
  }),
  alternatives: z
    .array(
      toolPickSchema.extend({
        when_to_pick_this: z
          .string()
          .describe("One sentence on when this alternative is better than the best pick."),
      }),
    )
    .describe("0-2 strong alternatives. Empty array if there are no equally good options."),
  avoid: z
    .array(
      z.object({
        tool: z.string().describe("Tool id from the same list, that the user should NOT use for this task."),
        reason: z.string().describe("One sentence explaining the limitation."),
      }),
    )
    .describe("0-3 tools to avoid for this specific task. Empty array if none. Be specific, not generic."),
  citations: z
    .array(citationSchema)
    .describe("0-4 citations. ONLY use URLs from the provided sources."),
})

export type GeneratedAdvisorOutput = z.infer<typeof advisorSchema>

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
${article.markdown.slice(0, 8000)}
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
  skillLevel?: string | null
}) {
  const { article, role, tools, skillLevel } = args
  const roleLine = role ? `The reader's role is: ${ROLES.find((r) => r.value === role)?.label ?? role}.` : ""
  const toolsLine =
    tools && tools.length > 0
      ? `The reader has access to ONLY these tools: ${tools.join(", ")}. Do not generate tips that require other tools.`
      : "Generate tips that work across major AI tools (Copilot, ChatGPT, Gemini, Claude, Perplexity, Kimi, DeepSeek, Qwen)."
  const skillLine = skillInstruction(skillLevel)

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
${skillLine}

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
  skillLevel?: string | null
}) {
  const { question, searchAnswer, searchResults, role, tools, skillLevel } = args
  const roleLine = role ? `The reader's role is: ${ROLES.find((r) => r.value === role)?.label ?? role}.` : ""
  const toolsLine =
    tools && tools.length > 0
      ? `The reader has access to ONLY these tools: ${tools.join(", ")}. Do not generate tips that require other tools.`
      : "Generate tips that work across major AI tools."
  const skillLine = skillInstruction(skillLevel)

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
${skillLine}

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

// ---------- 4. Tool Advisor: recommend the best AI tool for a task ----------

export async function generateToolRecommendation(args: {
  task: string
  searchAnswer: string | null
  searchResults: TavilyResult[]
  availableTools?: string[] | null // user's onboarding selection
  role?: string | null
  skillLevel?: string | null
}) {
  const { task, searchAnswer, searchResults, availableTools, role, skillLevel } = args
  const roleLine = role ? `The reader's role is: ${ROLES.find((r) => r.value === role)?.label ?? role}.` : ""
  const skillLine = skillInstruction(skillLevel)
  const toolsLine =
    availableTools && availableTools.length > 0
      ? `The reader has access to ONLY these tools, recommend ONLY from this list: ${availableTools.join(", ")}. If none of them fit the task well, still pick the closest match and be honest about its limits in watch_outs.`
      : `The reader has not specified which tools they own. You may recommend from any of: ${TOOLS.map((t) => t.value).join(", ")}.`

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
    output: Output.object({ schema: advisorSchema }),
    system: `${SYSTEM_BASE}

You are now in TOOL ADVISOR mode. Your job is to recommend which AI tool from the user's toolkit is the BEST fit for the task they described, with honest reasoning grounded in the sources provided.

Tool Advisor rules (in addition to the base rules):
- Be DECISIVE. Pick one best tool, don't hedge with "any of these works".
- Be HONEST. If the user's free-tier tool can't do something well, say so in watch_outs.
- Give SPECIFIC reasons tied to capability (file size limits, model strength, integrations, real-time web, image gen, etc.). Never use generic praise.
- "Avoid" entries must be specific to THIS task, not generic ("ChatGPT Free has no internet" only if the task needs current info).
- The prompt for the best pick must be tailored to that tool's strengths.
- Use the same toolValue strings exactly as listed.`,
    prompt: `The reader described this task: "${task}"

${roleLine}
${toolsLine}
${skillLine}

${searchAnswer ? `Search engine summary of the topic: "${searchAnswer}".` : ""}

You MAY only cite URLs from this list:
${Array.from(allowedUrls).join("\n")}

Sources:
${sourcesBlock}

Recommend the single best tool for this task, give 0-2 alternatives with the situation in which to pick them instead, and 0-3 specific tools to avoid for this task with reasons. Provide a copy-paste prompt tailored to the best pick.`,
  })

  // Hard guards
  output.citations = output.citations.filter((c) => allowedUrls.has(c.url))
  // Strip recommendations for tools that aren't real
  const validToolValues = new Set(TOOLS.map((t) => t.value))
  if (!validToolValues.has(output.best_pick.tool)) {
    // Fallback: pick first available tool to avoid downstream crashes
    output.best_pick.tool = availableTools?.[0] ?? TOOLS[0].value
  }
  output.alternatives = output.alternatives.filter((a) => validToolValues.has(a.tool))
  output.avoid = output.avoid.filter((a) => validToolValues.has(a.tool))
  return output
}
