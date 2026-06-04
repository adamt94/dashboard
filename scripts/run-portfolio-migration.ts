import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL || "")

async function runMigration() {
  try {
    console.log("[v0] Starting portfolio and datetime migration...")

    // Create portfolios table
    console.log("[v0] Creating portfolios table...")
    await sql`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Add portfolio_id to user_balance table
    console.log("[v0] Adding portfolio_id to user_balance...")
    await sql`
      ALTER TABLE user_balance 
      ADD COLUMN IF NOT EXISTS portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE
    `

    // Add portfolio_id to trades table
    console.log("[v0] Adding portfolio_id to trades...")
    await sql`
      ALTER TABLE trades 
      ADD COLUMN IF NOT EXISTS portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE
    `

    // Add buy_date and sell_date to trades table
    console.log("[v0] Adding buy_date and sell_date to trades...")
    await sql`
      ALTER TABLE trades 
      ADD COLUMN IF NOT EXISTS buy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `

    await sql`
      ALTER TABLE trades 
      ADD COLUMN IF NOT EXISTS sell_date TIMESTAMP
    `

    // Create indexes
    console.log("[v0] Creating indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_balance_portfolio_id ON user_balance(portfolio_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_trades_portfolio_id ON trades(portfolio_id)`

    // Create default portfolios for existing users
    console.log("[v0] Creating default portfolios for existing users...")
    await sql`
      INSERT INTO portfolios (user_id, name, description, is_default)
      SELECT DISTINCT id, 'Main Portfolio', 'Default trading portfolio', true
      FROM users
      WHERE NOT EXISTS (
        SELECT 1 FROM portfolios WHERE portfolios.user_id = users.id
      )
    `

    // Update existing user_balance records
    console.log("[v0] Linking existing balances to default portfolios...")
    await sql`
      UPDATE user_balance
      SET portfolio_id = (
        SELECT id FROM portfolios 
        WHERE portfolios.user_id = user_balance.user_id 
        AND portfolios.is_default = true
        LIMIT 1
      )
      WHERE portfolio_id IS NULL
    `

    // Update existing trades
    console.log("[v0] Linking existing trades to default portfolios...")
    await sql`
      UPDATE trades
      SET portfolio_id = (
        SELECT id FROM portfolios 
        WHERE portfolios.user_id = trades.user_id 
        AND portfolios.is_default = true
        LIMIT 1
      )
      WHERE portfolio_id IS NULL
    `

    console.log("[v0] ✅ Migration completed successfully!")
    console.log("[v0] You can now:")
    console.log("[v0] - Create multiple portfolios")
    console.log("[v0] - Track buy and sell dates with time")
    console.log("[v0] - Switch between different portfolios")
  } catch (error) {
    console.error("[v0] ❌ Migration failed:", error)
    throw error
  }
}

runMigration()
