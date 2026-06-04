"use server"

import { getDb } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export interface Portfolio {
  id: number
  user_id: number
  name: string
  description: string | null
  is_default: boolean
  created_at: Date
  updated_at: Date
}

export async function getPortfolios() {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  const sql = getDb()

  const portfolios = await sql`
    SELECT * FROM portfolios
    WHERE user_id = ${session.userId}
    ORDER BY is_default DESC, created_at ASC
  `

  return portfolios as Portfolio[]
}

export async function getSelectedPortfolioId(): Promise<number | null> {
  try {
    const cookieStore = await cookies()
    const selectedId = cookieStore.get("selected_portfolio_id")?.value

    if (selectedId) {
      return Number.parseInt(selectedId)
    }

    // If no selection, get the default portfolio
    const session = await getSession()
    if (!session) {
      return null
    }

    const sql = getDb()

    // Wrap SQL query in try-catch to handle table not existing
    try {
      const result = await sql`
        SELECT id FROM portfolios
        WHERE user_id = ${session.userId} AND is_default = true
        LIMIT 1
      `

      if (result.length === 0) {
        return null
      }

      return result[0].id
    } catch (sqlError) {
      // Portfolios table doesn't exist yet
      return null
    }
  } catch (error) {
    console.log("[v0] Portfolios not available yet - run migration to enable")
    return null
  }
}

export async function setSelectedPortfolio(portfolioId: number) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  // Verify portfolio belongs to user
  const sql = getDb()
  const portfolio = await sql`
    SELECT id FROM portfolios
    WHERE id = ${portfolioId} AND user_id = ${session.userId}
  `

  if (portfolio.length === 0) {
    return { error: "Portfolio not found" }
  }

  const cookieStore = await cookies()
  cookieStore.set("selected_portfolio_id", portfolioId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function createPortfolio(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  console.log("[v0] Creating portfolio:", { name, description, userId: session.userId })

  if (!name || name.trim() === "") {
    return { error: "Portfolio name is required" }
  }

  try {
    const sql = getDb()

    console.log("[v0] Inserting portfolio into database")
    const result = await sql`
      INSERT INTO portfolios (user_id, name, description, is_default)
      VALUES (${session.userId}, ${name}, ${description || null}, false)
      RETURNING id
    `
    console.log("[v0] Portfolio created with id:", result[0].id)

    console.log("[v0] Creating balance entry for portfolio")
    await sql`
      INSERT INTO user_balance (user_id, portfolio_id, balance, currency)
      VALUES (${session.userId}, ${result[0].id}, 0, 'USD')
    `
    console.log("[v0] Balance entry created successfully")

    revalidatePath("/dashboard")
    return { success: true, portfolioId: result[0].id }
  } catch (error) {
    console.error("[v0] Failed to create portfolio:", error)
    return { error: "Failed to create portfolio" }
  }
}

export async function deletePortfolio(portfolioId: number) {
  const session = await getSession()

  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const sql = getDb()

    // Check if it's the default portfolio
    const portfolio = await sql`
      SELECT is_default FROM portfolios
      WHERE id = ${portfolioId} AND user_id = ${session.userId}
    `

    if (portfolio.length === 0) {
      return { error: "Portfolio not found" }
    }

    if (portfolio[0].is_default) {
      return { error: "Cannot delete default portfolio" }
    }

    // Delete portfolio (cascade will delete related balance and trades)
    await sql`
      DELETE FROM portfolios
      WHERE id = ${portfolioId} AND user_id = ${session.userId}
    `

    // Clear cookie if this was the selected portfolio
    const cookieStore = await cookies()
    const selectedId = cookieStore.get("selected_portfolio_id")?.value
    if (selectedId && Number.parseInt(selectedId) === portfolioId) {
      cookieStore.delete("selected_portfolio_id")
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete portfolio" }
  }
}
