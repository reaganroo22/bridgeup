-- Add bio and video introduction URL fields to users table
-- Run this migration in your Supabase SQL editor

-- Add bio field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add video introduction URL field to users table  
ALTER TABLE users
ADD COLUMN IF NOT EXISTS video_introduction_url TEXT;

-- Add bio field to mentor_applications table (if it doesn't exist)
ALTER TABLE mentor_applications
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add video introduction URL field to mentor_applications table (if it doesn't exist)
ALTER TABLE mentor_applications 
ADD COLUMN IF NOT EXISTS video_introduction_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.bio IS 'User bio/about me section - editable text field';
COMMENT ON COLUMN users.video_introduction_url IS 'URL to user introduction video (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN mentor_applications.bio IS 'Mentor application bio field from Google Form';
COMMENT ON COLUMN mentor_applications.video_introduction_url IS 'Mentor application video introduction URL from Google Form';

-- Create indexes for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_users_bio ON users USING gin(to_tsvector('english', bio));

-- Ensure RLS policies are properly set for new fields
-- Note: This assumes you already have RLS policies for the users table
-- If not, you'll need to create appropriate policies

-- Example RLS policy for bio field (adjust as needed for your security requirements)
-- CREATE POLICY "Users can view their own bio" ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update their own bio" ON users FOR UPDATE USING (auth.uid() = id);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('bio', 'video_introduction_url');