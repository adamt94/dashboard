-- Add currency column to user_balance table
ALTER TABLE user_balance ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add currency column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
