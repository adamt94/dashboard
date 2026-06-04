-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add portfolio_id to user_balance table
ALTER TABLE user_balance ADD COLUMN IF NOT EXISTS portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE;

-- Add portfolio_id to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balance_portfolio_id ON user_balance(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_trades_portfolio_id ON trades(portfolio_id);

-- Create a default portfolio for existing users
INSERT INTO portfolios (user_id, name, description, is_default)
SELECT DISTINCT user_id, 'Main Portfolio', 'Default trading portfolio', true
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM portfolios WHERE portfolios.user_id = users.id
);

-- Update existing user_balance records to link to default portfolio
UPDATE user_balance
SET portfolio_id = (
  SELECT id FROM portfolios 
  WHERE portfolios.user_id = user_balance.user_id 
  AND portfolios.is_default = true
  LIMIT 1
)
WHERE portfolio_id IS NULL;

-- Update existing trades to link to default portfolio
UPDATE trades
SET portfolio_id = (
  SELECT id FROM portfolios 
  WHERE portfolios.user_id = trades.user_id 
  AND portfolios.is_default = true
  LIMIT 1
)
WHERE portfolio_id IS NULL;

-- Make portfolio_id NOT NULL after migration
ALTER TABLE user_balance ALTER COLUMN portfolio_id SET NOT NULL;
ALTER TABLE trades ALTER COLUMN portfolio_id SET NOT NULL;
