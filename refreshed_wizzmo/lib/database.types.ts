export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      advice_sessions: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          feedback: string | null
          id: string
          mentor_id: string
          question_id: string
          rating: number | null
          resolved_at: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
          was_helpful: boolean | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          mentor_id: string
          question_id: string
          rating?: number | null
          resolved_at?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          mentor_id?: string
          question_id?: string
          rating?: number | null
          resolved_at?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "advice_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advice_sessions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advice_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      favorite_wizzmos: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_wizzmos_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_wizzmos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string
          helpful_votes: number
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          helpful_votes?: number
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          helpful_votes?: number
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_mentor_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_votes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "mentor_expertise_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_expertise_mentor_profile_id_fkey"
            columns: ["mentor_profile_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          availability_status: string | null
          average_rating: number | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          response_time_avg: number | null
          total_helpful_votes: number | null
          total_questions_answered: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          availability_status?: string | null
          average_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          response_time_avg?: number | null
          total_helpful_votes?: number | null
          total_questions_answered?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          availability_status?: string | null
          average_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          response_time_avg?: number | null
          total_helpful_votes?: number | null
          total_questions_answered?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          advice_session_id: string
          audio_duration: number | null
          audio_url: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          reactions: Json | null
          sender_id: string
        }
        Insert: {
          advice_session_id: string
          audio_duration?: number | null
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          reactions?: Json | null
          sender_id: string
        }
        Update: {
          advice_session_id?: string
          audio_duration?: number | null
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          reactions?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_advice_session_id_fkey"
            columns: ["advice_session_id"]
            isOneToOne: false
            referencedRelation: "advice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          id: string
          payload: Json
          read_at: string | null
          sent_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          payload: Json
          read_at?: string | null
          sent_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          id?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          chat_messages: boolean | null
          created_at: string | null
          id: string
          mentor_matches: boolean | null
          new_questions: boolean | null
          question_answered: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string | null
          trending_posts: boolean | null
          updated_at: string | null
          user_id: string
          weekly_reminders: boolean | null
          welcome_notifications: boolean | null
        }
        Insert: {
          chat_messages?: boolean | null
          created_at?: string | null
          id?: string
          mentor_matches?: boolean | null
          new_questions?: boolean | null
          question_answered?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          trending_posts?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_reminders?: boolean | null
          welcome_notifications?: boolean | null
        }
        Update: {
          chat_messages?: boolean | null
          created_at?: string | null
          id?: string
          mentor_matches?: boolean | null
          new_questions?: boolean | null
          question_answered?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          trending_posts?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_reminders?: boolean | null
          welcome_notifications?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
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
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          advice_session_id: string
          created_at: string
          feedback_text: string | null
          id: string
          mentor_id: string
          rating: number
          student_id: string
        }
        Insert: {
          advice_session_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          mentor_id: string
          rating: number
          student_id: string
        }
        Update: {
          advice_session_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          mentor_id?: string
          rating?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_advice_session_id_fkey"
            columns: ["advice_session_id"]
            isOneToOne: false
            referencedRelation: "advice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string | null
          id: string
          payload: Json
          scheduled_for: string
          sent: boolean | null
          sent_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload: Json
          scheduled_for: string
          sent?: boolean | null
          sent_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json
          scheduled_for?: string
          sent?: boolean | null
          sent_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan_type: string
          questions_limit: number | null
          questions_used: number
          status: string
          subscription_ends_at: string | null
          subscription_starts_at: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_type: string
          questions_limit?: number | null
          questions_used?: number
          status: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_type?: string
          questions_limit?: number | null
          questions_used?: number
          status?: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          push_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          push_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          push_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          education_level: string | null
          email: string
          full_name: string | null
          gender: string | null
          graduation_year: number | null
          id: string
          interests: Json | null
          onboarding_completed: boolean | null
          role: string
          role_selection_completed: boolean | null
          university: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          graduation_year?: number | null
          id?: string
          interests?: Json | null
          onboarding_completed?: boolean | null
          role: string
          role_selection_completed?: boolean | null
          university?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          graduation_year?: number | null
          id?: string
          interests?: Json | null
          onboarding_completed?: boolean | null
          role?: string
          role_selection_completed?: boolean | null
          university?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: {
          p_email: string
          p_full_name: string
          p_graduation_year: number
          p_role?: string
          p_university: string
          p_user_id: string
        }
        Returns: Json
      }
      get_pending_notifications: {
        Args: never
        Returns: {
          id: string
          payload: Json
          push_tokens: string[]
          type: string
          user_id: string
        }[]
      }
      update_session_rating: {
        Args: {
          p_feedback: string
          p_rating: number
          p_session_id: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          feedback: string
          id: string
          mentor_id: string
          question_id: string
          rating: number
          resolved_at: string
          status: string
          student_id: string
          updated_at: string
        }[]
      }
      update_session_status:
        | {
            Args: {
              p_resolved_at: string
              p_session_id: string
              p_status: string
              p_user_id: string
            }
            Returns: {
              created_at: string
              feedback: string
              id: string
              mentor_id: string
              question_id: string
              rating: number
              resolved_at: string
              status: string
              student_id: string
              updated_at: string
            }[]
          }
        | {
            Args: {
              p_resolved_at?: string
              p_session_id: string
              p_status: string
              p_user_id: string
            }
            Returns: {
              accepted_at: string
              created_at: string
              id: string
              mentor_id: string
              question_id: string
              rating: number
              resolved_at: string
              status: string
              student_id: string
              updated_at: string
              was_helpful: boolean
            }[]
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const