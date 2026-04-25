import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { tipId, status } = (await req.json()) as { tipId: string; status?: "saved" | "tried" }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { error } = await supabase.from("ai_daily_saves").upsert({
    user_id: user.id,
    tip_id: tipId,
    status: status ?? "saved",
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { tipId } = (await req.json()) as { tipId: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { error } = await supabase.from("ai_daily_saves").delete().eq("user_id", user.id).eq("tip_id", tipId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
