import { AuthForm } from "@/components/auth-form"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <AuthForm mode="login" />
    </div>
  )
}
