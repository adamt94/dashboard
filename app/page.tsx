import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, Wallet } from "lucide-react"

export default async function HomePage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-balance">Track Your Trading Journey</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Monitor your stocks, crypto, and investments all in one place. Make smarter decisions with detailed
              analytics.
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <a href="/register">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/login">Sign In</a>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Track Trades</h3>
              <p className="text-muted-foreground">
                Record every buy and sell with detailed information about your positions
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">View Analytics</h3>
              <p className="text-muted-foreground">
                Analyze your performance with comprehensive stats and visualizations
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Manage Balance</h3>
              <p className="text-muted-foreground">Keep track of your account balance and capital allocation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
