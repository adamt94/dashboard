import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL || process.env.NEON_DATABASE_URL || "")

async function runMigration() {
  try {
    console.log("Starting currency migration...")

    // Add currency column to user_balance table
    await sql`
      ALTER TABLE user_balance 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'
    `
    console.log("✓ Added currency column to user_balance table")

    // Add currency column to trades table
    await sql`
      ALTER TABLE trades 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'
    `
    console.log("✓ Added currency column to trades table")

    console.log("\n✅ Currency migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  }
}

runMigration()
