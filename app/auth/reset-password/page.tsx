"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Page() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  // The user arrives here after clicking the recovery link, which routes
  // through /auth/callback and exchanges the code for a session. If there's
  // no session, the link expired or was already used.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user)
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push("/library")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Couldn't update password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            AI Daily
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Set a new password</CardTitle>
            <CardDescription>
              {checking
                ? "Verifying your reset link..."
                : hasSession
                  ? "Choose a new password for your account."
                  : "This link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <p className="text-sm text-muted-foreground">Just a moment...</p>
            ) : !hasSession ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Reset links can only be used once and expire after 1 hour. Request a fresh one to continue.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/forgot-password">Send a new reset link</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/auth/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      required
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update password"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
