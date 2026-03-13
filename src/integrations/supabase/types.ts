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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      likes: {
        Row: {
          created_at: string | null
          id: string
          is_priority: boolean | null
          is_seen: boolean | null
          is_super_like: boolean | null
          liked_id: string
          liked_user_id: string
          liker_id: string
          liker_user_id: string
          priority_boost_expires: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_priority?: boolean | null
          is_seen?: boolean | null
          is_super_like?: boolean | null
          liked_id: string
          liked_user_id: string
          liker_id: string
          liker_user_id: string
          priority_boost_expires?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_priority?: boolean | null
          is_seen?: boolean | null
          is_super_like?: boolean | null
          liked_id?: string
          liked_user_id?: string
          liker_id?: string
          liker_user_id?: string
          priority_boost_expires?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_liked_id_fkey"
            columns: ["liked_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          compatibility_reasons: string[] | null
          compatibility_score: number | null
          created_at: string | null
          expires_at: string | null
          first_message_sent: boolean | null
          first_message_sent_at: string | null
          first_message_sent_by: string | null
          has_nudged: boolean | null
          id: string
          is_expired: boolean | null
          is_match: boolean | null
          is_super_like: boolean | null
          last_chance_sent: boolean | null
          matched_at: string | null
          status: Database["public"]["Enums"]["match_status_type"] | null
          typing_user_id: string | null
          updated_at: string | null
          user1_id: string
          user1_liked: boolean | null
          user1_user_id: string
          user2_id: string
          user2_liked: boolean | null
          user2_user_id: string
        }
        Insert: {
          compatibility_reasons?: string[] | null
          compatibility_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          first_message_sent?: boolean | null
          first_message_sent_at?: string | null
          first_message_sent_by?: string | null
          has_nudged?: boolean | null
          id?: string
          is_expired?: boolean | null
          is_match?: boolean | null
          is_super_like?: boolean | null
          last_chance_sent?: boolean | null
          matched_at?: string | null
          status?: Database["public"]["Enums"]["match_status_type"] | null
          typing_user_id?: string | null
          updated_at?: string | null
          user1_id: string
          user1_liked?: boolean | null
          user1_user_id: string
          user2_id: string
          user2_liked?: boolean | null
          user2_user_id: string
        }
        Update: {
          compatibility_reasons?: string[] | null
          compatibility_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          first_message_sent?: boolean | null
          first_message_sent_at?: string | null
          first_message_sent_by?: string | null
          has_nudged?: boolean | null
          id?: string
          is_expired?: boolean | null
          is_match?: boolean | null
          is_super_like?: boolean | null
          last_chance_sent?: boolean | null
          matched_at?: string | null
          status?: Database["public"]["Enums"]["match_status_type"] | null
          typing_user_id?: string | null
          updated_at?: string | null
          user1_id?: string
          user1_liked?: boolean | null
          user1_user_id?: string
          user2_id?: string
          user2_liked?: boolean | null
          user2_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          idempotency_key: string | null
          is_deleted: boolean | null
          is_flagged: boolean | null
          is_read: boolean | null
          is_translated: boolean | null
          like_note: string | null
          match_id: string
          media_url: string | null
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          receiver_id: string
          receiver_user_id: string
          sender_id: string
          sender_user_id: string
          sequence_number: number | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          is_translated?: boolean | null
          like_note?: string | null
          match_id: string
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          receiver_id: string
          receiver_user_id: string
          sender_id: string
          sender_user_id: string
          sequence_number?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          is_translated?: boolean | null
          like_note?: string | null
          match_id?: string
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          receiver_id?: string
          receiver_user_id?: string
          sender_id?: string
          sender_user_id?: string
          sequence_number?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          from_profile_id: string | null
          id: string
          is_admin: boolean | null
          is_read: boolean | null
          link_to: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          from_profile_id?: string | null
          id?: string
          is_admin?: boolean | null
          is_read?: boolean | null
          link_to?: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          from_profile_id?: string | null
          id?: string
          is_admin?: boolean | null
          is_read?: boolean | null
          link_to?: string | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passes: {
        Row: {
          created_at: string | null
          id: string
          is_rewindable: boolean | null
          passed_id: string
          passer_id: string
          passer_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_rewindable?: boolean | null
          passed_id: string
          passer_id: string
          passer_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_rewindable?: boolean | null
          passed_id?: string
          passer_id?: string
          passer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passes_passed_id_fkey"
            columns: ["passed_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passes_passer_id_fkey"
            columns: ["passer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_paid: number | null
          auto_renew: boolean | null
          boosts_remaining: number | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          external_id: string | null
          id: string
          payment_provider:
            | Database["public"]["Enums"]["payment_provider_type"]
            | null
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          regional_pricing: boolean | null
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status_type"]
          super_likes_remaining: number | null
          updated_at: string | null
          user_profile_id: string
        }
        Insert: {
          amount_paid?: number | null
          auto_renew?: boolean | null
          boosts_remaining?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          payment_provider?:
            | Database["public"]["Enums"]["payment_provider_type"]
            | null
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          regional_pricing?: boolean | null
          start_date?: string | null
          status: Database["public"]["Enums"]["subscription_status_type"]
          super_likes_remaining?: number | null
          updated_at?: string | null
          user_profile_id: string
        }
        Update: {
          amount_paid?: number | null
          auto_renew?: boolean | null
          boosts_remaining?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          payment_provider?:
            | Database["public"]["Enums"]["payment_provider_type"]
            | null
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          regional_pricing?: boolean | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status_type"]
          super_likes_remaining?: number | null
          updated_at?: string | null
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          ai_safety_score: number | null
          badges: string[] | null
          ban_reason: string | null
          bio: string | null
          birth_date: string | null
          blocked_users: string[] | null
          boost_expires_at: string | null
          country_of_origin: string | null
          created_at: string | null
          created_by: string | null
          cultural_values: string[] | null
          current_city: string | null
          current_country: string
          current_state: string | null
          daily_likes_count: number | null
          daily_likes_reset_date: string | null
          device_ids: string[] | null
          device_info: Json | null
          display_name: string
          education: Database["public"]["Enums"]["education_type"] | null
          ethnicity: Database["public"]["Enums"]["ethnicity_type"] | null
          filters: Json | null
          founding_member_code_used: string | null
          founding_member_converted: boolean | null
          founding_member_converted_at: string | null
          founding_member_eligible: boolean | null
          founding_member_granted_at: string | null
          founding_member_source:
            | Database["public"]["Enums"]["founding_source_type"]
            | null
          founding_member_trial_ends_at: string | null
          founding_trial_consumed: boolean | null
          gender: Database["public"]["Enums"]["gender_type"]
          has_matched_before: boolean | null
          height_cm: number | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          is_banned: boolean | null
          is_founding_member: boolean | null
          is_premium: boolean | null
          is_suspended: boolean | null
          is_test_user: boolean | null
          languages: string[] | null
          last_active: string | null
          last_login_date: string | null
          lifestyle: Json | null
          location: Json | null
          login_streak: number | null
          looking_for: string[] | null
          phone_number: string | null
          photos: string[] | null
          preferred_language:
            | Database["public"]["Enums"]["language_pref"]
            | null
          premium_until: string | null
          primary_photo: string | null
          profession: string | null
          profile_boost_active: boolean | null
          prompts: Json | null
          push_token: string | null
          relationship_goal:
            | Database["public"]["Enums"]["relationship_goal_type"]
            | null
          religion: Database["public"]["Enums"]["religion_type"] | null
          stripe_customer_id: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier_type"]
            | null
          suspension_expires_at: string | null
          suspension_reason: string | null
          tribe_ethnicity: string | null
          tutorial_completed: boolean | null
          updated_at: string | null
          user_id: string
          verification_selfie_url: string | null
          verification_status: Json | null
          violation_count: number | null
          warning_count: number | null
        }
        Insert: {
          ai_safety_score?: number | null
          badges?: string[] | null
          ban_reason?: string | null
          bio?: string | null
          birth_date?: string | null
          blocked_users?: string[] | null
          boost_expires_at?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          created_by?: string | null
          cultural_values?: string[] | null
          current_city?: string | null
          current_country?: string
          current_state?: string | null
          daily_likes_count?: number | null
          daily_likes_reset_date?: string | null
          device_ids?: string[] | null
          device_info?: Json | null
          display_name: string
          education?: Database["public"]["Enums"]["education_type"] | null
          ethnicity?: Database["public"]["Enums"]["ethnicity_type"] | null
          filters?: Json | null
          founding_member_code_used?: string | null
          founding_member_converted?: boolean | null
          founding_member_converted_at?: string | null
          founding_member_eligible?: boolean | null
          founding_member_granted_at?: string | null
          founding_member_source?:
            | Database["public"]["Enums"]["founding_source_type"]
            | null
          founding_member_trial_ends_at?: string | null
          founding_trial_consumed?: boolean | null
          gender: Database["public"]["Enums"]["gender_type"]
          has_matched_before?: boolean | null
          height_cm?: number | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_founding_member?: boolean | null
          is_premium?: boolean | null
          is_suspended?: boolean | null
          is_test_user?: boolean | null
          languages?: string[] | null
          last_active?: string | null
          last_login_date?: string | null
          lifestyle?: Json | null
          location?: Json | null
          login_streak?: number | null
          looking_for?: string[] | null
          phone_number?: string | null
          photos?: string[] | null
          preferred_language?:
            | Database["public"]["Enums"]["language_pref"]
            | null
          premium_until?: string | null
          primary_photo?: string | null
          profession?: string | null
          profile_boost_active?: boolean | null
          prompts?: Json | null
          push_token?: string | null
          relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal_type"]
            | null
          religion?: Database["public"]["Enums"]["religion_type"] | null
          stripe_customer_id?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier_type"]
            | null
          suspension_expires_at?: string | null
          suspension_reason?: string | null
          tribe_ethnicity?: string | null
          tutorial_completed?: boolean | null
          updated_at?: string | null
          user_id: string
          verification_selfie_url?: string | null
          verification_status?: Json | null
          violation_count?: number | null
          warning_count?: number | null
        }
        Update: {
          ai_safety_score?: number | null
          badges?: string[] | null
          ban_reason?: string | null
          bio?: string | null
          birth_date?: string | null
          blocked_users?: string[] | null
          boost_expires_at?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          created_by?: string | null
          cultural_values?: string[] | null
          current_city?: string | null
          current_country?: string
          current_state?: string | null
          daily_likes_count?: number | null
          daily_likes_reset_date?: string | null
          device_ids?: string[] | null
          device_info?: Json | null
          display_name?: string
          education?: Database["public"]["Enums"]["education_type"] | null
          ethnicity?: Database["public"]["Enums"]["ethnicity_type"] | null
          filters?: Json | null
          founding_member_code_used?: string | null
          founding_member_converted?: boolean | null
          founding_member_converted_at?: string | null
          founding_member_eligible?: boolean | null
          founding_member_granted_at?: string | null
          founding_member_source?:
            | Database["public"]["Enums"]["founding_source_type"]
            | null
          founding_member_trial_ends_at?: string | null
          founding_trial_consumed?: boolean | null
          gender?: Database["public"]["Enums"]["gender_type"]
          has_matched_before?: boolean | null
          height_cm?: number | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_founding_member?: boolean | null
          is_premium?: boolean | null
          is_suspended?: boolean | null
          is_test_user?: boolean | null
          languages?: string[] | null
          last_active?: string | null
          last_login_date?: string | null
          lifestyle?: Json | null
          location?: Json | null
          login_streak?: number | null
          looking_for?: string[] | null
          phone_number?: string | null
          photos?: string[] | null
          preferred_language?:
            | Database["public"]["Enums"]["language_pref"]
            | null
          premium_until?: string | null
          primary_photo?: string | null
          profession?: string | null
          profile_boost_active?: boolean | null
          prompts?: Json | null
          push_token?: string | null
          relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal_type"]
            | null
          religion?: Database["public"]["Enums"]["religion_type"] | null
          stripe_customer_id?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier_type"]
            | null
          suspension_expires_at?: string | null
          suspension_reason?: string | null
          tribe_ethnicity?: string | null
          tutorial_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
          verification_selfie_url?: string | null
          verification_status?: Json | null
          violation_count?: number | null
          warning_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      education_type:
        | "high_school"
        | "some_college"
        | "bachelors"
        | "masters"
        | "doctorate"
        | "trade_school"
        | "other"
      ethnicity_type: "african" | "african_descent" | "non_african_interested"
      founding_source_type: "global_toggle" | "invite_code" | "manual_admin"
      gender_type: "man" | "woman" | "non_binary" | "other"
      language_pref: "en" | "fr"
      match_status_type: "active" | "unmatched" | "blocked" | "expired"
      message_type: "text" | "voice_note" | "image" | "ice_breaker" | "gif"
      notification_type:
        | "match"
        | "like"
        | "message"
        | "admin_message"
        | "super_like"
      payment_provider_type: "stripe" | "apple" | "google" | "manual"
      relationship_goal_type:
        | "dating"
        | "serious_relationship"
        | "marriage"
        | "friendship_community"
        | "networking"
      religion_type:
        | "christianity"
        | "islam"
        | "traditional_african"
        | "judaism"
        | "buddhism"
        | "hindu"
        | "spiritual"
        | "agnostic"
        | "atheist"
        | "other"
        | "prefer_not_say"
      subscription_plan_type:
        | "free"
        | "premium_monthly"
        | "premium_quarterly"
        | "premium_yearly"
        | "elite_monthly"
        | "elite_quarterly"
        | "vip_monthly"
        | "vip_6months"
      subscription_status_type: "active" | "cancelled" | "expired" | "paused"
      subscription_tier_type: "free" | "premium" | "elite" | "vip"
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
    Enums: {
      education_type: [
        "high_school",
        "some_college",
        "bachelors",
        "masters",
        "doctorate",
        "trade_school",
        "other",
      ],
      ethnicity_type: ["african", "african_descent", "non_african_interested"],
      founding_source_type: ["global_toggle", "invite_code", "manual_admin"],
      gender_type: ["man", "woman", "non_binary", "other"],
      language_pref: ["en", "fr"],
      match_status_type: ["active", "unmatched", "blocked", "expired"],
      message_type: ["text", "voice_note", "image", "ice_breaker", "gif"],
      notification_type: [
        "match",
        "like",
        "message",
        "admin_message",
        "super_like",
      ],
      payment_provider_type: ["stripe", "apple", "google", "manual"],
      relationship_goal_type: [
        "dating",
        "serious_relationship",
        "marriage",
        "friendship_community",
        "networking",
      ],
      religion_type: [
        "christianity",
        "islam",
        "traditional_african",
        "judaism",
        "buddhism",
        "hindu",
        "spiritual",
        "agnostic",
        "atheist",
        "other",
        "prefer_not_say",
      ],
      subscription_plan_type: [
        "free",
        "premium_monthly",
        "premium_quarterly",
        "premium_yearly",
        "elite_monthly",
        "elite_quarterly",
        "vip_monthly",
        "vip_6months",
      ],
      subscription_status_type: ["active", "cancelled", "expired", "paused"],
      subscription_tier_type: ["free", "premium", "elite", "vip"],
    },
  },
} as const
