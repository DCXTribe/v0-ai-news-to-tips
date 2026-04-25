import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role client. Bypasses RLS. Only use in server contexts where you
 * need to write public data (e.g. caching the daily feed).
 */
export function createServiceClient() {
  return createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
