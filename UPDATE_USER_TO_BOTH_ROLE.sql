-- Update current user to have "both" role (student + mentor)
-- Run this in Supabase SQL Editor

UPDATE users 
SET role = 'both', updated_at = NOW()
WHERE id = '851a8f7d-8e6e-498b-8fc5-0494d24147f2';

-- Verify the update
SELECT id, email, full_name, role, created_at, updated_at
FROM users 
WHERE id = '851a8f7d-8e6e-498b-8fc5-0494d24147f2';