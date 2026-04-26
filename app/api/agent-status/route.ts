import { NextResponse } from "next/server"
import { getAgentStatus } from "@/lib/agent-status"

/**
 * Public, low-cost JSON endpoint consumed by the AgentActivityStrip's 30s
 * polling. The underlying data is cached for 5 minutes server-side via
 * unstable_cache, so this route's response is cheap even under burst.
 */
export const dynamic = "force-dynamic"

export async function GET() {
  const status = await getAgentStatus()
  return NextResponse.json(status, {
    headers: {
      // Edge / browser may cache for 60s; clients poll every 30s anyway.
      // SWR window keeps the strip rendering instantly while a refresh runs.
      "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
    },
  })
}
