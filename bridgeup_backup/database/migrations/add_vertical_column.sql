-- Add vertical column to users table to support multiple app verticals (Wizzmo, BridgeUp, etc.)
-- This allows users to be associated with specific app verticals while sharing the same database

-- Add the vertical column to users table
ALTER TABLE users 
ADD COLUMN vertical text DEFAULT 'wizzmo';

-- Add index for efficient querying by vertical
CREATE INDEX idx_users_vertical ON users(vertical);

-- Update existing users to have 'wizzmo' vertical (preserving existing data)
UPDATE users 
SET vertical = 'wizzmo' 
WHERE vertical IS NULL;

-- Add constraint to ensure valid vertical values
ALTER TABLE users 
ADD CONSTRAINT check_vertical_values 
CHECK (vertical IN ('wizzmo', 'bridgeup', 'techmentor'));

-- Add comment for documentation
COMMENT ON COLUMN users.vertical IS 'Identifies which app vertical the user belongs to (wizzmo, bridgeup, techmentor)';