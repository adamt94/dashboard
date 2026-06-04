import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "")

async function fixBalanceConstraint() {
  try {
    console.log("Fixing user_balance unique constraint...")

    // Drop old constraint and add new one
    await sql`
      ALTER TABLE user_balance DROP CONSTRAINT IF EXISTS user_balance_user_id_key
    `
    console.log("✓ Dropped old unique constraint on user_id")

    await sql`
      ALTER TABLE user_balance 
      ADD CONSTRAINT user_balance_user_portfolio_unique 
      UNIQUE (user_id, portfolio_id)
    `
    console.log("✓ Added new unique constraint on (user_id, portfolio_id)")

    console.log("\n✅ Migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  }
}

fixBalanceConstraint()
