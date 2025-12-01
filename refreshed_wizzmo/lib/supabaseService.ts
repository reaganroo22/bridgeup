/**
 * Wizzmo Supabase Service Layer
 *
 * Comprehensive database operations wrapper for all Supabase interactions.
 * Provides type-safe, error-handled methods for all database operations.
 *
 * @module supabaseService
 */

import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { CURRENT_VERTICAL_KEY } from '../config/current-vertical'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type UserRole = 'student' | 'mentor' | 'both'
export type QuestionStatus = 'pending' | 'assigned' | 'active' | 'resolved' | 'archived'
export type SessionStatus = 'pending' | 'accepted' | 'declined' | 'active' | 'resolved'
export type Urgency = 'low' | 'medium' | 'high'
export type PlanType = 'free' | 'pro_monthly' | 'pro_yearly' | string
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'
export type NotificationType = 'new_message' | 'question_matched' | 'chat_resolved' | 'new_comment' | 'new_follower' | string
export type VoteType = 'upvote' | 'downvote'

export interface ServiceResponse<T> {
  data: T | null
  error: Error | null
}

export interface User {
  id: string
  email: string
  username: string | null
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  bio: string | null
  university: string | null
  graduation_year: number | null
  created_at: string
  updated_at: string
}

export interface MentorProfile {
  id: string
  user_id: string
  is_verified: boolean
  verification_status: 'pending' | 'verified' | 'rejected'
  availability_status: 'available' | 'busy' | 'offline'
  total_questions_answered: number
  average_rating: number
  total_helpful_votes: number
  response_time_avg: number | null
  major: string | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  student_id: string
  category_id: string
  title: string
  content: string
  is_anonymous: boolean
  urgency: Urgency
  status: QuestionStatus
  created_at: string
  updated_at: string
}

export interface AdviceSession {
  id: string
  question_id: string
  mentor_id: string
  status: SessionStatus
  accepted_at: string | null
  resolved_at: string | null
  rating: number | null
  was_helpful: boolean | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  advice_session_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  edit_count?: number
  edited_at?: string | null
  audio_url?: string | null
  image_url?: string | null
  // UI-only fields for completeness
  isFromCurrentUser?: boolean
  senderName?: string
  senderAvatar?: string
}

export interface Rating {
  id: string
  advice_session_id: string
  student_id: string
  mentor_id: string
  rating: number
  feedback_text: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_type: PlanType
  status: SubscriptionStatus
  questions_used: number
  questions_limit: number | null
  trial_ends_at: string | null
  subscription_starts_at: string | null
  subscription_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  data: any | null
  is_read: boolean
  created_at: string
}

export interface FeedComment {
  id: string
  question_id: string
  mentor_id: string
  content: string
  helpful_votes: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: string
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Get user by username (for username availability check)
 * @param username - Username to check
 * @returns User profile if username exists
 */
export async function getUserByUsername(username: string): Promise<ServiceResponse<User | null>> {
  try {
    console.log('[getUserByUsername] Checking username:', username)

    // SQL: SELECT * FROM users WHERE username = $1
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .maybeSingle()

    if (error) throw error

    console.log('[getUserByUsername] Username check result:', !!data)
    return { data, error: null }
  } catch (error) {
    console.error('[getUserByUsername] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get user profile with optional mentor stats
 * @param userId - User UUID
 * @returns User profile with mentor profile if applicable
 */
export async function getUserProfile(userId: string): Promise<ServiceResponse<User & { mentor_profile?: MentorProfile }>> {
  try {
    console.log('[getUserProfile] Fetching profile for user:', userId)
    
    // Check authentication state for debugging
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.error('[getUserProfile] Auth error:', authError)
    } else if (!session) {
      console.warn('[getUserProfile] No active session when fetching profile')
    } else {
      console.log('[getUserProfile] Active session for user:', session.user.id)
    }

    // SQL: SELECT * FROM users WHERE id = $1
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[getUserProfile] Database error:', userError)
      console.error('[getUserProfile] Error code:', userError.code)
      console.error('[getUserProfile] Error message:', userError.message)
      throw userError
    }
    if (!user) {
      console.error('[getUserProfile] No user data returned for ID:', userId)
      throw new Error('User not found')
    }

    // If user is a mentor or both, fetch mentor profile
    // SQL: SELECT * FROM mentor_profiles WHERE user_id = $1
    if (user.role === 'mentor' || user.role === 'both') {
      const { data: mentorProfile, error: mentorError } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!mentorError && mentorProfile) {
        console.log('[getUserProfile] Found mentor profile')
        return { data: { ...user, mentor_profile: mentorProfile }, error: null }
      }
    }

    console.log('[getUserProfile] Profile fetched successfully. Role:', user.role, 'Email:', user.email)
    return { data: user, error: null }
  } catch (error) {
    console.error('[getUserProfile] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update user profile information
 * @param userId - User UUID
 * @param updates - Fields to update
 * @returns Updated user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string
    full_name?: string
    bio?: string
    avatar_url?: string
    university?: string
    education_level?: string
    graduation_year?: number | null
    age?: number
    gender?: string
    interests?: string[]
    onboarding_completed?: boolean
    vertical?: string
    email?: string
    role?: string
  }
): Promise<ServiceResponse<User>> {
  try {
    console.log('[updateUserProfile] Updating user:', userId, updates)

    // SAFE APPROACH: Only update provided fields, don't overwrite with empty values
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are actually provided
    if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
    if (updates.university !== undefined) updateData.university = updates.university;
    if (updates.graduation_year !== undefined) updateData.graduation_year = updates.graduation_year;
    if (updates.education_level !== undefined) updateData.education_level = updates.education_level;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.interests !== undefined) updateData.interests = updates.interests;
    if (updates.onboarding_completed !== undefined) updateData.onboarding_completed = updates.onboarding_completed;
    if (updates.vertical !== undefined) updateData.vertical = updates.vertical;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.role !== undefined) updateData.role = updates.role;

    console.log('[updateUserProfile] Actual update data being sent:', updateData);

    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (!updateError && updateResult) {
      console.log('[updateUserProfile] Profile updated successfully')
      return { data: updateResult, error: null }
    }

    // If there's still an email constraint issue, handle it
    if (updateError?.code === '23505') {
      console.log('[updateUserProfile] Email constraint violation, using RPC function as fallback')
      
      if (updates.email) {
        try {
          // Use our RPC function to handle the account linking
          const { data: linkResult, error: linkError } = await supabase.rpc('link_oauth_account', {
            p_auth_user_id: userId,
            p_existing_email: updates.email,
            p_avatar_url: updates.avatar_url || null
          })

          if (!linkError && linkResult?.success) {
            console.log('[updateUserProfile] Account linked successfully via RPC')
            
            // Now update with the new data
            const { data: finalData, error: finalError } = await supabase
              .from('users')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId)
              .select()
              .single()
              
            if (!finalError && finalData) {
              return { data: finalData, error: null }
            }
          }
        } catch (rpcError) {
          console.error('[updateUserProfile] RPC fallback failed:', rpcError)
        }
      }
    }

    // Try to find existing profile by email (OAuth duplicate case)
    if (updates.email) {
      console.log('[updateUserProfile] Attempting profile lookup by email:', updates.email)
      const { data: existingProfile, error: emailFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', updates.email)
        .single()
        
      if (!emailFetchError && existingProfile) {
        console.log('[updateUserProfile] Found existing profile by email, updating it')
        
        // Update the existing profile with the new data
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('email', updates.email)
          .select()
          .single()
          
        if (!updateError && updatedProfile) {
          console.log('[updateUserProfile] Successfully updated existing profile by email')
          return { data: updatedProfile, error: null }
        } else {
          console.log('[updateUserProfile] Update failed, but returning existing profile by email')
          return { data: existingProfile, error: null }
        }
      }
    }
    
    // If all else fails, just return success (user exists, no update needed)
    console.log('[updateUserProfile] Attempting final profile fetch by user ID')
    const { data: existingProfile, error: fetchError } = await getUserProfile(userId)
    
    if (!fetchError && existingProfile) {
      console.log('[updateUserProfile] User already exists, returning existing profile')
      return { data: existingProfile, error: null }
    }

    // Last resort error
    throw updateError || new Error('Profile update failed for unknown reason')
    
  } catch (error) {
    console.error('[updateUserProfile] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create a minimal user profile for OAuth users
 * @param userId - User UUID from auth
 * @param email - User email from OAuth
 * @param fullName - User full name from OAuth
 * @param avatarUrl - User avatar URL from OAuth
 * @returns Created user profile
 */
export async function createOAuthUserProfile(
  userId: string,
  email: string,
  fullName: string = '',
  avatarUrl: string = ''
): Promise<ServiceResponse<User>> {
  try {
    console.log('[createOAuthUserProfile] Creating OAuth profile for user:', userId)

    // First try to get existing user in case trigger already created it
    const { data: existingUser } = await getUserProfile(userId)
    if (existingUser) {
      console.log('[createOAuthUserProfile] User profile already exists')
      return { data: existingUser, error: null }
    }

    // NEW: Check if a user profile already exists with this email (from mentor approval)
    console.log('[createOAuthUserProfile] Checking for existing profile by email:', email)
    const { data: existingByEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingByEmail && !emailCheckError) {
      console.log('[createOAuthUserProfile] Found existing profile by email, using RPC to link accounts')
      
      // Use RPC function to safely transfer the profile to the new auth user ID
      const { data: linkResult, error: linkError } = await supabase.rpc('link_oauth_account', {
        p_auth_user_id: userId,
        p_existing_email: email,
        p_avatar_url: avatarUrl || existingByEmail.avatar_url
      })

      if (linkError) {
        console.error('[createOAuthUserProfile] Error linking via RPC:', linkError)
        
        // If function doesn't exist yet, try direct update as fallback
        if (linkError.code === 'PGRST202') {
          console.log('[createOAuthUserProfile] RPC function not found, using direct update as fallback')
          
          try {
            // Update the existing user's ID to the new auth ID
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                id: userId,
                avatar_url: avatarUrl || existingByEmail.avatar_url,
                updated_at: new Date().toISOString()
              })
              .eq('email', email)
            
            if (!updateError) {
              console.log('[createOAuthUserProfile] Successfully linked account via direct update')
              const { data: linkedUser, error: fetchError } = await getUserProfile(userId)
              if (!fetchError && linkedUser) {
                return { data: linkedUser, error: null }
              }
            } else {
              console.error('[createOAuthUserProfile] Direct update failed:', updateError)
            }
          } catch (directError) {
            console.error('[createOAuthUserProfile] Direct update error:', directError)
          }
        }
      } else {
        console.log('[createOAuthUserProfile] Successfully linked existing profile via RPC')
        // Get the linked user profile
        const { data: linkedUser, error: fetchError } = await getUserProfile(userId)
        if (!fetchError && linkedUser) {
          return { data: linkedUser, error: null }
        }
      }
    }

    // Use RPC to create user profile (bypasses RLS like the trigger would)
    const { data, error } = await supabase.rpc('create_user_profile', {
      p_user_id: userId,
      p_email: email,
      p_full_name: fullName || '',
      p_university: '', // Will be filled during onboarding
      p_graduation_year: new Date().getFullYear() + 4, // Default to 4 years from now
      p_role: 'student'
    })

    if (error) {
      console.error('[createOAuthUserProfile] RPC error:', error)
      // Fallback: try direct insert with SECURITY DEFINER function
      throw error
    }

    console.log('[createOAuthUserProfile] OAuth profile created via RPC')
    
    // Get the created user profile
    const { data: createdUser, error: fetchError } = await getUserProfile(userId)
    if (fetchError) throw fetchError

    return { data: createdUser, error: null }
  } catch (error: any) {
    console.error('[createOAuthUserProfile] Error:', error)
    
    // Handle specific database constraint errors
    if (error.code === '23505') {
      // Duplicate key constraint - email already exists
      console.log('[createOAuthUserProfile] Email already exists, attempting OAuth account linking')
      
      try {
        // STEP 1: Try the RPC function for OAuth linking
        console.log('[createOAuthUserProfile] Attempting OAuth account linking via RPC...')
        const { data: linkResult, error: rpcError } = await supabase.rpc('link_oauth_account', {
          p_auth_user_id: userId,
          p_existing_email: email,
          p_avatar_url: avatarUrl
        })
        
        if (!rpcError && linkResult?.success) {
          console.log('[createOAuthUserProfile] ✅ OAuth account linked successfully via RPC')
          // Now get the linked profile with the new auth ID
          const { data: linkedProfile, error: fetchError } = await getUserProfile(userId)
          if (!fetchError && linkedProfile) {
            return { data: linkedProfile, error: null }
          }
        } else {
          console.log('[createOAuthUserProfile] RPC linking failed, trying manual approach...')
        }
        
        // STEP 2: Manual fallback - look up and update existing profile
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
          
        if (!fetchError && existingUser) {
          console.log('[createOAuthUserProfile] Found existing profile, attempting manual linking...')
          
          // Try to update the existing user's auth ID
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ 
              id: userId, // Link new OAuth auth ID
              avatar_url: avatarUrl || existingUser.avatar_url,
              updated_at: new Date().toISOString()
            })
            .eq('email', email)
            .select()
            .single()
            
          if (!updateError && updatedUser) {
            console.log('[createOAuthUserProfile] ✅ Manual OAuth linking successful')
            return { data: updatedUser, error: null }
          } else {
            console.log('[createOAuthUserProfile] Manual linking failed, returning existing profile with new ID...')
            // Return existing user data but with new auth ID for the app to work
            return { 
              data: { ...existingUser, id: userId }, 
              error: null 
            }
          }
        } else {
          console.error('[createOAuthUserProfile] Could not find existing user by email')
        }
        
      } catch (linkingError) {
        console.error('[createOAuthUserProfile] All linking attempts failed:', linkingError)
      }
    }
    
    return { data: null, error: error as Error }
  }
}

/**
 * Get advice session by question ID
 * @param questionId - Question UUID
 * @returns Existing session if found
 */
export async function getSessionByQuestionId(questionId: string): Promise<ServiceResponse<any | null>> {
  try {
    console.log('[getSessionByQuestionId] Looking for session with question:', questionId)

    // Get the most recent session for this question (in case there are duplicates)
    const { data, error } = await supabase
      .from('advice_sessions')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const session = data && data.length > 0 ? data[0] : null
    console.log('[getSessionByQuestionId] Found session:', session?.id || 'none')
    return { data: session, error: null }
  } catch (error) {
    console.error('[getSessionByQuestionId] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create advice session when mentor accepts a question (no automatic welcome message)
 * @param questionId - Question UUID
 * @param mentorId - Mentor UUID
 * @returns Created advice session
 */
export async function createAdviceSession(
  questionId: string,
  mentorId: string
): Promise<ServiceResponse<any>> {
  try {
    console.log('[createAdviceSession] Creating session for question:', questionId, 'mentor:', mentorId)

    // First get the question to get the student_id
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('student_id')
      .eq('id', questionId)
      .single()

    if (questionError) {
      console.error('[createAdviceSession] Error fetching question:', questionError)
      throw questionError
    }

    if (!question) {
      throw new Error('Question not found')
    }

    // Prevent self-questions: check if student and mentor are the same user
    if (question.student_id === mentorId) {
      throw new Error('Students cannot ask questions to themselves')
    }

    // Create advice session
    const { data: session, error: sessionError } = await supabase
      .from('advice_sessions')
      .insert({
        question_id: questionId,
        student_id: question.student_id,
        mentor_id: mentorId,
        status: 'pending'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('[createAdviceSession] Error creating session:', sessionError)
      throw sessionError
    }

    // Update question status to assigned
    const { error: updateError } = await supabase
      .from('questions')
      .update({ status: 'assigned' })
      .eq('id', questionId)

    if (updateError) {
      console.error('[createAdviceSession] Error updating question status:', updateError)
      // Don't throw here, session was created successfully
    }

    console.log('[createAdviceSession] Session created successfully:', session.id)
    return { data: session, error: null }
  } catch (error) {
    console.error('[createAdviceSession] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Accept an advice session (mentor accepts to help with the question)
 * @param sessionId - Session UUID to accept
 * @param mentorId - Mentor UUID (for security check)
 * @returns Updated session
 */
export async function acceptAdviceSession(
  sessionId: string,
  mentorId: string
): Promise<ServiceResponse<any>> {
  try {
    console.log('[acceptAdviceSession] Accepting session:', sessionId, 'by mentor:', mentorId)
    
    // First, check if the session exists and the mentor is correctly assigned
    const { data: existingSession, error: fetchError } = await supabase
      .from('advice_sessions')
      .select('id, mentor_id, status')
      .eq('id', sessionId)
      .single()
    
    if (fetchError) {
      console.error('[acceptAdviceSession] Error fetching session:', fetchError)
      throw new Error(`Could not find session: ${fetchError.message}`)
    }
    
    if (!existingSession) {
      throw new Error('Session not found')
    }
    
    if (existingSession.mentor_id !== mentorId) {
      throw new Error(`Mentor mismatch. Expected: ${existingSession.mentor_id}, Got: ${mentorId}`)
    }
    
    console.log('[acceptAdviceSession] Session found, current status:', existingSession.status)

    const { data: session, error: sessionError } = await supabase
      .from('advice_sessions')
      .update({ 
        status: 'active',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('mentor_id', mentorId) // Security check - only the assigned mentor can accept
      .select()
      .single()

    if (sessionError) {
      console.error('[acceptAdviceSession] Error accepting session:', sessionError)
      console.error('[acceptAdviceSession] Error details:', {
        code: sessionError.code,
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint
      })
      throw sessionError
    }
    
    if (!session) {
      throw new Error('No session returned after update - possible RLS policy issue')
    }

    console.log('[acceptAdviceSession] Session accepted successfully:', session.id, 'new status:', session.status)
    return { data: session, error: null }
  } catch (error) {
    console.error('[acceptAdviceSession] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create a mentor profile for a user (used when approving mentor applications)
 * @param userId - User UUID
 * @param isVerified - Whether the mentor is verified (default: true for approved mentors)
 * @returns Created mentor profile
 */
/**
 * Get user's favorite mentors
 */
export async function getFavoriteMentors(studentId: string): Promise<ServiceResponse<any[]>> {
  try {
    const { data, error } = await supabase
      .from('favorite_wizzmos')
      .select(`
        *,
        mentor:users!favorite_wizzmos_mentor_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getFavoriteMentors] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Add mentor to favorites
 */
export async function addFavoriteMentor(studentId: string, mentorId: string): Promise<ServiceResponse<any>> {
  try {
    const { data, error } = await supabase
      .from('favorite_wizzmos')
      .insert({ student_id: studentId, mentor_id: mentorId })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[addFavoriteMentor] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Remove mentor from favorites
 */
export async function removeFavoriteMentor(studentId: string, mentorId: string): Promise<ServiceResponse<any>> {
  try {
    const { data, error } = await supabase
      .from('favorite_wizzmos')
      .delete()
      .eq('student_id', studentId)
      .eq('mentor_id', mentorId)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[removeFavoriteMentor] Error:', error)
    return { data: null, error: error as Error }
  }
}

export async function createMentorProfile(
  userId: string,
  isVerified: boolean = true
): Promise<ServiceResponse<MentorProfile>> {
  try {
    console.log('[createMentorProfile] Creating mentor profile for user:', userId)

    // SQL: INSERT INTO mentor_profiles (user_id, ...) VALUES ($1, ...) RETURNING *
    const { data, error } = await supabase
      .from('mentor_profiles')
      .insert({
        user_id: userId,
        is_verified: isVerified,
        verification_status: isVerified ? 'verified' : 'pending',
        availability_status: 'available',
        total_questions_answered: 0,
        average_rating: 0,
        total_helpful_votes: 0,
        response_time_avg: null,
      })
      .select()
      .single()

    if (error) throw error

    console.log('[createMentorProfile] Mentor profile created successfully')
    return { data, error: null }
  } catch (error) {
    console.error('[createMentorProfile] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * ADMIN FUNCTION: Approve a mentor application and upgrade user to mentor role
 * This should be called after reviewing a "Become a Wizzmo" application
 * @param userId - User UUID to promote to mentor
 * @param categoryIds - Array of category IDs the mentor can help with (expertise areas)
 * @returns Success status with created mentor profile
 */
export async function approveMentorApplication(
  userId: string,
  categoryIds: string[] = []
): Promise<ServiceResponse<{ user: User; mentorProfile: MentorProfile }>> {
  try {
    console.log('[approveMentorApplication] Approving mentor:', userId)

    // Step 1: Update user role to 'mentor' or 'both'
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        role: 'mentor', // or 'both' if they want to still ask questions
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (userError) throw userError

    // Step 2: Create mentor profile
    const { data: mentorProfile, error: profileError } = await createMentorProfile(userId, true)

    if (profileError) throw profileError

    // Step 3: Add expertise areas (categories they can help with)
    if (categoryIds.length > 0 && mentorProfile) {
      const expertiseInserts = categoryIds.map(catId => ({
        mentor_profile_id: mentorProfile.id,
        category_id: catId,
      }))

      const { error: expertiseError } = await supabase
        .from('mentor_expertise')
        .insert(expertiseInserts)

      if (expertiseError) {
        console.error('[approveMentorApplication] Error adding expertise:', expertiseError)
        // Don't fail - mentor is still created
      }
    }

    console.log('[approveMentorApplication] Mentor approved successfully')
    return {
      data: { user, mentorProfile: mentorProfile! },
      error: null
    }
  } catch (error) {
    console.error('[approveMentorApplication] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get user role (student/mentor/both)
 * @param userId - User UUID
 * @returns User role
 */
export async function getUserRole(userId: string): Promise<ServiceResponse<UserRole>> {
  try {
    console.log('[getUserRole] Fetching role for user:', userId)

    // SQL: SELECT role FROM users WHERE id = $1
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error

    console.log('[getUserRole] Role:', data.role)
    return { data: data.role, error: null }
  } catch (error) {
    console.error('[getUserRole] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Check if a username is available (case-insensitive)
 * @param username - Username to check
 * @param excludeUserId - Exclude this user ID from check (for updating own username)
 * @returns Whether username is available
 */
export async function checkUsernameAvailable(
  username: string, 
  excludeUserId?: string
): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[checkUsernameAvailable] Checking username:', username)

    let query = supabase
      .from('users')
      .select('id')
      .ilike('username', username) // Case-insensitive check

    // Exclude current user if updating their own username
    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query

    if (error) throw error

    const isAvailable = !data || data.length === 0
    console.log('[checkUsernameAvailable] Available:', isAvailable)
    return { data: isAvailable, error: null }
  } catch (error) {
    console.error('[checkUsernameAvailable] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Generate a unique username from full name
 * @param fullName - User's full name
 * @returns Unique username suggestion
 */
export async function generateUniqueUsername(fullName: string): Promise<ServiceResponse<string>> {
  try {
    console.log('[generateUniqueUsername] Generating for:', fullName)

    // Create base username from full name
    const baseUsername = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
      .substring(0, 15) // Limit length

    // Check if base username is available
    const { data: isBaseAvailable } = await checkUsernameAvailable(baseUsername)
    if (isBaseAvailable) {
      return { data: baseUsername, error: null }
    }

    // Try with numbers appended
    for (let i = 1; i <= 999; i++) {
      const numberedUsername = `${baseUsername}${i}`
      const { data: isAvailable } = await checkUsernameAvailable(numberedUsername)
      if (isAvailable) {
        console.log('[generateUniqueUsername] Generated:', numberedUsername)
        return { data: numberedUsername, error: null }
      }
    }

    // Fallback with random number
    const randomUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`
    console.log('[generateUniqueUsername] Fallback:', randomUsername)
    return { data: randomUsername, error: null }
  } catch (error) {
    console.error('[generateUniqueUsername] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// QUESTION OPERATIONS
// ============================================================================

/**
 * Create a new question
 * @param studentId - Student UUID
 * @param categoryId - Category UUID
 * @param title - Question title
 * @param content - Question content
 * @param isAnonymous - Whether question is anonymous
 * @param urgency - Question urgency level
 * @returns Created question
 */
export async function createQuestion(
  studentId: string,
  categoryId: string,
  title: string,
  content: string,
  isAnonymous: boolean = false,
  urgency: Urgency = 'low',
  vertical: string = CURRENT_VERTICAL_KEY,
  preferredMentorId?: string
): Promise<ServiceResponse<Question>> {
  try {
    console.log('[createQuestion] Creating question:', { studentId, categoryId, title, urgency, vertical })

    // SQL: INSERT INTO questions (...) VALUES (...) RETURNING *
    const { data, error } = await supabase
      .from('questions')
      .insert({
        student_id: studentId,
        category_id: categoryId,
        title,
        content,
        is_anonymous: isAnonymous,
        urgency,
        status: 'pending',
        vertical,
        preferred_mentor_id: preferredMentorId,
      })
      .select()
      .single()

    if (error) throw error

    console.log('[createQuestion] Question created:', data.id)
    return { data, error: null }
  } catch (error) {
    console.error('[createQuestion] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all questions for a student
 * @param studentId - Student UUID
 * @returns Array of questions
 */
export async function getQuestionsByStudent(studentId: string, vertical: string = CURRENT_VERTICAL_KEY): Promise<ServiceResponse<Question[]>> {
  try {
    console.log(`[getQuestionsByStudent] Fetching questions for student: ${studentId}, vertical: ${vertical}`)

    // SQL: SELECT * FROM questions WHERE student_id = $1 AND vertical = $2 ORDER BY created_at DESC
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('student_id', studentId)
      .eq('vertical', vertical)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log('[getQuestionsByStudent] Found', data?.length, 'questions')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getQuestionsByStudent] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get ALL pending questions for mentor inbox (ignoring expertise for now)
 * @param mentorId - Mentor UUID
 * @returns Array of pending questions
 */
export async function getPendingQuestions(mentorId: string, vertical: string = CURRENT_VERTICAL_KEY): Promise<ServiceResponse<(Question & { category: Category })[]>> {
  try {
    console.log(`[getPendingQuestions] Fetching ALL pending questions for mentor: ${mentorId}, vertical: ${vertical}`)

    // Check if user is a mentor
    const { data: profileData, error: profileError } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', mentorId)
      .maybeSingle()

    if (profileError) {
      console.error('[getPendingQuestions] Error fetching mentor profile:', profileError)
      throw profileError
    }

    if (!profileData) {
      console.log('[getPendingQuestions] No mentor profile found for user:', mentorId)
      return { data: [], error: null }
    }

    console.log('[getPendingQuestions] Mentor profile ID:', profileData.id)

    // Get pending questions that are NOT specifically requested for another mentor
    const { data, error } = await supabase
      .from('questions')
      .select('*, category:categories(*)')
      .eq('status', 'pending')
      .eq('vertical', vertical)
      .or(`preferred_mentor_id.is.null,preferred_mentor_id.eq.${mentorId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getPendingQuestions] Error fetching questions:', error)
      throw error
    }

    console.log('[getPendingQuestions] Found', data?.length, 'pending questions')
    console.log('[getPendingQuestions] Questions data:', data)
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getPendingQuestions] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get questions specifically requested for a particular mentor
 * @param mentorId - Mentor UUID
 * @returns Array of questions specifically requested for this mentor
 */
export async function getRequestedQuestions(mentorId: string, vertical: string = CURRENT_VERTICAL_KEY): Promise<ServiceResponse<(Question & { category: Category })[]>> {
  try {
    console.log(`[getRequestedQuestions] Fetching questions specifically requested for mentor: ${mentorId}, vertical: ${vertical}`)

    // Check if user is a mentor
    const { data: profileData, error: profileError } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', mentorId)
      .maybeSingle()

    if (profileError) {
      console.error('[getRequestedQuestions] Error fetching mentor profile:', profileError)
      throw profileError
    }

    if (!profileData) {
      console.log('[getRequestedQuestions] No mentor profile found for user:', mentorId)
      return { data: [], error: null }
    }

    // Get questions specifically requested for this mentor
    const { data, error } = await supabase
      .from('questions')
      .select('*, category:categories(*)')
      .eq('status', 'pending')
      .eq('vertical', vertical)
      .eq('preferred_mentor_id', mentorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getRequestedQuestions] Error fetching questions:', error)
      throw error
    }

    console.log('[getRequestedQuestions] Found', data?.length, 'questions specifically requested for this mentor')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getRequestedQuestions] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update question status
 * @param questionId - Question UUID
 * @param status - New status
 * @returns Updated question
 */
export async function updateQuestionStatus(
  questionId: string,
  status: QuestionStatus
): Promise<ServiceResponse<Question>> {
  try {
    console.log('[updateQuestionStatus] Updating question:', questionId, 'to status:', status)

    // SQL: UPDATE questions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    const { data, error } = await supabase
      .from('questions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single()

    if (error) throw error

    console.log('[updateQuestionStatus] Question status updated')
    return { data, error: null }
  } catch (error) {
    console.error('[updateQuestionStatus] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// CHAT/SESSION OPERATIONS
// ============================================================================


/**
 * Get active sessions for a user (student or mentor)
 * @param userId - User UUID
 * @param role - User role (student/mentor)
 * @returns Array of active sessions with related data
 */
export async function getActiveSessions(
  userId: string,
  role: 'student' | 'mentor'
): Promise<ServiceResponse<(AdviceSession & { question: Question; messages: Message[] })[]>> {
  try {
    console.log('[getActiveSessions] Fetching active sessions for:', userId, role)

    let query = supabase
      .from('advice_sessions')
      .select(`
        *,
        question:questions(*),
        messages(*)
      `)
      .in('status', ['accepted', 'active'])
      .order('updated_at', { ascending: false })

    // Filter by role
    if (role === 'student') {
      // SQL: ... WHERE questions.student_id = $1
      query = query.eq('question.student_id', userId)
    } else {
      // SQL: ... WHERE mentor_id = $1
      query = query.eq('mentor_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    console.log('[getActiveSessions] Found', data?.length, 'active sessions')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getActiveSessions] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get resolved sessions for a user (student or mentor)
 * @param userId - User UUID
 * @param role - User role (student/mentor)
 * @returns Array of resolved sessions
 */
export async function getResolvedSessions(
  userId: string,
  role: 'student' | 'mentor'
): Promise<ServiceResponse<(AdviceSession & { question: Question; rating?: Rating })[]>> {
  try {
    console.log('[getResolvedSessions] Fetching resolved sessions for:', userId, role)

    let query = supabase
      .from('advice_sessions')
      .select(`
        *,
        question:questions(*),
        ratings(*)
      `)
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false })

    if (role === 'student') {
      query = query.eq('question.student_id', userId)
    } else {
      query = query.eq('mentor_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    console.log('[getResolvedSessions] Found', data?.length, 'resolved sessions')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getResolvedSessions] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update session status (accept, decline, resolve)
 * @param sessionId - Session UUID
 * @param status - New status
 * @returns Updated session
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  userId?: string
): Promise<ServiceResponse<AdviceSession>> {
  try {
    console.log('[updateSessionStatus] Updating session:', sessionId, 'to status:', status)
    console.log('[updateSessionStatus] Current user ID:', userId)

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'accepted') {
      updates.accepted_at = new Date().toISOString()
    } else if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    // Use RPC function to bypass RLS for session status updates
    // This allows both students and mentors to resolve sessions
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('resolve_session', {
        session_id: sessionId,
        new_status: status,
        user_id: userId
      })

    if (rpcError) {
      console.error('[updateSessionStatus] RPC error, falling back to direct update:', rpcError)
      
      // Fallback to direct update - try to update anyway
      const { data: updateData, error: updateError } = await supabase
        .from('advice_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .maybeSingle()
      
      if (updateError) {
        console.error('[updateSessionStatus] Direct update also failed:', updateError)
        throw updateError
      }
      
      console.log('[updateSessionStatus] Fallback update succeeded')
      return { data: updateData, error: null }
    }

    console.log('[updateSessionStatus] RPC call succeeded')
    console.log('[updateSessionStatus] RPC data:', rpcData)
    
    // RPC function returns an array of rows
    const updatedSession = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : null
    
    if (updatedSession) {
      console.log('[updateSessionStatus] Session updated via RPC - Status:', updatedSession.status)
      return { data: updatedSession, error: null }
    } else {
      console.log('[updateSessionStatus] No data returned from RPC')
      return { data: null, error: new Error('No session updated') }
    }
  } catch (error) {
    console.error('[updateSessionStatus] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all messages for a chat session
 * @param sessionId - Session UUID
 * @returns Array of messages ordered by time
 */
export async function getChatMessages(sessionId: string): Promise<ServiceResponse<Message[]>> {
  try {
    console.log('[getChatMessages] Fetching messages for session:', sessionId)

    // SQL: SELECT * FROM messages WHERE advice_session_id = $1 ORDER BY created_at ASC
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('advice_session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error

    console.log('[getChatMessages] Found', data?.length, 'messages')
    // Log read status of last few messages for debugging
    if (data && data.length > 0) {
      const lastMessages = data.slice(-3);
      console.log('[getChatMessages] Read status check:', lastMessages.map(m => ({ 
        id: m.id.slice(0, 8), 
        sender: m.sender_id.slice(0, 8),
        is_read: m.is_read 
      })));
    }
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getChatMessages] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Send a message in a chat session
 * @param sessionId - Session UUID
 * @param senderId - Sender UUID
 * @param content - Message content
 * @returns Created message
 */
export async function sendMessage(
  sessionId: string,
  senderId: string,
  content: string
): Promise<ServiceResponse<Message>> {
  try {
    console.log('[sendMessage] 📤 Sending message:', {
      sessionId: sessionId.slice(0, 8),
      senderId: senderId.slice(0, 8),
      contentLength: content.length
    })

    // SQL: INSERT INTO messages (...) VALUES (...) RETURNING *
    const { data: dbMessage, error } = await supabase
      .from('messages')
      .insert({
        advice_session_id: sessionId,
        sender_id: senderId,
        content,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[sendMessage] ❌ Database insert error:', error)
      throw error
    }

    console.log('[sendMessage] ✅ Message inserted into DB:', {
      messageId: dbMessage.id.slice(0, 8),
      timestamp: dbMessage.created_at
    })

    // Get sender profile for complete message object
    const { data: senderProfile } = await getUserProfile(senderId)

    // Build complete message object for UI
    const completeMessage: Message = {
      id: dbMessage.id,
      content: dbMessage.content || '',
      audio_url: dbMessage.audio_url,
      image_url: dbMessage.image_url,
      created_at: dbMessage.created_at,
      sender_id: dbMessage.sender_id,
      isFromCurrentUser: true, // This is always true for sent messages
      senderName: senderProfile?.full_name || 'You',
      senderAvatar: senderProfile?.avatar_url || '💕',
    }

    // Update session updated_at timestamp
    await supabase
      .from('advice_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    console.log('[sendMessage] 🎯 Complete message object created:', {
      id: completeMessage.id.slice(0, 8),
      isFromCurrentUser: completeMessage.isFromCurrentUser,
      senderName: completeMessage.senderName
    })
    
    return { data: completeMessage, error: null }
  } catch (error) {
    console.error('[sendMessage] ❌ Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Edit an existing message
 * @param messageId - Message UUID to edit
 * @param senderId - Sender UUID (for security)
 * @param newContent - New message content
 * @returns Updated message object
 */
export async function editMessage(
  messageId: string,
  senderId: string,
  newContent: string
): Promise<ServiceResponse<Message>> {
  try {
    console.log('[editMessage] ✏️ Editing message:', {
      messageId: messageId.slice(0, 8),
      senderId: senderId.slice(0, 8),
      contentLength: newContent.length
    })

    // First, get the current message to increment edit count
    const { data: currentMessage, error: fetchError } = await supabase
      .from('messages')
      .select('edit_count')
      .eq('id', messageId)
      .eq('sender_id', senderId)
      .single()

    if (fetchError) {
      console.error('[editMessage] ❌ Failed to fetch current message:', fetchError)
      throw fetchError
    }

    // Update the message with new content and increment edit count
    const { data: dbMessage, error } = await supabase
      .from('messages')
      .update({
        content: newContent.trim(),
        edit_count: (currentMessage.edit_count || 0) + 1,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', senderId)
      .select()
      .single()

    if (error) {
      console.error('[editMessage] ❌ Database update error:', error)
      throw error
    }

    console.log('[editMessage] ✅ Message updated in DB:', {
      messageId: dbMessage.id.slice(0, 8),
      editCount: dbMessage.edit_count,
      editedAt: dbMessage.edited_at
    })

    // Get sender profile for complete message object
    const { data: senderProfile } = await getUserProfile(senderId)

    // Build complete message object for UI
    const completeMessage: Message = {
      id: dbMessage.id,
      content: dbMessage.content || '',
      audio_url: dbMessage.audio_url,
      image_url: dbMessage.image_url,
      created_at: dbMessage.created_at,
      edited_at: dbMessage.edited_at,
      edit_count: dbMessage.edit_count,
      sender_id: dbMessage.sender_id,
      isFromCurrentUser: true,
      senderName: senderProfile?.full_name || 'You',
      senderAvatar: senderProfile?.avatar_url || '💕',
    }

    console.log('[editMessage] 🎯 Complete edited message object created:', {
      id: completeMessage.id.slice(0, 8),
      editCount: completeMessage.edit_count,
      hasEditedAt: !!completeMessage.edited_at
    })
    
    return { data: completeMessage, error: null }
  } catch (error) {
    console.error('[editMessage] ❌ Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark messages as read for a user in a session
 * @param sessionId - Session UUID
 * @param userId - User UUID (who is reading)
 * @returns Number of messages marked as read
 */
export async function markMessagesAsRead(
  sessionId: string,
  userId: string
): Promise<ServiceResponse<number>> {
  try {
    console.log('[markMessagesAsRead] Marking messages as read for user:', userId, 'in session:', sessionId)

    // SQL: UPDATE messages SET is_read = true
    //      WHERE advice_session_id = $1 AND sender_id != $2 AND is_read = false
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('advice_session_id', sessionId)
      .neq('sender_id', userId)
      .eq('is_read', false)
      .select()

    if (error) throw error

    const count = data?.length || 0
    console.log('[markMessagesAsRead] Marked', count, 'messages as read')
    
    // If messages were marked as read, update the session timestamp to trigger list refresh
    if (count > 0) {
      console.log('[markMessagesAsRead] Updating session timestamp to trigger refresh')
      await supabase
        .from('advice_sessions')
        .update({ 
          updated_at: new Date().toISOString(),
          // Force a dummy update to ensure the session row is updated
          status: 'active'
        })
        .eq('id', sessionId)
        .eq('status', 'active')
    }
    
    return { data: count, error: null }
  } catch (error) {
    console.error('[markMessagesAsRead] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// RATING OPERATIONS
// ============================================================================

/**
 * Submit rating for a completed session
 * @param sessionId - Session UUID
 * @param studentId - Student UUID
 * @param mentorId - Mentor UUID
 * @param rating - Rating (1-5)
 * @param feedback - Optional feedback text
 * @returns Created rating
 */
export async function submitRating(
  sessionId: string,
  studentId: string,
  mentorId: string,
  rating: number,
  feedback: string | null = null
): Promise<ServiceResponse<Rating>> {
  try {
    console.log('[submitRating] Submitting rating:', { sessionId, rating })

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // SQL: INSERT INTO ratings (...) VALUES (...) RETURNING *
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        advice_session_id: sessionId,
        student_id: studentId,
        mentor_id: mentorId,
        rating,
        feedback_text: feedback,
      })
      .select()
      .single()

    if (error) throw error

    // Update mentor stats
    await updateMentorStats(mentorId)

    console.log('[submitRating] Rating submitted:', data.id)
    return { data, error: null }
  } catch (error) {
    console.error('[submitRating] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get rating for a session if it exists
 * @param sessionId - Session UUID
 * @returns Rating or null
 */
export async function getRatingForSession(sessionId: string): Promise<ServiceResponse<Rating | null>> {
  try {
    console.log('[getRatingForSession] Fetching rating for session:', sessionId)

    // SQL: SELECT * FROM ratings WHERE advice_session_id = $1
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('advice_session_id', sessionId)
      .maybeSingle()

    if (error) throw error

    console.log('[getRatingForSession] Rating found:', !!data)
    return { data, error: null }
  } catch (error) {
    console.error('[getRatingForSession] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Recalculate and update mentor stats (average rating, questions answered, etc.)
 * @param mentorId - Mentor UUID
 * @returns Updated mentor profile
 */
export async function updateMentorStats(mentorId: string): Promise<ServiceResponse<MentorProfile>> {
  try {
    console.log('[updateMentorStats] Updating stats for mentor:', mentorId)

    // Get mentor profile - check if it exists first
    const { data: profile, error: profileError } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', mentorId)
      .maybeSingle()

    // If no mentor profile exists, this user isn't a mentor yet - return early
    if (!profile) {
      console.log('[updateMentorStats] No mentor profile found for user:', mentorId)
      return { data: null, error: null }
    }

    if (profileError) throw profileError

    // Calculate average rating from resolved sessions
    // SQL: SELECT AVG(rating) FROM advice_sessions WHERE mentor_id = $1 AND status = 'resolved' AND rating IS NOT NULL
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('advice_sessions')
      .select('rating')
      .eq('mentor_id', mentorId)
      .eq('status', 'resolved')
      .not('rating', 'is', null)

    if (ratingsError) throw ratingsError

    const ratings = ratingsData || []
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

    // Count resolved sessions
    // SQL: SELECT COUNT(*) FROM advice_sessions WHERE mentor_id = $1 AND status = 'resolved'
    const { count: resolvedCount, error: countError } = await supabase
      .from('advice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('mentor_id', mentorId)
      .eq('status', 'resolved')

    if (countError) throw countError

    // Update mentor profile
    // SQL: UPDATE mentor_profiles SET ... WHERE user_id = $1 RETURNING *
    const { data, error } = await supabase
      .from('mentor_profiles')
      .update({
        average_rating: avgRating,
        total_questions_answered: resolvedCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', mentorId)
      .select()
      .maybeSingle()

    if (error) throw error

    console.log('[updateMentorStats] Stats updated:', { avgRating, resolvedCount })
    return { data, error: null }
  } catch (error) {
    console.error('[updateMentorStats] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// FEED OPERATIONS
// ============================================================================

/**
 * Get public questions for feed (non-anonymous, with vote counts and comments)
 * @param limit - Maximum number of questions to return
 * @returns Array of questions with engagement data
 */
export async function getPublicQuestions(limit: number = 20, sortBy: 'recent' | 'trending' = 'recent', vertical: string = CURRENT_VERTICAL_KEY): Promise<ServiceResponse<any[]>> {
  try {
    console.log('[getPublicQuestions] Fetching public questions, limit:', limit, 'sortBy:', sortBy, 'vertical:', vertical)

    // Simplified query - get questions with basic category info
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        category:categories(id, name, slug, icon)
      `)
      .eq('is_anonymous', false)
      .eq('vertical', vertical)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (questionsError) {
      console.error('[getPublicQuestions] Questions error:', questionsError)
      throw questionsError
    }

    if (!questions || questions.length === 0) {
      console.log('[getPublicQuestions] No questions found')
      return { data: [], error: null }
    }

    console.log('[getPublicQuestions] Found', questions.length, 'questions')

    // Fetch votes and comments separately for each question
    const questionsWithData = await Promise.all(
      questions.map(async (question) => {
        // Get votes for this question
        const { data: votes } = await supabase
          .from('feed_votes')
          .select('*')
          .eq('question_id', question.id)

        // Get comments for this question  
        const { data: comments } = await supabase
          .from('feed_comments')
          .select('*')
          .eq('question_id', question.id)

        return {
          ...question,
          feed_votes: votes || [],
          feed_comments: comments || []
        }
      })
    )

    // Apply sorting after enhancement
    let sortedQuestions = questionsWithData;
    if (sortBy === 'trending') {
      sortedQuestions = questionsWithData.sort((a, b) => {
        const aScore = (a.feed_votes.length * 2) + (a.feed_comments.length * 3);
        const bScore = (b.feed_votes.length * 2) + (b.feed_comments.length * 3);
        return bScore - aScore;
      });
    }

    console.log('[getPublicQuestions] Enhanced', sortedQuestions.length, 'questions with votes/comments')
    return { data: sortedQuestions, error: null }
  } catch (error) {
    console.error('[getPublicQuestions] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Upvote a question
 * @param questionId - Question UUID
 * @param userId - User UUID
 * @returns Created vote
 */
export async function upvoteQuestion(questionId: string, userId: string): Promise<ServiceResponse<any>> {
  try {
    console.log('[upvoteQuestion] Upvoting question:', questionId)

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('feed_votes')
      .select('*')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingVote) {
      // Update existing vote
      // SQL: UPDATE feed_votes SET vote_type = 'upvote' WHERE id = $1
      const { data, error } = await supabase
        .from('feed_votes')
        .update({ vote_type: 'upvote' })
        .eq('id', existingVote.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }

    // Create new vote
    // SQL: INSERT INTO feed_votes (...) VALUES (...) RETURNING *
    const { data, error } = await supabase
      .from('feed_votes')
      .insert({
        question_id: questionId,
        user_id: userId,
        vote_type: 'upvote',
      })
      .select()
      .single()

    if (error) throw error

    console.log('[upvoteQuestion] Vote recorded')
    return { data, error: null }
  } catch (error) {
    console.error('[upvoteQuestion] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Downvote a question
 * @param questionId - Question UUID
 * @param userId - User UUID
 * @returns Created vote
 */
export async function downvoteQuestion(questionId: string, userId: string): Promise<ServiceResponse<any>> {
  try {
    console.log('[downvoteQuestion] Downvoting question:', questionId)

    const { data: existingVote } = await supabase
      .from('feed_votes')
      .select('*')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingVote) {
      const { data, error } = await supabase
        .from('feed_votes')
        .update({ vote_type: 'downvote' })
        .eq('id', existingVote.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }

    const { data, error } = await supabase
      .from('feed_votes')
      .insert({
        question_id: questionId,
        user_id: userId,
        vote_type: 'downvote',
      })
      .select()
      .single()

    if (error) throw error

    console.log('[downvoteQuestion] Vote recorded')
    return { data, error: null }
  } catch (error) {
    console.error('[downvoteQuestion] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Add a comment to a question in the feed
 * @param questionId - Question UUID
 * @param mentorId - Mentor UUID
 * @param content - Comment content
 * @returns Created comment
 */
export async function addFeedComment(
  questionId: string,
  mentorId: string,
  content: string
): Promise<ServiceResponse<FeedComment>> {
  try {
    console.log('[addFeedComment] Adding comment to question:', questionId)

    // SQL: INSERT INTO feed_comments (...) VALUES (...) RETURNING *
    const { data, error } = await supabase
      .from('feed_comments')
      .insert({
        question_id: questionId,
        user_id: mentorId,
        content,
        helpful_votes: 0,
      })
      .select()
      .single()

    if (error) throw error

    console.log('[addFeedComment] Comment added:', data.id)
    return { data, error: null }
  } catch (error) {
    console.error('[addFeedComment] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all comments for a question
 * @param questionId - Question UUID
 * @returns Array of comments with mentor info
 */
export async function getFeedComments(questionId: string): Promise<ServiceResponse<FeedComment[]>> {
  try {
    console.log('[getFeedComments] Fetching comments for question:', questionId)

    // SQL: SELECT feed_comments.*, users.* FROM feed_comments
    //      JOIN users ON feed_comments.user_id = users.id
    //      WHERE question_id = $1 ORDER BY created_at DESC
    const { data, error } = await supabase
      .from('feed_comments')
      .select(`
        *,
        user:users(id, full_name, username, avatar_url, role)
      `)
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log('[getFeedComments] Found', data?.length, 'comments')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getFeedComments] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update mentor's total helpful votes based on their comments
 * @param mentorId - Mentor UUID
 * @returns Updated mentor profile
 */
export async function updateMentorHelpfulVotes(mentorId: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[updateMentorHelpfulVotes] Updating helpful votes for mentor:', mentorId)

    // First, get all comments by this mentor and sum their helpful votes
    const { data: comments, error: commentsError } = await supabase
      .from('feed_comments')
      .select('helpful_votes')
      .eq('user_id', mentorId)

    if (commentsError) throw commentsError

    // Calculate total helpful votes
    const totalHelpfulVotes = comments.reduce((sum, comment) => {
      return sum + (comment.helpful_votes || 0)
    }, 0)

    console.log(`[updateMentorHelpfulVotes] Calculated ${totalHelpfulVotes} total helpful votes for mentor ${mentorId}`)

    // Update the mentor profile
    const { error: updateError } = await supabase
      .from('mentor_profiles')
      .update({ 
        total_helpful_votes: totalHelpfulVotes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', mentorId)

    if (updateError) throw updateError

    console.log('[updateMentorHelpfulVotes] Mentor helpful votes updated successfully')
    return { data: true, error: null }
  } catch (error) {
    console.error('[updateMentorHelpfulVotes] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Check if a user has voted helpful on a comment by checking for existing vote record
 * @param commentId - Comment UUID
 * @param userId - User UUID
 * @returns Boolean indicating if user has voted
 */
export async function hasUserVotedHelpful(commentId: string, userId: string): Promise<ServiceResponse<boolean>> {
  try {
    // Try to find an existing vote record in comment_helpful_votes table
    const { data, error } = await supabase
      .from('comment_helpful_votes') 
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    // If table doesn't exist or no record found, return false
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // No record found or table doesn't exist - user hasn't voted
        return { data: false, error: null }
      }
      throw error
    }

    return { data: !!data, error: null }
  } catch (error) {
    // If table doesn't exist, gracefully return false
    if ((error as any)?.code === '42P01') {
      console.log('[hasUserVotedHelpful] comment_helpful_votes table does not exist, treating as no votes')
      return { data: false, error: null }
    }
    console.error('[hasUserVotedHelpful] Error:', error)
    return { data: false, error: null } // Default to false on error
  }
}

/**
 * Toggle helpful vote on a comment (vote/unvote with proper tracking)
 * @param commentId - Comment UUID
 * @param userId - User UUID
 * @returns Updated comment with new vote status and isHelpful state
 */
export async function toggleCommentHelpful(commentId: string, userId: string): Promise<ServiceResponse<{comment: FeedComment, isHelpful: boolean}>> {
  try {
    console.log('[toggleCommentHelpful] Toggling helpful vote for comment:', commentId, 'user:', userId)
    
    // Check if user has already voted
    const { data: hasVoted } = await hasUserVotedHelpful(commentId, userId)
    
    // Get current comment
    const { data: comment, error: fetchError } = await supabase
      .from('feed_comments')
      .select('helpful_votes, user_id')
      .eq('id', commentId)
      .single()

    if (fetchError) {
      console.error('[toggleCommentHelpful] Comment not found:', fetchError)
      return { data: null, error: new Error('Comment not found') }
    }

    let newVoteCount: number
    let isHelpful: boolean

    if (hasVoted) {
      // User already voted, remove vote
      console.log('[toggleCommentHelpful] Removing helpful vote')
      
      try {
        // Try to remove vote record
        await supabase
          .from('comment_helpful_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
      } catch (error) {
        // If table doesn't exist, that's okay - just log it
        console.log('[toggleCommentHelpful] Could not remove vote record (table may not exist):', error)
      }

      // Decrement count
      newVoteCount = Math.max(0, (comment.helpful_votes || 0) - 1)
      isHelpful = false
    } else {
      // User hasn't voted, add vote
      console.log('[toggleCommentHelpful] Adding helpful vote')
      
      try {
        // Try to add vote record
        await supabase
          .from('comment_helpful_votes')
          .insert({
            comment_id: commentId,
            user_id: userId,
            created_at: new Date().toISOString()
          })
      } catch (error) {
        // If table doesn't exist, that's okay for now - just log it
        console.log('[toggleCommentHelpful] Could not add vote record (table may not exist):', error)
      }

      // Increment count
      newVoteCount = (comment.helpful_votes || 0) + 1
      isHelpful = true
    }

    // Update comment with new count
    const { data: updated, error: updateError } = await supabase
      .from('feed_comments')
      .update({ helpful_votes: newVoteCount })
      .eq('id', commentId)
      .select()
      .single()

    if (updateError) throw updateError

    // Update mentor's total helpful votes
    if (comment.user_id) {
      await updateMentorHelpfulVotes(comment.user_id)
    }

    console.log('[toggleCommentHelpful] Vote toggled successfully. New count:', newVoteCount, 'isHelpful:', isHelpful)
    return { data: { comment: updated, isHelpful }, error: null }
  } catch (error) {
    console.error('[toggleCommentHelpful] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark a comment as helpful (increment helpful_votes) - DEPRECATED: Use toggleCommentHelpful instead
 * @param commentId - Comment UUID
 * @param userId - User UUID (for tracking who voted)
 * @returns Updated comment
 */
export async function markCommentHelpful(commentId: string, userId: string): Promise<ServiceResponse<FeedComment>> {
  console.log('[markCommentHelpful] Using legacy function - consider switching to toggleCommentHelpful')
  
  // For now, just call the toggle function and return the comment part
  const result = await toggleCommentHelpful(commentId, userId)
  if (result.error || !result.data) {
    return { data: null, error: result.error || new Error('Unknown error') }
  }
  
  return { data: result.data.comment, error: null }
}

/**
 * Get user's helpful votes for a list of comments
 * @param commentIds - Array of comment UUIDs
 * @param userId - User UUID
 * @returns Map of commentId -> boolean indicating if user voted helpful
 */
export async function getUserHelpfulVotes(commentIds: string[], userId: string): Promise<ServiceResponse<Map<string, boolean>>> {
  try {
    if (commentIds.length === 0) {
      return { data: new Map(), error: null }
    }

    const voteMap = new Map<string, boolean>()
    
    try {
      // Try to get votes from comment_helpful_votes table
      const { data: votes, error } = await supabase
        .from('comment_helpful_votes')
        .select('comment_id')
        .in('comment_id', commentIds)
        .eq('user_id', userId)

      if (error) throw error

      // Mark voted comments as true
      if (votes) {
        votes.forEach(vote => {
          voteMap.set(vote.comment_id, true)
        })
      }

      // Set remaining comments to false
      commentIds.forEach(id => {
        if (!voteMap.has(id)) {
          voteMap.set(id, false)
        }
      })

      console.log('[getUserHelpfulVotes] Found votes for', voteMap.size, 'comments')
      return { data: voteMap, error: null }
    } catch (error) {
      // If table doesn't exist, return all false
      console.log('[getUserHelpfulVotes] Could not fetch votes (table may not exist), defaulting to false')
      commentIds.forEach(id => voteMap.set(id, false))
      return { data: voteMap, error: null }
    }
  } catch (error) {
    console.error('[getUserHelpfulVotes] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// SUBSCRIPTION OPERATIONS
// ============================================================================

/**
 * Get user's subscription details
 * @param userId - User UUID
 * @returns Subscription details
 */
export async function getUserSubscription(userId: string): Promise<ServiceResponse<Subscription>> {
  try {
    console.log('[getUserSubscription] Fetching subscription for user:', userId)

    // SQL: SELECT * FROM subscriptions WHERE user_id = $1
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() to handle case when subscription doesn't exist

    if (error) throw error

    // If no subscription exists, create a default free one
    if (!data) {
      console.log('[getUserSubscription] No subscription found, creating default free subscription')
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'free',
          status: 'active',
          questions_limit: 3,
          questions_used: 0,
        })
        .select()
        .single()

      if (createError) throw createError
      console.log('[getUserSubscription] Created subscription:', newSub?.plan_type, newSub?.status)
      return { data: newSub, error: null }
    }

    console.log('[getUserSubscription] Subscription:', data.plan_type, data.status)
    return { data, error: null }
  } catch (error) {
    console.error('[getUserSubscription] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update user's subscription
 * @param userId - User UUID
 * @param plan - Plan type
 * @param status - Subscription status
 * @returns Updated subscription
 */
export async function updateSubscription(
  userId: string,
  plan: PlanType,
  status: SubscriptionStatus
): Promise<ServiceResponse<Subscription>> {
  try {
    if (__DEV__) {
      console.log('[updateSubscription] Updating subscription:', { userId, plan, status })
      console.log('[updateSubscription] Plan type check:', typeof plan, plan)
      console.log('[updateSubscription] Status type check:', typeof status, status)
    }
    
    // Debug: Check authentication state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (__DEV__) {
      console.log('[updateSubscription] Auth session:', {
        isAuthenticated: !!session?.user,
        authUserId: session?.user?.id,
        targetUserId: userId,
        userIdsMatch: session?.user?.id === userId
      })
    }
    
    // Note: RLS policies in Supabase will handle authorization
    // Only check if user is authenticated, not exact ID match
    if (!session?.user) {
      throw new Error('User not authenticated - cannot update subscription')
    }
    
    // First try to update existing subscription
    const updateData = {
      plan_type: plan,
      status,
      updated_at: new Date().toISOString(),
    }
    if (__DEV__) {
      console.log('[updateSubscription] Update data:', updateData)
    }
    
    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    // If update succeeded, return result
    if (!updateError) {
      if (__DEV__) {
        console.log('[updateSubscription] Subscription updated successfully')
      }
      return { data: updateResult, error: null }
    }

    // If error is "no rows found", create new subscription
    if (updateError.code === 'PGRST116') {
      if (__DEV__) {
        console.log('[updateSubscription] No existing subscription found, creating new one')
      }
      
      const questionsLimit = plan === 'free' ? 3 : -1;
      const insertData = {
        user_id: userId,
        plan_type: plan,
        status,
        questions_used: 0,
        questions_limit: questionsLimit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (__DEV__) {
        console.log('[updateSubscription] Insert data:', insertData)
        console.log('[updateSubscription] Plan check:', { plan, questionsLimit, isPlanFree: plan === 'free' })
      }
      
      const { data: insertResult, error: insertError } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single()

      if (insertError) throw insertError

      if (__DEV__) {
        console.log('[updateSubscription] New subscription created successfully')
      }
      return { data: insertResult, error: null }
    }

    // If different error, throw it
    throw updateError

  } catch (error) {
    console.error('[updateSubscription] Error:', error)
    console.error('[updateSubscription] Error message:', (error as any)?.message)
    console.error('[updateSubscription] Error details:', (error as any)?.details)
    console.error('[updateSubscription] Error code:', (error as any)?.code)
    return { data: null, error: error as Error }
  }
}

/**
 * Increment question count for subscription usage tracking
 * @param userId - User UUID
 * @returns Updated subscription
 */
export async function incrementQuestionCount(userId: string): Promise<ServiceResponse<Subscription>> {
  try {
    console.log('[incrementQuestionCount] Starting increment for user:', userId)

    // Get subscription (will auto-create if doesn't exist)
    const { data: subscription, error: fetchError } = await getUserSubscription(userId)

    if (fetchError) {
      console.error('[incrementQuestionCount] Error fetching subscription:', fetchError)
      throw fetchError
    }

    if (!subscription) {
      console.error('[incrementQuestionCount] No subscription returned after fetch/create')
      throw new Error('Subscription not found')
    }

    console.log('[incrementQuestionCount] Current subscription:', {
      plan_type: subscription.plan_type,
      status: subscription.status,
      questions_used: subscription.questions_used,
      questions_limit: subscription.questions_limit
    })

    // Check if user has reached limit
    if (subscription.questions_limit && subscription.questions_used >= subscription.questions_limit) {
      const error = new Error(`Question limit reached: ${subscription.questions_used}/${subscription.questions_limit}`)
      console.error('[incrementQuestionCount]', error.message)
      throw error
    }

    // SQL: UPDATE subscriptions SET questions_used = questions_used + 1 WHERE user_id = $1 RETURNING *
    console.log('[incrementQuestionCount] Updating questions_used from', subscription.questions_used, 'to', subscription.questions_used + 1)
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        questions_used: subscription.questions_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[incrementQuestionCount] Database update error:', error)
      throw error
    }

    if (!data) {
      const noDataError = new Error('No data returned from subscription update')
      console.error('[incrementQuestionCount]', noDataError.message)
      throw noDataError
    }

    console.log('[incrementQuestionCount] SUCCESS - Count incremented to:', data.questions_used, 'for user:', userId)
    return { data, error: null }
  } catch (error) {
    console.error('[incrementQuestionCount] FAILED for user:', userId, 'Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Reset monthly question count (called at start of billing cycle)
 * @param userId - User UUID
 * @returns Updated subscription
 */
export async function resetMonthlyQuestions(userId: string): Promise<ServiceResponse<Subscription>> {
  try {
    console.log('[resetMonthlyQuestions] Resetting count for user:', userId)

    // SQL: UPDATE subscriptions SET questions_used = 0 WHERE user_id = $1 RETURNING *
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        questions_used: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    console.log('[resetMonthlyQuestions] Count reset')
    return { data, error: null }
  } catch (error) {
    console.error('[resetMonthlyQuestions] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

/**
 * Create a notification for a user
 * @param userId - User UUID
 * @param type - Notification type
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Additional data (JSON)
 * @returns Created notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: any = null
): Promise<ServiceResponse<Notification>> {
  try {
    console.log('[createNotification] Creating notification:', { userId, type, title })

    // SQL: INSERT INTO notifications (...) VALUES (...) RETURNING *
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data,
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    console.log('[createNotification] Notification created:', notification.id)
    return { data: notification, error: null }
  } catch (error) {
    console.error('[createNotification] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get unread notification count for a user
 * @param userId - User UUID
 * @returns Unread count
 */
export async function getUnreadNotifications(userId: string): Promise<ServiceResponse<number>> {
  try {
    console.log('[getUnreadNotifications] Fetching unread count for user:', userId)

    // SQL: SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error

    console.log('[getUnreadNotifications] Unread count:', count)
    return { data: count || 0, error: null }
  } catch (error) {
    console.error('[getUnreadNotifications] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Mark a notification as read
 * @param notificationId - Notification UUID
 * @returns Updated notification
 */
export async function markNotificationAsRead(notificationId: string): Promise<ServiceResponse<Notification>> {
  try {
    console.log('[markNotificationAsRead] Marking notification as read:', notificationId)

    // SQL: UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error

    console.log('[markNotificationAsRead] Notification marked as read')
    return { data, error: null }
  } catch (error) {
    console.error('[markNotificationAsRead] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all notifications for a user
 * @param userId - User UUID
 * @param limit - Maximum number of notifications
 * @returns Array of notifications
 */
export async function getNotifications(userId: string, limit: number = 50): Promise<ServiceResponse<Notification[]>> {
  try {
    console.log('[getNotifications] Fetching notifications for user:', userId)

    // SQL: SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    console.log('[getNotifications] Found', data?.length, 'notifications')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getNotifications] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// FOLLOWER OPERATIONS
// ============================================================================

/**
 * Follow a mentor
 * @param followerId - Follower user UUID
 * @param mentorId - Mentor user UUID
 * @returns Created follow relationship
 */
export async function followMentor(followerId: string, mentorId: string): Promise<ServiceResponse<any>> {
  try {
    console.log('[followMentor] User', followerId, 'following mentor', mentorId)

    // SQL: INSERT INTO followers (...) VALUES (...) RETURNING *
    const { data, error } = await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: mentorId,
      })
      .select()
      .single()

    if (error) throw error

    // Create notification for mentor
    await createNotification(
      mentorId,
      'new_follower',
      'New Follower',
      'Someone started following you',
      { follower_id: followerId }
    )

    console.log('[followMentor] Follow relationship created')
    return { data, error: null }
  } catch (error) {
    console.error('[followMentor] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Unfollow a mentor
 * @param followerId - Follower user UUID
 * @param mentorId - Mentor user UUID
 * @returns Success status
 */
export async function unfollowMentor(followerId: string, mentorId: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[unfollowMentor] User', followerId, 'unfollowing mentor', mentorId)

    // SQL: DELETE FROM followers WHERE follower_id = $1 AND following_id = $2
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', mentorId)

    if (error) throw error

    console.log('[unfollowMentor] Follow relationship removed')
    return { data: true, error: null }
  } catch (error) {
    console.error('[unfollowMentor] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get follower count for a mentor
 * @param mentorId - Mentor user UUID
 * @returns Follower count
 */
export async function getFollowers(mentorId: string): Promise<ServiceResponse<number>> {
  try {
    console.log('[getFollowers] Getting follower count for mentor:', mentorId)

    // SQL: SELECT COUNT(*) FROM followers WHERE following_id = $1
    const { count, error } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', mentorId)

    if (error) throw error

    console.log('[getFollowers] Follower count:', count)
    return { data: count || 0, error: null }
  } catch (error) {
    console.error('[getFollowers] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Check if a user is following a mentor
 * @param followerId - Follower user UUID
 * @param mentorId - Mentor user UUID
 * @returns True if following, false otherwise
 */
export async function isFollowing(followerId: string, mentorId: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[isFollowing] Checking if', followerId, 'follows', mentorId)

    // SQL: SELECT * FROM followers WHERE follower_id = $1 AND following_id = $2
    const { data, error } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', mentorId)
      .maybeSingle()

    if (error) throw error

    console.log('[isFollowing] Result:', !!data)
    return { data: !!data, error: null }
  } catch (error) {
    console.error('[isFollowing] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// MENTOR STATS OPERATIONS
// ============================================================================


/**
 * Sync all mentor stats (run periodically or after major operations)
 * @returns Success status
 */
export async function syncAllMentorStats(): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[syncAllMentorStats] Syncing stats for all mentors')

    // Get all mentor profiles
    const { data: mentors, error: mentorsError } = await supabase
      .from('mentor_profiles')
      .select('user_id')

    if (mentorsError) throw mentorsError

    // Update each mentor's helpful votes individually
    for (const mentor of mentors) {
      await updateMentorHelpfulVotes(mentor.user_id)
    }

    console.log(`[syncAllMentorStats] Synced stats for ${mentors.length} mentors successfully`)
    return { data: true, error: null }
  } catch (error) {
    console.error('[syncAllMentorStats] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

/**
 * Get all categories
 * @returns Array of categories
 */
export async function getCategories(vertical: string = CURRENT_VERTICAL_KEY): Promise<ServiceResponse<Category[]>> {
  try {
    console.log(`[getCategories] Fetching categories for vertical: ${vertical}`)

    // SQL: SELECT * FROM categories WHERE vertical = $1 ORDER BY name ASC
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('vertical', vertical)
      .order('name', { ascending: true })

    if (error) throw error

    console.log('[getCategories] Found', data?.length, 'categories')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getCategories] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to new messages in a chat session
 * @param sessionId - Session UUID
 * @param callback - Function to call when new message arrives
 * @returns Supabase channel for cleanup
 */
export function subscribeToMessages(
  sessionId: string,
  callback: (message: Message) => void
): RealtimeChannel {
  console.log('[subscribeToMessages] Setting up subscription for session:', sessionId)

  const channel = supabase
    .channel(`messages:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `advice_session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('[subscribeToMessages] New message received:', payload.new)
        callback(payload.new as Message)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to notifications for a user
 * @param userId - User UUID
 * @param callback - Function to call when new notification arrives
 * @returns Supabase channel for cleanup
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): RealtimeChannel {
  console.log('[subscribeToNotifications] Setting up subscription for user:', userId)

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[subscribeToNotifications] New notification received:', payload.new)
        callback(payload.new as Notification)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to session updates (status changes)
 * @param sessionId - Session UUID
 * @param callback - Function to call when session updates
 * @returns Supabase channel for cleanup
 */
export function subscribeToSession(
  sessionId: string,
  callback: (session: AdviceSession) => void
): RealtimeChannel {
  console.log('[subscribeToSession] Setting up subscription for session:', sessionId)

  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'advice_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('[subscribeToSession] Session updated:', payload.new)
        callback(payload.new as AdviceSession)
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from a real-time channel
 * @param channel - Supabase channel to unsubscribe from
 */
export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  console.log('[unsubscribeChannel] Unsubscribing from channel')
  await supabase.removeChannel(channel)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create user profile after signup (bypasses RLS using RPC)
 * @param userId - User UUID from auth
 * @param email - User email
 * @param fullName - User's full name
 * @param university - University name
 * @param graduationYear - Graduation year
 * @returns Created user profile
 */
export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string,
  university: string,
  graduationYear: number
): Promise<ServiceResponse<User>> {
  try {
    console.log('[createUserProfile] Creating profile for user:', userId)

    // Use RPC function to create user profile (bypasses RLS)
    const { data, error } = await supabase.rpc('create_user_profile', {
      p_user_id: userId,
      p_email: email,
      p_full_name: fullName,
      p_university: university,
      p_graduation_year: graduationYear,
      p_role: 'student'
    })

    if (error) {
      console.error('[createUserProfile] RPC error:', error)
      throw error
    }

    console.log('[createUserProfile] Profile created via RPC:', data)
    // Data is now JSONB, cast it to User type
    return { data: data as User, error: null }
  } catch (error) {
    console.error('[createUserProfile] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get the current authenticated user
 * @returns Current user or null
 */
export async function getCurrentUser(): Promise<ServiceResponse<User | null>> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!authUser) return { data: null, error: null }

    const { data: user, error } = await getUserProfile(authUser.id)

    if (error) throw error

    return { data: user, error: null }
  } catch (error) {
    console.error('[getCurrentUser] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Sign out the current user
 * @returns Success status
 */
export async function signOut(): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[signOut] Signing out user')
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    console.log('[signOut] User signed out successfully')
    return { data: true, error: null }
  } catch (error) {
    console.error('[signOut] Error:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// MENTOR VIDEO FUNCTIONS
// ============================================================================

export interface MentorVideo {
  id: string
  mentor_id: string
  video_url: string
  thumbnail_url: string | null
  title: string
  description: string
  is_featured: boolean
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  mentor_profile?: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    university: string | null
    major: string | null
    graduation_year: number | null
  }
}

/**
 * Get featured mentor videos for the showcase
 * @param limit - Number of videos to fetch (default: 10)
 * @returns Featured mentor videos with profile information
 */
export async function getFeaturedMentorVideos(limit: number = 10): Promise<ServiceResponse<MentorVideo[]>> {
  try {
    console.log('[getFeaturedMentorVideos] Fetching featured videos, limit:', limit)

    const { data, error } = await supabase
      .from('mentor_videos')
      .select(`
        *,
        mentor_profile:users!mentor_videos_mentor_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          university,
          graduation_year
        )
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getFeaturedMentorVideos] Database error:', error)
      // Return empty array if table doesn't exist yet
      if (error.message.includes('relation "mentor_videos" does not exist')) {
        console.log('[getFeaturedMentorVideos] Table not created yet, returning empty array')
        return { data: [], error: null }
      }
      throw error
    }

    console.log('[getFeaturedMentorVideos] Found', data?.length || 0, 'featured videos')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getFeaturedMentorVideos] Error:', error)
    return { data: [], error: error as Error }
  }
}

/**
 * Get all mentor videos for a specific mentor
 * @param mentorId - Mentor user ID
 * @returns All videos for the mentor
 */
export async function getMentorVideos(mentorId: string): Promise<ServiceResponse<MentorVideo[]>> {
  try {
    console.log('[getMentorVideos] Fetching videos for mentor:', mentorId)

    const { data, error } = await supabase
      .from('mentor_videos')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getMentorVideos] Database error:', error)
      // Return empty array if table doesn't exist yet
      if (error.message.includes('relation "mentor_videos" does not exist')) {
        console.log('[getMentorVideos] Table not created yet, returning empty array')
        return { data: [], error: null }
      }
      throw error
    }

    console.log('[getMentorVideos] Found', data?.length || 0, 'videos for mentor')
    return { data: data || [], error: null }
  } catch (error) {
    console.error('[getMentorVideos] Error:', error)
    return { data: [], error: error as Error }
  }
}

/**
 * Increment view count for a mentor video
 * @param videoId - Video UUID
 * @returns Updated video
 */
export async function incrementVideoViewCount(videoId: string): Promise<ServiceResponse<MentorVideo>> {
  try {
    console.log('[incrementVideoViewCount] Incrementing view count for video:', videoId)

    // TODO: Implement once mentor_videos table is created in database
    // First get current view count
    // const { data: currentVideo, error: fetchError } = await supabase
    //   .from('mentor_videos')
    //   .select('view_count')
    //   .eq('id', videoId)
    //   .single()

    // if (fetchError) throw fetchError

    // const newViewCount = (currentVideo?.view_count || 0) + 1

    // Update the view count
    // const { data, error } = await supabase
    //   .from('mentor_videos')
    //   .update({ 
    //     view_count: newViewCount,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', videoId)
    //   .select()
    //   .single()

    // if (error) throw error

    console.log('[incrementVideoViewCount] Skipping until table is created')
    return { data: null, error: null }
  } catch (error) {
    console.error('[incrementVideoViewCount] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create a mentor video record (simplified version)
 * @param mentorId - Mentor user ID
 * @param videoUrl - Video URL (already uploaded)
 * @param title - Video title
 * @param description - Video description
 * @returns Created video record
 */
export async function createMentorVideo(
  mentorId: string,
  videoUrl: string,
  title: string,
  description: string
): Promise<ServiceResponse<MentorVideo>> {
  try {
    console.log('[createMentorVideo] Creating video record for mentor:', mentorId)

    const { data, error } = await supabase
      .from('mentor_videos')
      .insert({
        mentor_id: mentorId,
        video_url: videoUrl,
        title,
        description,
        is_featured: true, // Auto-feature for now
        view_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[createMentorVideo] Database error:', error)
      if (error.message.includes('relation "mentor_videos" does not exist')) {
        console.log('[createMentorVideo] Table not created yet')
        return { data: null, error: new Error('Video posting is not available yet. Please try again later.') }
      }
      throw error
    }

    console.log('[createMentorVideo] Video created successfully:', data?.id)
    return { data, error: null }
  } catch (error) {
    console.error('[createMentorVideo] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Upload mentor video
 * @param mentorId - Mentor user ID
 * @param videoFile - Video file to upload
 * @param title - Video title
 * @param description - Video description
 * @returns Created video record
 */
export async function uploadMentorVideo(
  mentorId: string,
  videoFile: any, // File, Blob, or URI string
  title: string,
  description: string
): Promise<ServiceResponse<MentorVideo>> {
  try {
    console.log('[uploadMentorVideo] Starting video upload for mentor:', mentorId)

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = 'mp4' // Default to mp4
    const fileName = `${mentorId}/${timestamp}.${fileExt}`

    let videoData: ArrayBuffer | Blob | File

    // Handle different input types
    if (typeof videoFile === 'string') {
      // If it's a URI (from camera/gallery), fetch it as ArrayBuffer
      const response = await fetch(videoFile)
      videoData = await response.arrayBuffer()
    } else {
      // Already a File or Blob
      videoData = videoFile
    }

    // Upload video file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mentor-videos')
      .upload(fileName, videoData, {
        contentType: 'video/mp4',
        upsert: false
      })

    if (uploadError) {
      console.error('[uploadMentorVideo] Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('mentor-videos')
      .getPublicUrl(fileName)

    console.log('[uploadMentorVideo] Video uploaded to:', publicUrl)

    // Create video record in database
    const { data, error } = await supabase
      .from('mentor_videos')
      .insert({
        mentor_id: mentorId,
        video_url: publicUrl,
        title,
        description,
        is_featured: true, // Auto-feature for now
        view_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[uploadMentorVideo] Database error:', error)
      throw error
    }

    console.log('[uploadMentorVideo] Video record created successfully:', data?.id)
    return { data, error: null }
  } catch (error) {
    console.error('[uploadMentorVideo] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update or create mentor profile
 * @param userId - User UUID
 * @param updates - Mentor profile fields to update
 * @returns Updated mentor profile
 */
export async function updateMentorProfile(
  userId: string,
  updates: {
    availability_status?: 'available' | 'busy' | 'offline';
    verification_status?: 'pending' | 'verified' | 'rejected';
    is_verified?: boolean;
    bio?: string;
    session_formats_offered?: string[];
    languages_spoken?: string;
    weekly_hour_commitment?: number;
    social_media_links?: string | null;
    experience_description?: string | null;
    college_girl_perspective?: boolean;
    response_time_commitment_hours?: number;
    profile_photo_url?: string | null;
    intro_video_url?: string | null;
    major?: string | null;
    // Legacy fields for backwards compatibility
    specialties?: string[];
    session_formats?: string[];
    languages?: string[];
    response_time?: string;
    weekly_hours?: string;
    topics?: string[];
    motivation?: string;
    social_links?: Record<string, string> | null;
  }
): Promise<ServiceResponse<any>> {
  try {
    console.log('[updateMentorProfile] Updating mentor profile for user:', userId, updates)

    const { data, error } = await supabase
      .from('mentor_profiles')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    console.log('[updateMentorProfile] Mentor profile updated successfully')
    return { data, error: null }
  } catch (error) {
    console.error('[updateMentorProfile] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete a mentor video (removes from storage and database)
 * @param videoId - Video UUID
 * @returns Success status
 */
export async function deleteMentorVideo(videoId: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[deleteMentorVideo] Deleting video:', videoId)

    // First get the video record to get the storage path
    const { data: video, error: fetchError } = await supabase
      .from('mentor_videos')
      .select('video_url, thumbnail_url')
      .eq('id', videoId)
      .single()

    if (fetchError) {
      console.error('[deleteMentorVideo] Error fetching video:', fetchError)
      throw fetchError
    }

    // Extract the file path from the storage URL
    const baseUrl = `${supabase.storage.from('mentor-videos').getPublicUrl('').data.publicUrl}/`
    const videoPath = video.video_url?.replace(baseUrl, '')
    const thumbnailPath = video.thumbnail_url?.replace(baseUrl, '')

    // Delete from storage
    const filesToDelete = []
    if (videoPath) filesToDelete.push(videoPath)
    if (thumbnailPath) filesToDelete.push(thumbnailPath)

    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('mentor-videos')
        .remove(filesToDelete)

      if (storageError) {
        console.warn('[deleteMentorVideo] Storage deletion warning:', storageError)
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('mentor_videos')
      .delete()
      .eq('id', videoId)

    if (dbError) {
      console.error('[deleteMentorVideo] Database deletion error:', dbError)
      throw dbError
    }

    console.log('[deleteMentorVideo] Video deleted successfully')
    return { data: true, error: null }
  } catch (error) {
    console.error('[deleteMentorVideo] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all mentors for the mentor discovery tab
 * @returns Array of all available mentors
 */
export async function getAllMentors(page: number = 0, limit: number = 20, excludeUserId?: string): Promise<ServiceResponse<{mentors: any[], hasMore: boolean, totalCount: number}>> {
  try {
    console.log(`[getAllMentors] Fetching mentors page ${page}, limit ${limit}`)

    // First get total count for pagination info
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .not('mentor_profile', 'is', null)

    const totalCount = count || 0
    const hasMore = (page + 1) * limit < totalCount

    // Build query
    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        university,
        graduation_year,
        bio,
        mentor_profile:mentor_profiles!mentor_profiles_user_id_fkey(
          id,
          total_questions_answered,
          average_rating,
          total_helpful_votes,
          is_verified,
          avg_response_time_minutes,
          availability_status,
          updated_at
        )
      `)
      .not('mentor_profile', 'is', null) // Only users with mentor profiles

    // Exclude specific user if provided (prevent self-questions)
    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    // Get paginated users with mentor profiles
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) throw error

    // Transform the data to flatten mentor profiles
    const transformedData = data?.map(user => ({
      ...user,
      user_id: user.id, // Use id as user_id since user_id column doesn't exist
      mentor_profile: Array.isArray(user.mentor_profile) ? user.mentor_profile[0] : user.mentor_profile,
      expertise: [] // No expertise table available yet
    })) || []

    console.log(`[getAllMentors] Found ${transformedData.length} mentors on page ${page}, hasMore: ${hasMore}`)
    return { 
      data: {
        mentors: transformedData,
        hasMore,
        totalCount
      }, 
      error: null 
    }
  } catch (error) {
    console.error('[getAllMentors] Error:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create mentor expertise entries for onboarding
 * @param userId - User UUID  
 * @param topics - Array of topic IDs the mentor is comfortable with
 * @returns Success status
 */
export async function createMentorExpertise(
  userId: string,
  topics: string[]
): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[createMentorExpertise] Creating expertise for mentor:', userId, 'topics:', topics)
    
    // For now, store topics in the mentor_profile as we don't have a separate expertise table
    // We could also store in user profile as mentor_topics which is already implemented
    
    const { error } = await supabase
      .from('mentor_profiles')
      .upsert({
        user_id: userId,
        specialties: topics, // Store topics as specialties
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.warn('[createMentorExpertise] Mentor profile table failed, trying user profile fallback')
      
      // Fallback: Just log that expertise couldn't be stored (non-critical)
      console.warn('[createMentorExpertise] Could not store in mentor_profiles table, but this is non-critical')
      console.log('[createMentorExpertise] ✅ Expertise already stored in user profile during completion')
    } else {
      console.log('[createMentorExpertise] ✅ Expertise stored in mentor profile')
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('[createMentorExpertise] Error:', error)
    return { data: false, error: error as Error }
  }
}

/**
 * Clean up ALL student data when user chooses to become mentor-only
 * This implements the "clean slate" approach - completely removes student history
 * @param userId - User UUID
 * @returns Success status
 */
export async function cleanupStudentData(userId: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[cleanupStudentData] 🧹 CLEANING ALL STUDENT DATA for user:', userId)
    
    // Delete student questions
    const { error: questionsError } = await supabase
      .from('questions')
      .delete()
      .eq('student_id', userId)
    
    if (questionsError) {
      console.warn('[cleanupStudentData] Could not delete questions:', questionsError)
    } else {
      console.log('[cleanupStudentData] ✅ Deleted student questions')
    }

    // Delete student advice sessions 
    const { error: sessionsError } = await supabase
      .from('advice_sessions')
      .delete()
      .eq('student_id', userId)
    
    if (sessionsError) {
      console.warn('[cleanupStudentData] Could not delete advice sessions:', sessionsError)
    } else {
      console.log('[cleanupStudentData] ✅ Deleted student advice sessions')
    }

    // Delete favorite wizzmos
    const { error: favoritesError } = await supabase
      .from('favorite_wizzmos')
      .delete()
      .eq('student_id', userId)
    
    if (favoritesError) {
      console.warn('[cleanupStudentData] Could not delete favorites:', favoritesError)
    } else {
      console.log('[cleanupStudentData] ✅ Deleted student favorites')
    }

    // Delete feed votes by student
    const { error: votesError } = await supabase
      .from('feed_votes')
      .delete()
      .eq('user_id', userId)
    
    if (votesError) {
      console.warn('[cleanupStudentData] Could not delete feed votes:', votesError)
    } else {
      console.log('[cleanupStudentData] ✅ Deleted student feed votes')
    }

    // Delete ratings given by student
    const { error: ratingsError } = await supabase
      .from('ratings')
      .delete()
      .eq('student_id', userId)
    
    if (ratingsError) {
      console.warn('[cleanupStudentData] Could not delete ratings:', ratingsError)
    } else {
      console.log('[cleanupStudentData] ✅ Deleted student ratings')
    }

    // CRITICAL: Clear student-specific profile fields from users table
    const { error: profileError } = await supabase
      .from('users')
      .update({
        university: null,
        education_level: null,
        graduation_year: null,
        interests: [],
        bio: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (profileError) {
      console.warn('[cleanupStudentData] Could not clear student profile fields:', profileError)
    } else {
      console.log('[cleanupStudentData] ✅ Cleared student profile fields from users table')
    }

    console.log('[cleanupStudentData] ✅ STUDENT DATA CLEANUP COMPLETED')
    return { data: true, error: null }
  } catch (error) {
    console.error('[cleanupStudentData] Error during cleanup:', error)
    return { data: false, error: error as Error }
  }
}

/**
 * Clean up ALL mentor data when user chooses to become student-only
 * This removes mentor application and all mentor-related data
 * @param userId - User UUID
 * @param userEmail - User email (for application cleanup)
 * @returns Success status
 */
export async function cleanupMentorData(userId: string, userEmail: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[cleanupMentorData] 🧹 CLEANING ALL MENTOR DATA for user:', userId, userEmail)
    
    // Delete mentor application (the original application)
    const { error: applicationError } = await supabase
      .from('mentor_applications')
      .delete()
      .eq('email', userEmail.toLowerCase())
    
    if (applicationError) {
      console.warn('[cleanupMentorData] Could not delete mentor application:', applicationError)
    } else {
      console.log('[cleanupMentorData] ✅ Deleted mentor application')
    }

    // Delete mentor profile
    const { error: profileError } = await supabase
      .from('mentor_profiles')
      .delete()
      .eq('user_id', userId)
    
    if (profileError) {
      console.warn('[cleanupMentorData] Could not delete mentor profile:', profileError)
    } else {
      console.log('[cleanupMentorData] ✅ Deleted mentor profile')
    }

    // Delete mentor expertise (need to get mentor_profile_id first)
    const { data: mentorProfile } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (mentorProfile) {
      const { error: expertiseError } = await supabase
        .from('mentor_expertise')
        .delete()
        .eq('mentor_profile_id', mentorProfile.id)
      
      if (expertiseError) {
        console.warn('[cleanupMentorData] Could not delete mentor expertise:', expertiseError)
      } else {
        console.log('[cleanupMentorData] ✅ Deleted mentor expertise')
      }
    }

    // Delete mentor advice sessions 
    const { error: mentorSessionsError } = await supabase
      .from('advice_sessions')
      .delete()
      .eq('mentor_id', userId)
    
    if (mentorSessionsError) {
      console.warn('[cleanupMentorData] Could not delete mentor sessions:', mentorSessionsError)
    } else {
      console.log('[cleanupMentorData] ✅ Deleted mentor advice sessions')
    }

    // Delete mentor videos
    const { error: videosError } = await supabase
      .from('mentor_videos')
      .delete()
      .eq('mentor_id', userId)
    
    if (videosError) {
      console.warn('[cleanupMentorData] Could not delete mentor videos:', videosError)
    } else {
      console.log('[cleanupMentorData] ✅ Deleted mentor videos')
    }

    // Delete mentor passes
    const { error: passesError } = await supabase
      .from('mentor_passes')
      .delete()
      .eq('mentor_id', userId)
    
    if (passesError) {
      console.warn('[cleanupMentorData] Could not delete mentor passes:', passesError)
    } else {
      console.log('[cleanupMentorData] ✅ Deleted mentor passes')
    }

    // Delete feed comments by mentor
    const { error: commentsError } = await supabase
      .from('feed_comments')
      .delete()
      .eq('user_id', userId)
    
    if (commentsError) {
      console.warn('[cleanupMentorData] Could not delete mentor comments:', commentsError)
    } else {
      console.log('[cleanupMentorData] ✅ Deleted mentor comments')
    }

    // Clear any mentor-specific profile data if needed
    console.log('[cleanupMentorData] Mentor application and all related data deleted')

    console.log('[cleanupMentorData] ✅ MENTOR DATA CLEANUP COMPLETED')
    return { data: true, error: null }
  } catch (error) {
    console.error('[cleanupMentorData] Error during cleanup:', error)
    return { data: false, error: error as Error }
  }
}

/**
 * Get mentor application by email (for pre-populating onboarding)
 * @param email - User email
 * @returns Application data if found
 */
export async function getMentorApplicationByEmail(email: string): Promise<ServiceResponse<any>> {
  try {
    console.log('[getMentorApplicationByEmail] Fetching application for email:', email)
    
    // First try to get existing user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.warn('[getMentorApplicationByEmail] User lookup failed:', userError)
      return { data: null, error: null } // Return null, not error - this is normal for new users
    }

    if (!userData) {
      console.log('[getMentorApplicationByEmail] No existing user found')
      return { data: null, error: null }
    }

    // Get mentor profile if user is a mentor to get major field
    let major = '';
    if (userData.role === 'mentor' || userData.role === 'both') {
      const { data: mentorProfile } = await supabase
        .from('mentor_profiles')
        .select('major')
        .eq('user_id', userData.id)
        .single();
      
      major = mentorProfile?.major || '';
    }

    // Transform user data into application format for pre-population
    const applicationData = {
      full_name: userData.full_name,
      university: userData.university,
      graduation_year: userData.graduation_year,
      major: major,
      motivation: userData.bio, // Use bio field since mentor_motivation doesn't exist
      topics_comfortable_with: [], // Will be empty for now
      session_formats: [], // Will be empty for now 
      hours_per_week: '', // Will be empty for now
      languages: 'English', // Default
      email: userData.email,
      id: userData.id
    }

    console.log('[getMentorApplicationByEmail] ✅ Application data loaded for pre-population')
    return { data: applicationData, error: null }
  } catch (error) {
    console.error('[getMentorApplicationByEmail] Error:', error)
    return { data: null, error: null } // Return null instead of error for graceful handling
  }
}

/**
 * Update mentor's last activity timestamp for "online now" tracking
 * @param userId - User UUID of the mentor
 * @returns Success status
 */
export async function updateMentorActivity(userId: string): Promise<ServiceResponse<boolean>> {
  try {
    console.log('[updateMentorActivity] Updating activity for mentor:', userId);
    
    const { error } = await supabase
      .from('mentor_profiles')
      .update({ 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[updateMentorActivity] Error:', error);
      throw error;
    }

    console.log('[updateMentorActivity] ✅ Activity updated');
    return { data: true, error: null };
    
  } catch (error) {
    console.error('[updateMentorActivity] Error:', error);
    return { data: false, error: error as Error };
  }
}

/**
 * Get mentors who are currently online (active within last 15 minutes)
 * @param page - Page number for pagination
 * @param limit - Number of mentors per page
 * @returns Online mentors
 */
export async function getOnlineMentors(
  page: number = 0, 
  limit: number = 20
): Promise<ServiceResponse<{ mentors: any[]; hasMore: boolean }>> {
  try {
    console.log('[getOnlineMentors] Loading online mentors, page:', page);
    
    const offset = page * limit;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    // Query for mentors who were active recently
    const { data: mentorsData, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        username, 
        avatar_url,
        university,
        graduation_year,
        role,
        onboarding_completed,
        created_at,
        mentor_profiles (
          id,
          availability_status,
          is_verified,
          verification_status,
          major,
          bio,
          total_questions_answered,
          average_rating,
          total_helpful_votes,
          updated_at
        )
      `)
      .in('role', ['mentor', 'both']) 
      .eq('onboarding_completed', true)
      .not('mentor_profiles', 'is', null)
      .eq('mentor_profiles.availability_status', 'available') // Only available mentors
      .gte('mentor_profiles.updated_at', fifteenMinutesAgo) // Active within 15 minutes
      .in('mentor_profiles.verification_status', ['verified', 'pending'])
      .order('mentor_profiles.updated_at', { ascending: false }) // Most recently active first
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[getOnlineMentors] Database error:', error);
      throw error;
    }

    // Filter and transform the data
    const onlineMentors = (mentorsData || [])
      .filter(mentor => {
        const profile = mentor.mentor_profiles?.[0];
        
        // Check if this is a test account
        const isTestAccount = (
          mentor.email?.includes('@example.com') ||
          mentor.email?.includes('@test.com') ||
          mentor.full_name?.toLowerCase().includes('test') ||
          mentor.university?.toLowerCase().includes('test university') ||
          mentor.username?.toLowerCase().includes('test')
        );
        
        return (
          !isTestAccount && // Exclude test accounts
          mentor.full_name && 
          mentor.university && 
          profile && 
          profile.availability_status === 'available'
        );
      })
      .map(mentor => ({
        ...mentor,
        mentor_profile: mentor.mentor_profiles[0]
      }));

    const hasMore = mentorsData?.length === limit;
    
    console.log('[getOnlineMentors] ✅ Found', onlineMentors.length, 'online mentors');
    
    return { 
      data: { 
        mentors: onlineMentors, 
        hasMore 
      }, 
      error: null 
    };
    
  } catch (error) {
    console.error('[getOnlineMentors] Error:', error);
    return { data: { mentors: [], hasMore: false }, error: error as Error };
  }
}
