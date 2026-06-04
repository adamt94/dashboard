import { getSession } from "@/lib/session"
import { redirect } from 'next/navigation'
import { DashboardHeader } from "@/components/dashboard-header"
import { BalanceCard } from "@/components/balance-card"
import { AddTradeDialog } from "@/components/add-trade-dialog"
import { TradesTable } from "@/components/trades-table"
import { StatsCards } from "@/components/stats-cards"
import { BalanceHistoryChart } from "@/components/balance-history-chart"
import { ProfitLossChart } from "@/components/profit-loss-chart"
import { getBalance } from "@/app/actions/balance"
import { getTrades } from "@/app/actions/trades"
import { getAnalytics, getBalanceHistory, getProfitLossByPeriod } from "@/app/actions/analytics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PeriodStatsText } from "@/components/period-stats-text"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const balanceData = await getBalance()
  const displayCurrency = balanceData.currency

  const [trades, analytics, balanceHistory, profitLossData] = await Promise.all([
    getTrades(),
    getAnalytics(displayCurrency),
    getBalanceHistory("daily", displayCurrency),
    getProfitLossByPeriod("daily", displayCurrency),
  ])

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">Welcome back, {session.email}</p>
            </div>
            <AddTradeDialog defaultCurrency={displayCurrency} />
          </div>

          <StatsCards analytics={analytics} currency={displayCurrency} />

          <PeriodStatsText 
            weeklyPnL={analytics.weeklyProfitLoss}
            monthlyPnL={analytics.monthlyProfitLoss}
            yearlyPnL={analytics.yearlyProfitLoss}
            currency={displayCurrency}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <BalanceCard
                balance={balanceData.balance}
                baseBalance={balanceData.baseBalance}
                tradeProfitLoss={balanceData.tradeProfitLoss}
                updatedAt={balanceData.updated_at}
                currency={displayCurrency}
              />
            </div>
            <div className="lg:col-span-2">
              <ProfitLossChart key={displayCurrency} initialData={profitLossData} currency={displayCurrency} />
            </div>
          </div>

          <BalanceHistoryChart key={`bal-${displayCurrency}`} initialData={balanceHistory} currency={displayCurrency} />

          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>View and manage all your trades</CardDescription>
            </CardHeader>
            <CardContent>
              <TradesTable trades={trades} displayCurrency={displayCurrency} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
