-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_balance table
CREATE TABLE IF NOT EXISTS user_balance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL, -- 'stock', 'crypto', 'other'
  buy_price DECIMAL(15, 2) NOT NULL,
  quantity DECIMAL(15, 8) NOT NULL,
  sell_price DECIMAL(15, 2),
  buy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sell_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open', -- 'open' or 'closed'
  profit_loss DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_buy_date ON trades(buy_date);
