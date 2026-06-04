"use server"

import { getDb } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { getSelectedPortfolioId } from "./portfolios"
import { convertCurrency } from "@/lib/exchange-rates"

export async function getBalance() {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    console.log("[v0] getBalance - portfolioId:", portfolioId, "userId:", session.userId)

    const result = await sql`
      SELECT balance, currency, updated_at
      FROM user_balance
      WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
      LIMIT 1
    ` as Array<{ balance: string; currency: string; updated_at: Date }>

    const balanceData = result[0] || { balance: 0, currency: "USD", updated_at: new Date() }
    const baseBalance = Number.parseFloat(balanceData.balance)
    const displayCurrency = balanceData.currency

    const trades = await sql`
      SELECT profit_loss, currency
      FROM trades
      WHERE user_id = ${session.userId}
        AND portfolio_id = ${portfolioId}
        AND status = 'closed'
        AND profit_loss IS NOT NULL
    ` as Array<{ profit_loss: string; currency: string }>

    let totalProfitLoss = 0
    for (const trade of trades) {
      const profitLoss = Number.parseFloat(trade.profit_loss)
      const tradeCurrency = trade.currency || "USD"
      // Convert trade P&L to display currency
      const convertedProfitLoss = await convertCurrency(profitLoss, tradeCurrency, displayCurrency)
      totalProfitLoss += convertedProfitLoss
    }

    const totalBalance = baseBalance + totalProfitLoss

    console.log("[v0] getBalance - base:", baseBalance, "tradePnL:", totalProfitLoss, "total:", totalBalance)

    return {
      balance: totalBalance,
      baseBalance: baseBalance,
      tradeProfitLoss: totalProfitLoss,
      currency: displayCurrency,
      updated_at: balanceData.updated_at,
    }
  } catch (error) {
    console.error("[v0] Error getting balance:", error)
    return {
      balance: 0,
      baseBalance: 0,
      tradeProfitLoss: 0,
      currency: "USD",
      updated_at: new Date(),
    }
  }
}

export async function updateBalance(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  const balance = Number.parseFloat(formData.get("balance") as string)

  if (isNaN(balance) || balance < 0) {
    return { error: "Invalid balance amount" }
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    await sql`
      UPDATE user_balance
      SET balance = ${balance}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating balance:", error)
    return { error: "Failed to update balance" }
  }
}

export async function updateCurrency(currency: string) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    console.log("[v0] updateCurrency - portfolioId:", portfolioId, "userId:", session.userId, "newCurrency:", currency)

    // Just update the existing balance entry for this portfolio
    // If no rows are updated, the portfolio may not have a balance entry yet
    const updateResult = await sql`
      UPDATE user_balance
      SET currency = ${currency}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
      RETURNING id
    ` as Array<{ id: number }>

    // If no balance entry exists for this specific portfolio, try to update by user_id only
    // This handles cases where the unique constraint is still on user_id only
    if (updateResult.length === 0) {
      console.log("[v0] No balance for portfolio, updating user's default balance")
      await sql`
        UPDATE user_balance
        SET currency = ${currency}, portfolio_id = ${portfolioId}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${session.userId}
      `
    }

    console.log("[v0] updateCurrency - currency updated successfully")

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[v0] updateCurrency - error:", error)
    return { error: "Failed to update currency" }
  }
}
