import { neon } from "@neondatabase/serverless"

// Create a singleton SQL client
let sqlClient: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!sqlClient) {
    const databaseUrl =
      process.env.NEON_NEON_DATABASE_URL ||
      process.env.NEON_POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL

    if (!databaseUrl) {
      console.error(
        "[v0] Available env vars:",
        Object.keys(process.env).filter((k) => k.includes("NEON") || k.includes("DATABASE")),
      )
      throw new Error("Database URL not found in environment variables")
    }

    console.log("[v0] Connecting to database with URL prefix:", databaseUrl.substring(0, 20))
    sqlClient = neon(databaseUrl)
  }
  return sqlClient
}
