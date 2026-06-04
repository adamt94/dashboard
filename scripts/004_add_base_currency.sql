-- Add base_currency column to user_balance to track the original currency
ALTER TABLE user_balance ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) DEFAULT 'USD';

-- Update existing records to set base_currency same as current currency
UPDATE user_balance SET base_currency = currency WHERE base_currency IS NULL;

-- Add base_amount column to store the amount in base currency
ALTER TABLE user_balance ADD COLUMN IF NOT EXISTS base_amount DECIMAL(15, 2);

-- Update existing records to set base_amount same as current balance
UPDATE user_balance SET base_amount = balance WHERE base_amount IS NULL;
