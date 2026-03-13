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
