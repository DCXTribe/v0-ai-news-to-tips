// Thin wrapper around the Firecrawl REST API.
// Used to scrape article URLs (Translate) and vendor blogs (Daily Feed).
// Docs: https://docs.firecrawl.dev/

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1"

export type FirecrawlScrapeResult = {
  url: string
  title: string
  description: string | null
  markdown: string
  publisher: string | null
  publishedAt: string | null
}

type ScrapeApiResponse = {
  success: boolean
  data?: {
    markdown?: string
    metadata?: {
      title?: string
      description?: string
      sourceURL?: string
      url?: string
      publishedTime?: string
      "article:published_time"?: string
      ogSiteName?: string
      "og:site_name"?: string
      siteName?: string
    }
  }
  error?: string
}

function getKey(): string {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) throw new Error("FIRECRAWL_API_KEY is not set")
  return key
}

function deriveHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

/**
 * Scrape a single URL and return clean markdown + metadata.
 * Cap markdown to ~12k chars to keep prompt tokens sane.
 */
export async function scrapeUrl(url: string): Promise<FirecrawlScrapeResult> {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30000,
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Firecrawl scrape failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as ScrapeApiResponse
  if (!json.success || !json.data) {
    throw new Error(json.error || "Firecrawl returned no data")
  }

  const md = (json.data.markdown ?? "").slice(0, 12000)
  const meta = json.data.metadata ?? {}
  const publishedAt =
    meta.publishedTime || meta["article:published_time"] || null
  const publisher =
    meta.ogSiteName || meta["og:site_name"] || meta.siteName || deriveHost(url)

  return {
    url: meta.sourceURL || meta.url || url,
    title: meta.title || "Untitled",
    description: meta.description ?? null,
    markdown: md,
    publisher: publisher || null,
    publishedAt,
  }
}
