import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react"
import type { AnalyticsData } from "@/app/actions/analytics"
import { formatCurrency } from "@/lib/currencies"

interface StatsCardsProps {
  analytics: AnalyticsData
  currency: string
}

export function StatsCards({ analytics, currency }: StatsCardsProps) {
  const isProfitable = analytics.totalProfitLoss >= 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${isProfitable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {isProfitable ? "+" : ""}
            {formatCurrency(analytics.totalProfitLoss, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">All-time performance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.profitableTrades} wins / {analytics.losingTrades} losses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalTrades}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.openPositions} open / {analytics.closedPositions} closed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly P&L</CardTitle>
          {analytics.monthlyProfitLoss >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${analytics.monthlyProfitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {analytics.monthlyProfitLoss >= 0 ? "+" : ""}
            {formatCurrency(analytics.monthlyProfitLoss, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
