-- Add is_searchable field to mentor_profiles table
-- This field controls whether a mentor appears in search results
-- Default: true (searchable), when privacy mode is on: false (hidden)

ALTER TABLE mentor_profiles 
ADD COLUMN is_searchable BOOLEAN DEFAULT true;

-- Set all existing mentor profiles to be searchable by default
UPDATE mentor_profiles SET is_searchable = true WHERE is_searchable IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_is_searchable 
ON mentor_profiles(is_searchable);