import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Page() {
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
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>We sent a confirmation link to verify your account.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Click the link in the email to confirm, then come back and sign in.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
