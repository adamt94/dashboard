"use server"

import { getDb } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { getSelectedPortfolioId } from "./portfolios"

export interface Trade {
  id: number
  user_id: number
  portfolio_id: number
  asset_name: string
  asset_type: string
  buy_price: string
  quantity: string
  sell_price: string | null
  buy_date: Date
  sell_date: Date | null
  status: string
  profit_loss: string | null
  currency: string
  created_at: Date
  updated_at: Date
}

export async function createTrade(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  const assetName = formData.get("assetName") as string
  const assetType = formData.get("assetType") as string
  const buyPrice = Number.parseFloat(formData.get("buyPrice") as string)
  const quantity = Number.parseFloat(formData.get("quantity") as string)
  const sellPrice = formData.get("sellPrice") as string
  const buyDate = formData.get("buyDate") as string
  const buyTime = formData.get("buyTime") as string
  const sellDate = formData.get("sellDate") as string
  const sellTime = formData.get("sellTime") as string
  const currency = (formData.get("currency") as string) || "USD"

  if (!assetName || !assetType || isNaN(buyPrice) || isNaN(quantity) || buyPrice <= 0 || quantity <= 0) {
    return { error: "Please fill in all required fields with valid values" }
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    const buyDateTime = buyDate && buyTime ? `${buyDate} ${buyTime}` : buyDate || new Date().toISOString()

    if (sellPrice && sellPrice.trim() !== "") {
      const sellPriceNum = Number.parseFloat(sellPrice)
      if (isNaN(sellPriceNum) || sellPriceNum <= 0) {
        return { error: "Invalid sell price" }
      }

      const profitLoss = (sellPriceNum - buyPrice) * quantity
      const sellDateTime = sellDate && sellTime ? `${sellDate} ${sellTime}` : sellDate || null

      await sql`
        INSERT INTO trades (user_id, portfolio_id, asset_name, asset_type, buy_price, quantity, sell_price, buy_date, sell_date, status, profit_loss, currency)
        VALUES (${session.userId}, ${portfolioId}, ${assetName}, ${assetType}, ${buyPrice}, ${quantity}, ${sellPriceNum}, ${buyDateTime}, ${sellDateTime}, 'closed', ${profitLoss}, ${currency})
      `
    } else {
      await sql`
        INSERT INTO trades (user_id, portfolio_id, asset_name, asset_type, buy_price, quantity, buy_date, status, currency)
        VALUES (${session.userId}, ${portfolioId}, ${assetName}, ${assetType}, ${buyPrice}, ${quantity}, ${buyDateTime}, 'open', ${currency})
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error creating trade:", error)
    return { error: "Failed to create trade" }
  }
}

export async function updateTrade(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  const tradeId = Number.parseInt(formData.get("tradeId") as string)
  const assetName = formData.get("assetName") as string
  const assetType = formData.get("assetType") as string
  const buyPrice = Number.parseFloat(formData.get("buyPrice") as string)
  const quantity = Number.parseFloat(formData.get("quantity") as string)
  const sellPrice = formData.get("sellPrice") as string
  const buyDate = formData.get("buyDate") as string
  const buyTime = formData.get("buyTime") as string
  const sellDate = formData.get("sellDate") as string
  const sellTime = formData.get("sellTime") as string
  const currency = (formData.get("currency") as string) || "USD"

  if (
    isNaN(tradeId) ||
    !assetName ||
    !assetType ||
    isNaN(buyPrice) ||
    isNaN(quantity) ||
    buyPrice <= 0 ||
    quantity <= 0
  ) {
    return { error: "Please fill in all required fields with valid values" }
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    const trade = await sql`
      SELECT id FROM trades WHERE id = ${tradeId} AND user_id = ${session.userId} AND portfolio_id = ${portfolioId}
    `

    if (trade.length === 0) {
      return { error: "Trade not found" }
    }

    const buyDateTime = buyDate && buyTime ? `${buyDate} ${buyTime}` : buyDate || new Date().toISOString()

    if (sellPrice && sellPrice.trim() !== "") {
      const sellPriceNum = Number.parseFloat(sellPrice)
      if (isNaN(sellPriceNum) || sellPriceNum <= 0) {
        return { error: "Invalid sell price" }
      }

      const profitLoss = (sellPriceNum - buyPrice) * quantity
      const sellDateTime = sellDate && sellTime ? `${sellDate} ${sellTime}` : sellDate || null

      await sql`
        UPDATE trades
        SET asset_name = ${assetName}, asset_type = ${assetType}, buy_price = ${buyPrice}, 
            quantity = ${quantity}, sell_price = ${sellPriceNum}, buy_date = ${buyDateTime}, 
            sell_date = ${sellDateTime}, status = 'closed', 
            profit_loss = ${profitLoss}, currency = ${currency}
        WHERE id = ${tradeId} AND user_id = ${session.userId} AND portfolio_id = ${portfolioId}
      `
    } else {
      await sql`
        UPDATE trades
        SET asset_name = ${assetName}, asset_type = ${assetType}, buy_price = ${buyPrice}, 
            quantity = ${quantity}, buy_date = ${buyDateTime}, currency = ${currency}, sell_date = NULL, 
            sell_price = NULL, status = 'open', profit_loss = NULL
        WHERE id = ${tradeId} AND user_id = ${session.userId} AND portfolio_id = ${portfolioId}
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating trade:", error)
    return { error: "Failed to update trade" }
  }
}

export async function partialSellTrade(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  const tradeId = Number.parseInt(formData.get("tradeId") as string)
  const sellQuantity = Number.parseFloat(formData.get("sellQuantity") as string)
  const sellPrice = Number.parseFloat(formData.get("sellPrice") as string)
  const sellDate = formData.get("sellDate") as string
  const sellTime = formData.get("sellTime") as string

  if (isNaN(tradeId) || isNaN(sellQuantity) || isNaN(sellPrice) || sellQuantity <= 0 || sellPrice <= 0) {
    return { error: "Please fill in all required fields with valid values" }
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    // Get the original trade
    const trades = await sql`
      SELECT * FROM trades 
      WHERE id = ${tradeId} AND user_id = ${session.userId} AND portfolio_id = ${portfolioId}
    `

    if (trades.length === 0) {
      return { error: "Trade not found" }
    }

    const trade = trades[0]
    const originalQuantity = Number.parseFloat(trade.quantity)
    const buyPrice = Number.parseFloat(trade.buy_price)

    if (sellQuantity > originalQuantity) {
      return { error: `Cannot sell more than you own (${originalQuantity})` }
    }

    const remainingQuantity = originalQuantity - sellQuantity
    const profitLoss = (sellPrice - buyPrice) * sellQuantity
    const sellDateTime = sellDate && sellTime ? `${sellDate} ${sellTime}` : sellDate || new Date().toISOString()

    if (remainingQuantity <= 0) {
      // Selling everything - just close the original trade
      await sql`
        UPDATE trades
        SET sell_price = ${sellPrice}, sell_date = ${sellDateTime}, 
            status = 'closed', profit_loss = ${profitLoss}
        WHERE id = ${tradeId} AND user_id = ${session.userId} AND portfolio_id = ${portfolioId}
      `
    } else {
      // Partial sell - update original trade quantity and create new closed trade
      // Update original trade with remaining quantity
      await sql`
        UPDATE trades
        SET quantity = ${remainingQuantity}
        WHERE id = ${tradeId} AND user_id = ${session.userId} AND portfolio_id = ${portfolioId}
      `

      // Create a new closed trade for the sold portion
      await sql`
        INSERT INTO trades (user_id, portfolio_id, asset_name, asset_type, buy_price, quantity, 
                           sell_price, buy_date, sell_date, status, profit_loss, currency)
        VALUES (${session.userId}, ${portfolioId}, ${trade.asset_name}, ${trade.asset_type}, 
                ${buyPrice}, ${sellQuantity}, ${sellPrice}, ${trade.buy_date}, ${sellDateTime}, 
                'closed', ${profitLoss}, ${trade.currency || 'USD'})
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error partial selling trade:", error)
    return { error: "Failed to process partial sell" }
  }
}

export async function deleteTrade(tradeId: number) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    await sql`
      DELETE FROM trades
      WHERE id = ${tradeId} AND user_id = ${session.userId} AND portfolio_id = ${portfolioId}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete trade" }
  }
}

export async function getTrades() {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  try {
    const sql = getDb()
    const portfolioId = await getSelectedPortfolioId()

    const trades = await sql`
      SELECT * FROM trades
      WHERE user_id = ${session.userId} AND portfolio_id = ${portfolioId}
      ORDER BY buy_date DESC, id DESC
    `
    return trades as Trade[]
  } catch (error) {
    console.error("[v0] Error getting trades:", error)
    return []
  }
}
