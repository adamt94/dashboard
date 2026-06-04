-- Drop the old unique constraint on user_id only
ALTER TABLE user_balance DROP CONSTRAINT IF EXISTS user_balance_user_id_key;

-- Add a new unique constraint on (user_id, portfolio_id) together
ALTER TABLE user_balance ADD CONSTRAINT user_balance_user_portfolio_unique UNIQUE (user_id, portfolio_id);
