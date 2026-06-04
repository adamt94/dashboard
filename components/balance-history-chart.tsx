"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useTransition } from "react"
import { getBalanceHistory } from "@/app/actions/analytics"
import { formatCurrency, getCurrencySymbol } from "@/lib/currencies"

interface BalanceHistoryChartProps {
  initialData: Array<{ date: string; balance: number }>
  currency: string
}

export function BalanceHistoryChart({ initialData, currency }: BalanceHistoryChartProps) {
  const [data, setData] = useState(initialData)
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily")
  const [isPending, startTransition] = useTransition()

  const formatCompactCurrency = (value: number) => {
    const symbol = getCurrencySymbol(currency)
    const abs = Math.abs(value)
    if (abs >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`
    if (abs >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`
    return `${symbol}${value.toFixed(0)}`
  }

  const handlePeriodChange = (newPeriod: "daily" | "weekly" | "monthly" | "yearly") => {
    setPeriod(newPeriod)
    startTransition(async () => {
      const newData = await getBalanceHistory(newPeriod, currency)
      setData(newData)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balance History</CardTitle>
            <CardDescription>Initial balance + trade results over time</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => handlePeriodChange(v as typeof period)}>
            <TabsList>
              <TabsTrigger value="daily" disabled={isPending}>Daily</TabsTrigger>
              <TabsTrigger value="weekly" disabled={isPending}>Weekly</TabsTrigger>
              <TabsTrigger value="monthly" disabled={isPending}>Monthly</TabsTrigger>
              <TabsTrigger value="yearly" disabled={isPending}>Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {isPending || data.length > 0 ? (
          <div className="h-[300px] w-full overflow-hidden">
            <ChartContainer
              config={{
                balance: {
                  label: "Balance",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickCount={5}
                    tickFormatter={formatCompactCurrency}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value), currency)} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No balance history yet. Set an initial balance and close some trades to see your history.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
