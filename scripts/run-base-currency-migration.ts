import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL || "")

async function runMigration() {
  try {
    console.log("Starting base currency migration...")

    // Add base_currency column
    console.log("Adding base_currency column...")
    await sql`
      ALTER TABLE user_balance 
      ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) DEFAULT 'USD'
    `

    // Update existing records
    console.log("Updating existing records with base_currency...")
    await sql`
      UPDATE user_balance 
      SET base_currency = currency 
      WHERE base_currency IS NULL OR base_currency = 'USD'
    `

    // Add base_amount column
    console.log("Adding base_amount column...")
    await sql`
      ALTER TABLE user_balance 
      ADD COLUMN IF NOT EXISTS base_amount DECIMAL(15, 2)
    `

    // Update existing records with base_amount
    console.log("Updating existing records with base_amount...")
    await sql`
      UPDATE user_balance 
      SET base_amount = balance 
      WHERE base_amount IS NULL
    `

    console.log("✅ Base currency migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  }
}

runMigration()
