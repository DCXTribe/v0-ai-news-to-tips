// Thin wrapper around the Tavily Search API.
// Used by /ask to ground answers in current sources.
// Docs: https://docs.tavily.com/

const TAVILY_BASE = "https://api.tavily.com"

export type TavilyResult = {
  title: string
  url: string
  content: string // already-summarised snippet
  publishedDate: string | null
  score: number
}

type SearchApiResponse = {
  results?: Array<{
    title: string
    url: string
    content: string
    published_date?: string | null
    score?: number
  }>
  answer?: string | null
}

function getKey(): string {
  const key = process.env.TAVILY_API_KEY
  if (!key) throw new Error("TAVILY_API_KEY is not set")
  return key
}

export async function tavilySearch(
  query: string,
  opts: {
    maxResults?: number
    days?: number // recency window
    includeDomains?: string[]
  } = {},
): Promise<{ answer: string | null; results: TavilyResult[] }> {
  const body = {
    api_key: getKey(),
    query,
    search_depth: "advanced",
    topic: "general",
    max_results: opts.maxResults ?? 6,
    days: opts.days ?? 60,
    include_answer: true,
    include_raw_content: false,
    include_domains: opts.includeDomains,
  }

  const res = await fetch(`${TAVILY_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Tavily search failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as SearchApiResponse
  const results: TavilyResult[] = (json.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    publishedDate: r.published_date ?? null,
    score: r.score ?? 0,
  }))

  return { answer: json.answer ?? null, results }
}
