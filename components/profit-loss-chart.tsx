"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PeriodStats } from "./period-stats"
import { getProfitLossByPeriod } from "@/app/actions/analytics"

interface ProfitLossChartProps {
  initialData: Array<{ date: string; profitLoss: number }>
  currency: string
}

export function ProfitLossChart({ initialData, currency }: ProfitLossChartProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily")
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (newPeriod: "daily" | "weekly" | "monthly" | "yearly") => {
    setPeriod(newPeriod)
    startTransition(async () => {
      const newData = await getProfitLossByPeriod(newPeriod, currency)
      setData(newData)
    })
  }

  const periodLabels = {
    daily: "Last 7 Days",
    weekly: "Last 12 Weeks",
    monthly: "Last 12 Months",
    yearly: "Last 5 Years",
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profit & Loss</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{periodLabels[period]}</p>
          </div>
          <Tabs value={period} onValueChange={(v) => handlePeriodChange(v as typeof period)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {isPending ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No trade data available yet</p>
          </div>
        ) : (
          <PeriodStats data={data} currency={currency} />
        )}
      </CardContent>
    </Card>
  )
}
