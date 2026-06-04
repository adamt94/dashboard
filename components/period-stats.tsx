"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { formatCurrency, getCurrencySymbol } from "@/lib/currencies"

interface PeriodStatsProps {
  data: Array<{ date: string; profitLoss: number }>
  currency: string
}

export function PeriodStats({ data, currency }: PeriodStatsProps) {
  const maxValue = Math.max(...data.map((d) => Math.abs(d.profitLoss)), 1)
  const yAxisDomain = [-maxValue * 1.2, maxValue * 1.2]

  const formatYAxis = (value: number) => {
    const symbol = getCurrencySymbol(currency)
    if (value === 0) return `${symbol}0`
    const abs = Math.abs(value)
    if (abs >= 1000000) {
      return `${value >= 0 ? "" : "-"}${symbol}${(abs / 1000000).toFixed(1)}M`
    }
    if (abs >= 1000) {
      return `${value >= 0 ? "" : "-"}${symbol}${(abs / 1000).toFixed(0)}k`
    }
    return `${symbol}${value.toFixed(0)}`
  }

  return (
    <div className="h-[300px] overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={11} 
            domain={yAxisDomain}
            tickFormatter={formatYAxis}
            tickCount={5}
            width={70}
            tickMargin={4}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const value = payload[0].value as number
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{payload[0].payload.date}</span>
                      <span className={`text-sm font-bold ${value >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {value >= 0 ? "+" : ""}
                        {formatCurrency(value, currency)}
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="profitLoss" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.profitLoss >= 0 ? "#16a34a" : "#dc2626"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
