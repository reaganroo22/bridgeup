-- Fix mentor_applications table to match Google Form Apps Script expectations
-- Run this in your Supabase SQL Editor

-- 1. Rename the problematic column
ALTER TABLE mentor_applications 
RENAME COLUMN age_confirmed TO age_confirmation;

-- 2. Verify the table structure matches what Apps Script expects
-- (This will show you the current column names)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mentor_applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Add any missing columns that might be expected
ALTER TABLE mentor_applications 
ADD COLUMN IF NOT EXISTS form_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add bio and video fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

-- Add bio and video fields to mentor_applications table
ALTER TABLE mentor_applications
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

-- Create unique constraint on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_lower 
ON users (LOWER(username));

-- 4. Update the function to use the correct column name
CREATE OR REPLACE FUNCTION process_mentor_application(
  p_application_id UUID,
  p_reviewer_id UUID
) RETURNS JSON AS $$
DECLARE
  v_application RECORD;
  v_user RECORD;
  v_new_user_id UUID;
  v_mentor_profile_id UUID;
  v_category_id UUID;
  v_result JSON;
BEGIN
  -- Get application details (using correct column name)
  SELECT * INTO v_application 
  FROM mentor_applications 
  WHERE id = p_application_id AND application_status = 'pending';
  
  IF v_application IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Application not found or already processed');
  END IF;

  -- Update application status
  UPDATE mentor_applications 
  SET 
    application_status = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;

  -- Check if user exists
  SELECT * INTO v_user FROM users WHERE email = v_application.email;
  
  IF v_user IS NULL THEN
    -- Create new user
    INSERT INTO users (
      email, 
      full_name, 
      username, 
      university, 
      graduation_year, 
      role
    ) VALUES (
      v_application.email,
      v_application.full_name,
      lower(replace(v_application.full_name, ' ', '')) || floor(random() * 1000)::text,
      v_application.university,
      v_application.graduation_year,
      'mentor'
    ) RETURNING id INTO v_new_user_id;
    
    v_user.id := v_new_user_id;
  ELSE
    -- Update existing user to mentor role
    UPDATE users 
    SET role = CASE 
      WHEN role = 'student' THEN 'both'
      ELSE 'mentor'
    END
    WHERE id = v_user.id;
    
    v_new_user_id := v_user.id;
  END IF;

  -- Create mentor profile
  INSERT INTO mentor_profiles (
    user_id,
    is_verified,
    verification_status,
    availability_status
  ) VALUES (
    v_new_user_id,
    true,
    'verified',
    'available'
  ) RETURNING id INTO v_mentor_profile_id;

  -- Get Dating & Relationships category ID
  SELECT id INTO v_category_id FROM categories WHERE name = 'Dating & Relationships';
  
  -- Add mentor expertise for Dating & Relationships
  IF v_category_id IS NOT NULL THEN
    INSERT INTO mentor_expertise (mentor_profile_id, category_id)
    VALUES (v_mentor_profile_id, v_category_id);
  END IF;

  v_result := json_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'mentor_profile_id', v_mentor_profile_id,
    'message', 'Mentor account created successfully'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test that the column name is now correct
-- This should work without errors now
SELECT 
  id, 
  email, 
  full_name,
  age_confirmation,  -- This should now work
  agreement_accepted,
  application_status,
  created_at
FROM mentor_applications 
LIMIT 5;

-- 6. If you want to insert a test record to verify:
/*
INSERT INTO mentor_applications (
  email,
  full_name,
  university,
  graduation_year,
  age_confirmation,
  comfortable_with_college_girl_perspective,
  topics_comfortable_with,
  prior_experience,
  session_formats,
  hours_per_week,
  languages,
  agreement_accepted
) VALUES (
  'test.fixed@example.com',
  'Database Fix Test',
  'Test University',
  2024,
  true,
  true,
  ARRAY['texting_analysis', 'first_dates'],
  'Testing the fixed database schema',
  ARRAY['async_chat'],
  '4–6 hours per week',
  'English',
  true
) RETURNING id, email, full_name;
*/