-- Add role_selection_completed field to users table
-- This field tracks whether a user has completed the role selection flow
-- when their mentor application gets approved

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_selection_completed BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN users.role_selection_completed IS 'Tracks if user has completed role selection after mentor application approval';

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_users_role_selection_completed ON users(role_selection_completed);

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role_selection_completed';