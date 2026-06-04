"use server"

import { getDb } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getSelectedPortfolioId } from "./portfolios"
import { convertCurrency } from "@/lib/exchange-rates"

export interface AnalyticsData {
  totalProfitLoss: number
  totalTrades: number
  openPositions: number
  closedPositions: number
  winRate: number
  weeklyProfitLoss: number
  monthlyProfitLoss: number
  yearlyProfitLoss: number
  profitableTrades: number
  losingTrades: number
}

function toLocalDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export async function getAnalytics(displayCurrency = "USD"): Promise<AnalyticsData> {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  const sql = getDb()
  const portfolioId = await getSelectedPortfolioId()

  const closedTrades = await sql`
    SELECT profit_loss, sell_date, currency
    FROM trades
    WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId} AND status = 'closed'
  ` as Array<{ profit_loss: string; sell_date: string; currency: string }>

  const counts = await sql`
    SELECT
      COUNT(*) as total_trades,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_positions,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_positions
    FROM trades
    WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
  ` as Array<{ total_trades: string; open_positions: string; closed_positions: string }>

  const totalTrades = Number.parseInt(counts[0].total_trades)
  const openPositions = Number.parseInt(counts[0].open_positions)
  const closedPositions = Number.parseInt(counts[0].closed_positions)

  let totalProfitLoss = 0
  let weeklyProfitLoss = 0
  let monthlyProfitLoss = 0
  let yearlyProfitLoss = 0
  let profitableTrades = 0
  let losingTrades = 0

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  for (const trade of closedTrades) {
    const profitLoss = Number.parseFloat(trade.profit_loss)
    if (isNaN(profitLoss)) continue

    const tradeCurrency = trade.currency || "USD"
    const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
    totalProfitLoss += convertedProfitLoss

    if (profitLoss > 0) {
      profitableTrades++
    } else if (profitLoss < 0) {
      losingTrades++
    }

    const sellDate = new Date(trade.sell_date)
    if (sellDate >= weekAgo) weeklyProfitLoss += convertedProfitLoss
    if (sellDate >= monthAgo) monthlyProfitLoss += convertedProfitLoss
    if (sellDate >= yearAgo) yearlyProfitLoss += convertedProfitLoss
  }

  const winRate = closedPositions > 0 ? (profitableTrades / closedPositions) * 100 : 0

  return {
    totalProfitLoss,
    totalTrades,
    openPositions,
    closedPositions,
    winRate,
    weeklyProfitLoss,
    monthlyProfitLoss,
    yearlyProfitLoss,
    profitableTrades,
    losingTrades,
  }
}

export async function getBalanceHistory(
  period: "daily" | "weekly" | "monthly" | "yearly" = "daily",
  displayCurrency = "USD"
) {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  const sql = getDb()
  const portfolioId = await getSelectedPortfolioId()

  const balanceResult = await sql`
    SELECT balance, currency
    FROM user_balance
    WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
  ` as Array<{ balance: string; currency: string }>

  if (balanceResult.length === 0) {
    return []
  }

  const initialBalance = Number.parseFloat(balanceResult[0].balance)
  const balanceCurrency = balanceResult[0].currency || "USD"
  const convertedInitialBalance = await convertCurrency(initialBalance, balanceCurrency, displayCurrency)

  // All closed trades ordered by sell date — used to build running balance
  const trades = await sql`
    SELECT sell_date, profit_loss, currency
    FROM trades
    WHERE user_id = ${session.userId}
      AND portfolio_id = ${portfolioId}
      AND status = 'closed'
      AND sell_date IS NOT NULL
      AND profit_loss IS NOT NULL
    ORDER BY sell_date ASC
  ` as Array<{ sell_date: string; profit_loss: string; currency: string }>

  // Build cumulative balance at each trade close
  const balancePoints: Array<{ date: Date; balance: number }> = []
  let runningBalance = convertedInitialBalance

  for (const trade of trades) {
    const profitLoss = Number.parseFloat(trade.profit_loss)
    if (isNaN(profitLoss)) continue

    const tradeCurrency = trade.currency || "USD"
    const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
    runningBalance += convertedProfitLoss
    balancePoints.push({ date: new Date(trade.sell_date), balance: runningBalance })
  }

  // For each period bucket, find the last known balance up to that point.
  // If there are no trades, all buckets show convertedInitialBalance (flat line).
  const now = new Date()
  let groupedData: Array<{ date: string; balance: number }> = []

  if (period === "daily") {
    // 30 points: 29 days ago → today
    let currentBalance = convertedInitialBalance
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }
      groupedData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: Number(currentBalance.toFixed(2)),
      })
    }
  } else if (period === "weekly") {
    // 12 points: 11 weeks ago → this week
    let currentBalance = convertedInitialBalance
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getTime() - (11 - i) * 7 * 24 * 60 * 60 * 1000)
      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }
      groupedData.push({
        date: `Week ${i + 1}`,
        balance: Number(currentBalance.toFixed(2)),
      })
    }
  } else if (period === "monthly") {
    // 12 points: 11 months ago → this month
    let currentBalance = convertedInitialBalance
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i + 1, 0) // last day of month
      const monthKey = new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }
      groupedData.push({ date: monthKey, balance: Number(currentBalance.toFixed(2)) })
    }
  } else if (period === "yearly") {
    // 5 points: 4 years ago → this year
    let currentBalance = convertedInitialBalance
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i
      const date = new Date(year, 11, 31) // end of year
      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }
      groupedData.push({ date: year.toString(), balance: Number(currentBalance.toFixed(2)) })
    }
  }

  return groupedData
}

export async function getProfitLossByPeriod(
  period: "daily" | "weekly" | "monthly" | "yearly" = "daily",
  displayCurrency = "USD"
) {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  const sql = getDb()
  const portfolioId = await getSelectedPortfolioId()
  const now = new Date()

  const trades = await sql`
    SELECT sell_date, profit_loss, currency
    FROM trades
    WHERE user_id = ${session.userId}
      AND portfolio_id = ${portfolioId}
      AND status = 'closed'
      AND sell_date IS NOT NULL
      AND profit_loss IS NOT NULL
    ORDER BY sell_date ASC
  ` as Array<{ sell_date: string; profit_loss: string; currency: string }>

  if (period === "daily") {
    // 7 buckets using local dates to avoid midnight UTC edge cases
    const dailyMap = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      dailyMap.set(toLocalDateKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)), 0)
    }

    for (const trade of trades) {
      const profitLoss = Number.parseFloat(trade.profit_loss)
      if (isNaN(profitLoss)) continue

      const dateKey = toLocalDateKey(new Date(trade.sell_date))
      if (!dailyMap.has(dateKey)) continue

      const tradeCurrency = trade.currency || "USD"
      const converted = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + converted)
    }

    return Array.from(dailyMap.entries()).map(([date, profitLoss]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      profitLoss: Number(profitLoss.toFixed(2)),
    }))
  }

  if (period === "weekly") {
    const weeklyMap = new Map<string, number>()
    for (let i = 11; i >= 0; i--) {
      weeklyMap.set(`Week ${12 - i}`, 0)
    }

    for (const trade of trades) {
      const profitLoss = Number.parseFloat(trade.profit_loss)
      if (isNaN(profitLoss)) continue

      const sellDate = new Date(trade.sell_date)
      const weeksAgo = Math.floor((now.getTime() - sellDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      if (weeksAgo < 0 || weeksAgo >= 12) continue

      const weekKey = `Week ${12 - weeksAgo}`
      const tradeCurrency = trade.currency || "USD"
      const converted = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + converted)
    }

    return Array.from(weeklyMap.entries()).map(([date, profitLoss]) => ({
      date,
      profitLoss: Number(profitLoss.toFixed(2)),
    }))
  }

  if (period === "monthly") {
    const monthlyMap = new Map<string, number>()
    for (let i = 11; i >= 0; i--) {
      const key = new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      monthlyMap.set(key, 0)
    }

    for (const trade of trades) {
      const profitLoss = Number.parseFloat(trade.profit_loss)
      if (isNaN(profitLoss)) continue

      const monthKey = new Date(trade.sell_date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      if (!monthlyMap.has(monthKey)) continue

      const tradeCurrency = trade.currency || "USD"
      const converted = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + converted)
    }

    return Array.from(monthlyMap.entries()).map(([date, profitLoss]) => ({
      date,
      profitLoss: Number(profitLoss.toFixed(2)),
    }))
  }

  // yearly — 5 points
  const yearlyMap = new Map<string, number>()
  for (let i = 4; i >= 0; i--) {
    yearlyMap.set((now.getFullYear() - i).toString(), 0)
  }

  for (const trade of trades) {
    const profitLoss = Number.parseFloat(trade.profit_loss)
    if (isNaN(profitLoss)) continue

    const yearKey = new Date(trade.sell_date).getFullYear().toString()
    if (!yearlyMap.has(yearKey)) continue

    const tradeCurrency = trade.currency || "USD"
    const converted = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
    yearlyMap.set(yearKey, (yearlyMap.get(yearKey) || 0) + converted)
  }

  return Array.from(yearlyMap.entries()).map(([date, profitLoss]) => ({
    date,
    profitLoss: Number(profitLoss.toFixed(2)),
  }))
}
