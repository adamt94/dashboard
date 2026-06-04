import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"
import { TrendingUp, LogOut } from "lucide-react"
import { CurrencySelector } from "@/components/currency-selector"
import { PortfolioSelector } from "@/components/portfolio-selector"
import { getBalance } from "@/app/actions/balance"
import { getPortfolios, getSelectedPortfolioId } from "@/app/actions/portfolios"

export async function DashboardHeader() {
  const session = await getSession()
  const { currency } = await getBalance()

  let portfolios = []
  let currentPortfolioId = null
  let portfoliosAvailable = false

  try {
    portfolios = await getPortfolios()
    currentPortfolioId = await getSelectedPortfolioId()
    portfoliosAvailable = true
  } catch (error) {
    // Portfolios table doesn't exist yet - migration not run
    console.log("[v0] Portfolios not available - run migration to enable multiple portfolios")
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Trading Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            {portfoliosAvailable && (
              <PortfolioSelector portfolios={portfolios} currentPortfolioId={currentPortfolioId} />
            )}
            <CurrencySelector currentCurrency={currency} />
            <span className="text-sm text-muted-foreground">{session?.email}</span>
            <form action={logout}>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
