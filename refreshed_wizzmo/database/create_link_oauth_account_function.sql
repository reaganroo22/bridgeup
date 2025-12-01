-- Create function to handle OAuth account linking for existing users
CREATE OR REPLACE FUNCTION public.link_oauth_account(
  p_auth_user_id UUID,
  p_existing_email TEXT,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_user RECORD;
  v_result JSON;
BEGIN
  -- Find the existing user by email
  SELECT * INTO v_existing_user 
  FROM public.users 
  WHERE email = p_existing_email;
  
  IF NOT FOUND THEN
    -- No existing user found, return error
    RETURN json_build_object(
      'success', false,
      'error', 'No existing user found with email: ' || p_existing_email
    );
  END IF;
  
  -- Update the existing user record with the new auth user ID and avatar
  UPDATE public.users 
  SET 
    id = p_auth_user_id,
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = NOW()
  WHERE email = p_existing_email;
  
  -- Update any related tables that reference the old user ID
  -- Update advice_sessions
  UPDATE public.advice_sessions 
  SET student_id = p_auth_user_id 
  WHERE student_id = v_existing_user.id;
  
  UPDATE public.advice_sessions 
  SET mentor_id = p_auth_user_id 
  WHERE mentor_id = v_existing_user.id;
  
  -- Update questions
  UPDATE public.questions 
  SET student_id = p_auth_user_id 
  WHERE student_id = v_existing_user.id;
  
  -- Update messages
  UPDATE public.messages 
  SET sender_id = p_auth_user_id 
  WHERE sender_id = v_existing_user.id;
  
  -- Update favorite_wizzmos
  UPDATE public.favorite_wizzmos 
  SET student_id = p_auth_user_id 
  WHERE student_id = v_existing_user.id;
  
  UPDATE public.favorite_wizzmos 
  SET mentor_id = p_auth_user_id 
  WHERE mentor_id = v_existing_user.id;
  
  -- Update followers
  UPDATE public.followers 
  SET follower_id = p_auth_user_id 
  WHERE follower_id = v_existing_user.id;
  
  UPDATE public.followers 
  SET following_id = p_auth_user_id 
  WHERE following_id = v_existing_user.id;
  
  -- Update feed_comments
  UPDATE public.feed_comments 
  SET user_id = p_auth_user_id 
  WHERE user_id = v_existing_user.id;
  
  -- Update feed_votes
  UPDATE public.feed_votes 
  SET user_id = p_auth_user_id 
  WHERE user_id = v_existing_user.id;
  
  -- Update mentor_profiles
  UPDATE public.mentor_profiles 
  SET user_id = p_auth_user_id 
  WHERE user_id = v_existing_user.id;
  
  -- Update subscriptions (handle foreign key constraint)
  UPDATE public.subscriptions 
  SET user_id = p_auth_user_id 
  WHERE user_id = v_existing_user.id;
  
  -- Update notifications
  UPDATE public.notifications 
  SET user_id = p_auth_user_id 
  WHERE user_id = v_existing_user.id;
  
  -- Update user_push_tokens
  UPDATE public.user_push_tokens 
  SET user_id = p_auth_user_id 
  WHERE user_id = v_existing_user.id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Account linked successfully',
    'old_user_id', v_existing_user.id,
    'new_user_id', p_auth_user_id,
    'email', p_existing_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.link_oauth_account(UUID, TEXT, TEXT) TO authenticated;