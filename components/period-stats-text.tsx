"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/currencies"
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PeriodStatsTextProps {
  weeklyPnL: number
  monthlyPnL: number
  yearlyPnL: number
  currency: string
}

export function PeriodStatsText({ weeklyPnL, monthlyPnL, yearlyPnL, currency }: PeriodStatsTextProps) {
  const safeWeeklyPnL = weeklyPnL ?? 0
  const safeMonthlyPnL = monthlyPnL ?? 0
  const safeYearlyPnL = yearlyPnL ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">7-Day P&L</CardTitle>
          {safeWeeklyPnL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${safeWeeklyPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
            {safeWeeklyPnL >= 0 ? "+" : ""}
            {formatCurrency(safeWeeklyPnL, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">30-Day P&L</CardTitle>
          {safeMonthlyPnL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${safeMonthlyPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
            {safeMonthlyPnL >= 0 ? "+" : ""}
            {formatCurrency(safeMonthlyPnL, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">365-Day P&L</CardTitle>
          {safeYearlyPnL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${safeYearlyPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
            {safeYearlyPnL >= 0 ? "+" : ""}
            {formatCurrency(safeYearlyPnL, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Last 365 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
