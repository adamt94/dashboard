import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL || process.env.NEON_DATABASE_URL || "")

async function runMigration() {
  console.log("[v0] Starting database migration...")

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("[v0] ✓ Created users table")

    // Create user_balance table
    await sql`
      CREATE TABLE IF NOT EXISTS user_balance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("[v0] ✓ Created user_balance table")

    // Create trades table
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        asset_name VARCHAR(255) NOT NULL,
        asset_type VARCHAR(50) DEFAULT 'stock',
        buy_price DECIMAL(15, 2) NOT NULL,
        quantity DECIMAL(15, 8) NOT NULL,
        sell_price DECIMAL(15, 2),
        profit_loss DECIMAL(15, 2),
        status VARCHAR(20) DEFAULT 'open',
        buy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sell_date TIMESTAMP,
        notes TEXT
      )
    `
    console.log("[v0] ✓ Created trades table")

    console.log("[v0] ✅ Migration completed successfully!")
  } catch (error) {
    console.error("[v0] ❌ Migration failed:", error)
    throw error
  }
}

runMigration()
