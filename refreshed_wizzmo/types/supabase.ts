export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      advice_sessions: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          mentor_id: string
          question_id: string
          rating: number | null
          resolved_at: string | null
          status: string | null
          student_id: string
          updated_at: string | null
          was_helpful: boolean | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          mentor_id: string
          question_id: string
          rating?: number | null
          resolved_at?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          mentor_id?: string
          question_id?: string
          rating?: number | null
          resolved_at?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
          was_helpful?: boolean | null
        }
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
      }
      mentor_expertise: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          mentor_profile_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          mentor_profile_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          mentor_profile_id?: string
        }
      }
      mentor_profiles: {
        Row: {
          availability_status: string | null
          average_rating: number | null
          avg_response_time_minutes: number | null
          bio: string | null
          college_girl_perspective: boolean | null
          created_at: string | null
          experience_description: string | null
          id: string
          intro_video_url: string | null
          is_verified: boolean | null
          languages_spoken: string | null
          major: string | null
          profile_photo_url: string | null
          response_time_avg: number | null
          response_time_commitment_hours: number | null
          session_formats_offered: string[] | null
          social_media_links: string | null
          total_helpful_votes: number | null
          total_questions_answered: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          vertical: string | null
          weekly_hour_commitment: number | null
        }
        Insert: {
          availability_status?: string | null
          average_rating?: number | null
          avg_response_time_minutes?: number | null
          bio?: string | null
          college_girl_perspective?: boolean | null
          created_at?: string | null
          experience_description?: string | null
          id?: string
          intro_video_url?: string | null
          is_verified?: boolean | null
          languages_spoken?: string | null
          major?: string | null
          profile_photo_url?: string | null
          response_time_avg?: number | null
          response_time_commitment_hours?: number | null
          session_formats_offered?: string[] | null
          social_media_links?: string | null
          total_helpful_votes?: number | null
          total_questions_answered?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          vertical?: string | null
          weekly_hour_commitment?: number | null
        }
        Update: {
          availability_status?: string | null
          average_rating?: number | null
          avg_response_time_minutes?: number | null
          bio?: string | null
          college_girl_perspective?: boolean | null
          created_at?: string | null
          experience_description?: string | null
          id?: string
          intro_video_url?: string | null
          is_verified?: boolean | null
          languages_spoken?: string | null
          major?: string | null
          profile_photo_url?: string | null
          response_time_avg?: number | null
          response_time_commitment_hours?: number | null
          session_formats_offered?: string[] | null
          social_media_links?: string | null
          total_helpful_votes?: number | null
          total_questions_answered?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          vertical?: string | null
          weekly_hour_commitment?: number | null
        }
      }
      messages: {
        Row: {
          advice_session_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          advice_session_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          advice_session_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
      }
      questions: {
        Row: {
          allow_public_share: boolean | null
          category_id: string
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          status: string | null
          student_id: string
          title: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          allow_public_share?: boolean | null
          category_id: string
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          status?: string | null
          student_id: string
          title: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          allow_public_share?: boolean | null
          category_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          status?: string | null
          student_id?: string
          title?: string
          updated_at?: string | null
          urgency?: string | null
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          graduation_year: number | null
          id: string
          role: string
          university: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          role: string
          university?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          role?: string
          university?: string | null
          updated_at?: string | null
          username?: string | null
        }
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: string
          plan_type: string
          questions_limit: number | null
          questions_used: number
          status: string
          subscription_ends_at: string | null
          subscription_starts_at: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_type: string
          questions_limit?: number | null
          questions_used?: number
          status: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_type?: string
          questions_limit?: number | null
          questions_used?: number
          status?: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
      }
      feed_votes: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          user_id?: string
          vote_type?: string
        }
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string | null
          helpful_votes: number
          id: string
          mentor_id: string
          question_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          helpful_votes?: number
          id?: string
          mentor_id: string
          question_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          helpful_votes?: number
          id?: string
          mentor_id?: string
          question_id?: string
        }
      }
      ratings: {
        Row: {
          advice_session_id: string
          created_at: string | null
          feedback_text: string | null
          id: string
          mentor_id: string
          rating: number
          student_id: string
        }
        Insert: {
          advice_session_id: string
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          mentor_id: string
          rating: number
          student_id: string
        }
        Update: {
          advice_session_id?: string
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          mentor_id?: string
          rating?: number
          student_id?: string
        }
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
      }
      followers: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
      }
    }
  }
}
