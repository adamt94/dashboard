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
  `

  // Get counts
  const counts = await sql`
    SELECT 
      COUNT(*) as total_trades,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_positions,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_positions
    FROM trades
    WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
  `

  const totalTrades = Number.parseInt(counts[0].total_trades)
  const openPositions = Number.parseInt(counts[0].open_positions)
  const closedPositions = Number.parseInt(counts[0].closed_positions)

  // Calculate profit/loss metrics
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
    const tradeCurrency = trade.currency || "USD"

    const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
    totalProfitLoss += convertedProfitLoss

    if (profitLoss > 0) {
      profitableTrades++
    } else if (profitLoss < 0) {
      losingTrades++
    }

    const sellDate = new Date(trade.sell_date)
    if (sellDate >= weekAgo) {
      weeklyProfitLoss += convertedProfitLoss
    }
    if (sellDate >= monthAgo) {
      monthlyProfitLoss += convertedProfitLoss
    }
    if (sellDate >= yearAgo) {
      yearlyProfitLoss += convertedProfitLoss
    }
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

export async function getMonthlyChartData(displayCurrency = "USD") {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  const sql = getDb()
  const portfolioId = await getSelectedPortfolioId()

  const trades = await sql`
    SELECT 
      DATE_TRUNC('month', sell_date) as month,
      profit_loss,
      currency
    FROM trades
    WHERE user_id = ${session.userId} 
      AND portfolio_id = ${portfolioId}
      AND status = 'closed'
      AND sell_date >= NOW() - INTERVAL '12 months'
    ORDER BY sell_date ASC
  `

  const monthlyData = new Map<string, number>()

  for (const trade of trades) {
    const monthKey = new Date(trade.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    const profitLoss = Number.parseFloat(trade.profit_loss)
    const tradeCurrency = trade.currency || "USD"
    const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)

    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + convertedProfitLoss)
  }

  return Array.from(monthlyData.entries()).map(([month, profitLoss]) => ({
    month,
    profitLoss,
  }))
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

  // Get initial balance
  const balanceResult = await sql`
    SELECT balance, currency
    FROM user_balance
    WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
  `

  if (balanceResult.length === 0) {
    return []
  }

  const initialBalance = Number.parseFloat(balanceResult[0].balance)
  const balanceCurrency = balanceResult[0].currency || "USD"
  const convertedInitialBalance = await convertCurrency(initialBalance, balanceCurrency, displayCurrency)

  // Get all closed trades ordered by sell date
  const trades = await sql`
    SELECT sell_date, profit_loss, currency
    FROM trades
    WHERE user_id = ${session.userId} 
      AND portfolio_id = ${portfolioId}
      AND status = 'closed'
      AND sell_date IS NOT NULL
    ORDER BY sell_date ASC
  `

  if (trades.length === 0) {
    // No trades yet, just return the initial balance
    return [
      {
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: convertedInitialBalance,
      },
    ]
  }

  // Calculate balance at each trade point
  const balancePoints: Array<{ date: Date; balance: number }> = []
  let runningBalance = convertedInitialBalance

  for (const trade of trades) {
    const profitLoss = Number.parseFloat(trade.profit_loss)
    const tradeCurrency = trade.currency || "USD"
    const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)

    runningBalance += convertedProfitLoss
    balancePoints.push({
      date: new Date(trade.sell_date),
      balance: runningBalance,
    })
  }

  // Group by period
  const now = new Date()
  let groupedData: Array<{ date: string; balance: number }> = []

  if (period === "daily") {
    // Group by day for last 30 days
    const daysAgo = 30
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    const dailyMap = new Map<string, number>()

    // Initialize with initial balance
    let currentBalance = convertedInitialBalance

    for (let i = 0; i <= daysAgo; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split("T")[0]

      // Find trades up to this date
      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }

      dailyMap.set(dateKey, currentBalance)
    }

    groupedData = Array.from(dailyMap.entries()).map(([date, balance]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      balance: Number(balance.toFixed(2)),
    }))
  } else if (period === "weekly") {
    // Group by week for last 12 weeks
    const weeksAgo = 12
    const startDate = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000)

    const weeklyMap = new Map<string, number>()
    let currentBalance = convertedInitialBalance

    for (let i = 0; i <= weeksAgo; i++) {
      const date = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
      const weekKey = `Week ${i + 1}`

      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }

      weeklyMap.set(weekKey, currentBalance)
    }

    groupedData = Array.from(weeklyMap.entries()).map(([date, balance]) => ({
      date,
      balance: Number(balance.toFixed(2)),
    }))
  } else if (period === "monthly") {
    // Group by month for last 12 months
    const monthsAgo = 12
    const monthlyMap = new Map<string, number>()
    let currentBalance = convertedInitialBalance

    for (let i = monthsAgo; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }

      monthlyMap.set(monthKey, currentBalance)
    }

    groupedData = Array.from(monthlyMap.entries()).map(([date, balance]) => ({
      date,
      balance: Number(balance.toFixed(2)),
    }))
  } else if (period === "yearly") {
    // Group by year for last 5 years
    const yearsAgo = 5
    const yearlyMap = new Map<string, number>()
    let currentBalance = convertedInitialBalance

    for (let i = yearsAgo; i >= 0; i--) {
      const year = now.getFullYear() - i
      const date = new Date(year, 11, 31) // End of year
      const yearKey = year.toString()

      const tradesUpToDate = balancePoints.filter((bp) => bp.date <= date)
      if (tradesUpToDate.length > 0) {
        currentBalance = tradesUpToDate[tradesUpToDate.length - 1].balance
      }

      yearlyMap.set(yearKey, currentBalance)
    }

    groupedData = Array.from(yearlyMap.entries()).map(([date, balance]) => ({
      date,
      balance: Number(balance.toFixed(2)),
    }))
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
  let startDate: Date
  let groupedData: Array<{ date: string; profitLoss: number }> = []

  // Get closed trades
  const trades = await sql`
    SELECT sell_date, profit_loss, currency
    FROM trades
    WHERE user_id = ${session.userId} 
      AND portfolio_id = ${portfolioId}
      AND status = 'closed'
      AND sell_date IS NOT NULL
    ORDER BY sell_date ASC
  `

  if (period === "daily") {
    const dailyMap = new Map<string, number>()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split("T")[0]
      dailyMap.set(dateKey, 0)
    }

    for (const trade of trades) {
      const sellDate = new Date(trade.sell_date)
      const dateKey = sellDate.toISOString().split("T")[0]
      
      if (dailyMap.has(dateKey)) {
        const profitLoss = Number.parseFloat(trade.profit_loss)
        const tradeCurrency = trade.currency || "USD"
        const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + convertedProfitLoss)
      }
    }

    groupedData = Array.from(dailyMap.entries()).map(([date, profitLoss]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      profitLoss: Number(profitLoss.toFixed(2)),
    }))
  } else if (period === "weekly") {
    const weeklyMap = new Map<string, number>()
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekKey = `Week ${12 - i}`
      weeklyMap.set(weekKey, 0)
    }

    for (const trade of trades) {
      const sellDate = new Date(trade.sell_date)
      const weeksAgo = Math.floor((now.getTime() - sellDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      
      if (weeksAgo >= 0 && weeksAgo < 12) {
        const weekKey = `Week ${12 - weeksAgo}`
        const profitLoss = Number.parseFloat(trade.profit_loss)
        const tradeCurrency = trade.currency || "USD"
        const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
        weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + convertedProfitLoss)
      }
    }

    groupedData = Array.from(weeklyMap.entries()).map(([date, profitLoss]) => ({
      date,
      profitLoss: Number(profitLoss.toFixed(2)),
    }))
  } else if (period === "monthly") {
    const monthlyMap = new Map<string, number>()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      monthlyMap.set(monthKey, 0)
    }

    for (const trade of trades) {
      const sellDate = new Date(trade.sell_date)
      const monthKey = sellDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      
      if (monthlyMap.has(monthKey)) {
        const profitLoss = Number.parseFloat(trade.profit_loss)
        const tradeCurrency = trade.currency || "USD"
        const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + convertedProfitLoss)
      }
    }

    groupedData = Array.from(monthlyMap.entries()).map(([date, profitLoss]) => ({
      date,
      profitLoss: Number(profitLoss.toFixed(2)),
    }))
  } else if (period === "yearly") {
    const yearlyMap = new Map<string, number>()
    
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i
      yearlyMap.set(year.toString(), 0)
    }

    for (const trade of trades) {
      const sellDate = new Date(trade.sell_date)
      const yearKey = sellDate.getFullYear().toString()
      
      if (yearlyMap.has(yearKey)) {
        const profitLoss = Number.parseFloat(trade.profit_loss)
        const tradeCurrency = trade.currency || "USD"
        const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
        yearlyMap.set(yearKey, (yearlyMap.get(yearKey) || 0) + convertedProfitLoss)
      }
    }

    groupedData = Array.from(yearlyMap.entries()).map(([date, profitLoss]) => ({
      date,
      profitLoss: Number(profitLoss.toFixed(2)),
    }))
  }

  return groupedData
}
