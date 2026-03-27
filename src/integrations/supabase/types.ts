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
      ab_tests: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          results: Json | null
          start_date: string | null
          status: string | null
          target_metric: string | null
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          results?: Json | null
          start_date?: string | null
          status?: string | null
          target_metric?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          results?: Json | null
          start_date?: string | null
          status?: string | null
          target_metric?: string | null
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          clicks: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number | null
          is_active: boolean | null
          placement: string | null
          start_date: string | null
          target_audience: string | null
          target_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          placement?: string | null
          start_date?: string | null
          target_audience?: string | null
          target_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          placement?: string | null
          start_date?: string | null
          target_audience?: string | null
          target_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          insight_type: string
          is_dismissed: boolean | null
          priority: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          priority?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          priority?: string | null
          title?: string | null
        }
        Relationships: []
      }
      ambassador_campaigns: {
        Row: {
          bonus_multiplier: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          target_signups: number | null
          updated_at: string | null
        }
        Insert: {
          bonus_multiplier?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          target_signups?: number | null
          updated_at?: string | null
        }
        Update: {
          bonus_multiplier?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          target_signups?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ambassador_commission_plans: {
        Row: {
          commission_type: string | null
          commission_value: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          commission_type?: string | null
          commission_value: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_type?: string | null
          commission_value?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ambassador_commissions: {
        Row: {
          ambassador_id: string | null
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          paid_at: string | null
          referral_id: string | null
          status: string | null
        }
        Insert: {
          ambassador_id?: string | null
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
        }
        Update: {
          ambassador_id?: string | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_commissions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "ambassador_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_content_assets: {
        Row: {
          asset_type: string | null
          campaign_id: string | null
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          asset_type?: string | null
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          asset_type?: string | null
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_content_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_payouts: {
        Row: {
          ambassador_id: string | null
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          ambassador_id?: string | null
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          ambassador_id?: string | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_payouts_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_referral_events: {
        Row: {
          ambassador_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          referral_id: string | null
        }
        Insert: {
          ambassador_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          referral_id?: string | null
        }
        Update: {
          ambassador_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          referral_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_referral_events_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_referrals: {
        Row: {
          ambassador_id: string | null
          conversion_date: string | null
          converted: boolean | null
          created_at: string | null
          id: string
          referred_profile_id: string | null
          referred_user_id: string | null
          status: string | null
        }
        Insert: {
          ambassador_id?: string | null
          conversion_date?: string | null
          converted?: boolean | null
          created_at?: string | null
          id?: string
          referred_profile_id?: string | null
          referred_user_id?: string | null
          status?: string | null
        }
        Update: {
          ambassador_id?: string | null
          conversion_date?: string | null
          converted?: boolean | null
          created_at?: string | null
          id?: string
          referred_profile_id?: string | null
          referred_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_referrals_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassadors: {
        Row: {
          approved_at: string | null
          bio: string | null
          created_at: string | null
          id: string
          referral_code: string | null
          social_links: Json | null
          status: string | null
          tier: string | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          approved_at?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string | null
          social_links?: Json | null
          status?: string | null
          tier?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          approved_at?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string | null
          social_links?: Json | null
          status?: string | null
          tier?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      background_checks: {
        Row: {
          created_at: string | null
          id: string
          provider: string | null
          result: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider?: string | null
          result?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          provider?: string | null
          result?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      broadcast_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          recipients_count: number | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          target_audience: string | null
          target_country: string | null
          target_tier: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          target_audience?: string | null
          target_country?: string | null
          target_tier?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          target_audience?: string | null
          target_country?: string | null
          target_tier?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_favorites: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "marketplace_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          rating: number
          updated_at: string | null
          user_id: string
          user_profile_id: string | null
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          updated_at?: string | null
          user_id: string
          user_profile_id?: string | null
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "marketplace_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_games: {
        Row: {
          created_at: string | null
          created_by: string | null
          game_data: Json | null
          game_type: string
          id: string
          match_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          game_data?: Json | null
          game_type: string
          id?: string
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          game_data?: Json | null
          game_type?: string
          id?: string
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      communities: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          user_id: string
          user_profile_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          user_id: string
          user_profile_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          user_id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          community_id: string
          content: string
          created_at: string
          id: string
          media_url: string | null
          message_type: string
          sender_id: string
          sender_user_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string
          id?: string
          media_url?: string | null
          message_type?: string
          sender_id: string
          sender_user_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          media_url?: string | null
          message_type?: string
          sender_id?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_quizzes: {
        Row: {
          compatibility_types: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          questions: Json | null
          title: string
        }
        Insert: {
          compatibility_types?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json | null
          title: string
        }
        Update: {
          compatibility_types?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json | null
          title?: string
        }
        Relationships: []
      }
      content_moderations: {
        Row: {
          ai_result: Json | null
          confidence: number | null
          content_type: string | null
          content_url: string | null
          created_at: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          text_content: string | null
          user_id: string
          user_profile_id: string | null
        }
        Insert: {
          ai_result?: Json | null
          confidence?: number | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          text_content?: string | null
          user_id: string
          user_profile_id?: string | null
        }
        Update: {
          ai_result?: Json | null
          confidence?: number | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          text_content?: string | null
          user_id?: string
          user_profile_id?: string | null
        }
        Relationships: []
      }
      contest_periods: {
        Row: {
          contest_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          period_name: string | null
          start_date: string | null
        }
        Insert: {
          contest_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          period_name?: string | null
          start_date?: string | null
        }
        Update: {
          contest_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          period_name?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_periods_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "success_story_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_matches: {
        Row: {
          created_at: string | null
          date: string | null
          expires_at: string | null
          id: string
          match_reasons: string[] | null
          match_score: number | null
          status: string | null
          suggested_profile_id: string
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          expires_at?: string | null
          id?: string
          match_reasons?: string[] | null
          match_score?: number | null
          status?: string | null
          suggested_profile_id: string
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          expires_at?: string | null
          id?: string
          match_reasons?: string[] | null
          match_score?: number | null
          status?: string | null
          suggested_profile_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      date_feedbacks: {
        Row: {
          created_at: string | null
          created_date: string | null
          feedback_notes: string | null
          id: string
          match_id: string | null
          met_in_person: boolean | null
          partner_profile_id: string | null
          rating: number | null
          safety_concerns: boolean | null
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          created_date?: string | null
          feedback_notes?: string | null
          id?: string
          match_id?: string | null
          met_in_person?: boolean | null
          partner_profile_id?: string | null
          rating?: number | null
          safety_concerns?: boolean | null
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          created_date?: string | null
          feedback_notes?: string | null
          id?: string
          match_id?: string | null
          met_in_person?: boolean | null
          partner_profile_id?: string | null
          rating?: number | null
          safety_concerns?: boolean | null
          user_profile_id?: string
        }
        Relationships: []
      }
      date_plans: {
        Row: {
          created_at: string | null
          date_type: string | null
          id: string
          location: Json | null
          match_id: string | null
          notes: string | null
          proposed_time: string | null
          proposer_profile_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_type?: string | null
          id?: string
          location?: Json | null
          match_id?: string | null
          notes?: string | null
          proposed_time?: string | null
          proposer_profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_type?: string | null
          id?: string
          location?: Json | null
          match_id?: string | null
          notes?: string | null
          proposed_time?: string | null
          proposer_profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deleted_accounts: {
        Row: {
          deleted_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          related_action_id: string | null
          related_report_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          related_action_id?: string | null
          related_report_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          related_action_id?: string | null
          related_report_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          device_info: Json | null
          error_message: string | null
          error_type: string | null
          id: string
          is_resolved: boolean | null
          page_url: string | null
          severity: string | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          is_resolved?: boolean | null
          page_url?: string | null
          severity?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          is_resolved?: boolean | null
          page_url?: string | null
          severity?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          attendees: string[] | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          current_attendees: number | null
          description: string | null
          end_date: string | null
          event_type: string | null
          host_profile_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_virtual: boolean | null
          location: Json | null
          location_address: string | null
          location_name: string | null
          max_attendees: number | null
          price: number | null
          start_date: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          virtual_link: string | null
        }
        Insert: {
          attendees?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          host_profile_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_virtual?: boolean | null
          location?: Json | null
          location_address?: string | null
          location_name?: string | null
          max_attendees?: number | null
          price?: number | null
          start_date: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Update: {
          attendees?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          host_profile_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_virtual?: boolean | null
          location?: Json | null
          location_address?: string | null
          location_name?: string | null
          max_attendees?: number | null
          price?: number | null
          start_date?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Relationships: []
      }
      fake_profile_detections: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          detection_type: string | null
          flags: Json | null
          id: string
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_profile_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          detection_type?: string | null
          flags?: Json | null
          id?: string
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_profile_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          detection_type?: string | null
          flags?: Json | null
          id?: string
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_profile_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          percentage: number | null
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          percentage?: number | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          percentage?: number | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      founder_code_redemptions: {
        Row: {
          code_id: string | null
          code_used: string | null
          created_at: string | null
          id: string
          user_id: string
          user_profile_id: string
        }
        Insert: {
          code_id?: string | null
          code_used?: string | null
          created_at?: string | null
          id?: string
          user_id: string
          user_profile_id: string
        }
        Update: {
          code_id?: string | null
          code_used?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "founder_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          created_date: string | null
          current_redemptions: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_redemptions: number | null
          trial_days: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          current_redemptions?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          trial_days?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          current_redemptions?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          trial_days?: number | null
        }
        Relationships: []
      }
      ice_breakers: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: []
      }
      id_verifications: {
        Row: {
          ai_result: Json | null
          created_at: string | null
          id: string
          id_back_url: string | null
          id_front_url: string
          id_type: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url: string
          id_type?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          ai_result?: Json | null
          created_at?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string
          id_type?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      in_app_purchases: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          platform: string | null
          product_id: string
          product_type: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          platform?: string | null
          product_id: string
          product_type?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          platform?: string | null
          product_id?: string
          product_type?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      language_exchanges: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          learning_language: string | null
          native_language: string | null
          proficiency_level: string | null
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          learning_language?: string | null
          native_language?: string | null
          proficiency_level?: string | null
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          learning_language?: string | null
          native_language?: string | null
          proficiency_level?: string | null
          user_profile_id?: string
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          created_at: string | null
          guidelines_version: string
          id: string
          ip_address: string | null
          privacy_version: string
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string | null
          guidelines_version?: string
          id?: string
          ip_address?: string | null
          privacy_version?: string
          terms_version?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string | null
          guidelines_version?: string
          id?: string
          ip_address?: string | null
          privacy_version?: string
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
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
      live_locations: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_sharing: boolean | null
          latitude: number | null
          longitude: number | null
          match_id: string | null
          updated_at: string | null
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_sharing?: boolean | null
          latitude?: number | null
          longitude?: number | null
          match_id?: string | null
          updated_at?: string | null
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_sharing?: boolean | null
          latitude?: number | null
          longitude?: number | null
          match_id?: string | null
          updated_at?: string | null
          user_profile_id?: string
        }
        Relationships: []
      }
      marketplace_businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          category: string
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_user_id: string | null
          phone: string | null
          price_range: string | null
          subcategory: string | null
          tags: string[] | null
          total_reviews: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          price_range?: string | null
          subcategory?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          price_range?: string | null
          subcategory?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      match_feedbacks: {
        Row: {
          created_at: string | null
          feedback_notes: string | null
          feedback_type: string | null
          id: string
          match_id: string | null
          rating: number | null
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_notes?: string | null
          feedback_type?: string | null
          id?: string
          match_id?: string | null
          rating?: number | null
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          feedback_notes?: string | null
          feedback_type?: string | null
          id?: string
          match_id?: string | null
          rating?: number | null
          user_profile_id?: string
        }
        Relationships: []
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
      message_translations: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          source_language: string | null
          target_language: string | null
          translated_content: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          source_language?: string | null
          target_language?: string | null
          translated_content?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          source_language?: string | null
          target_language?: string | null
          translated_content?: string | null
        }
        Relationships: []
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
      moderation_actions: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          expires_at: string | null
          id: string
          performed_by: string | null
          reason: string | null
          rule_id: string | null
          target_profile_id: string | null
          target_user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          expires_at?: string | null
          id?: string
          performed_by?: string | null
          reason?: string | null
          rule_id?: string | null
          target_profile_id?: string | null
          target_user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          expires_at?: string | null
          id?: string
          performed_by?: string | null
          reason?: string | null
          rule_id?: string | null
          target_profile_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "moderation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_rules: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rule_type: string
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rule_type: string
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rule_type?: string
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      phone_verifications: {
        Row: {
          created_at: string | null
          id: string
          phone_number: string
          status: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          phone_number: string
          status?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phone_number?: string
          status?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      photo_engagements: {
        Row: {
          created_at: string | null
          engagement_type: string | null
          id: string
          photo_url: string
          user_profile_id: string
          viewer_profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          engagement_type?: string | null
          id?: string
          photo_url: string
          user_profile_id: string
          viewer_profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          engagement_type?: string | null
          id?: string
          photo_url?: string
          user_profile_id?: string
          viewer_profile_id?: string | null
        }
        Relationships: []
      }
      photo_moderations: {
        Row: {
          ai_flags: Json | null
          ai_score: number | null
          created_at: string | null
          id: string
          photo_url: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_profile_id: string
        }
        Insert: {
          ai_flags?: Json | null
          ai_score?: number | null
          created_at?: string | null
          id?: string
          photo_url: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_profile_id: string
        }
        Update: {
          ai_flags?: Json | null
          ai_score?: number | null
          created_at?: string | null
          id?: string
          photo_url?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_profile_id?: string
        }
        Relationships: []
      }
      photo_verifications: {
        Row: {
          ai_result: Json | null
          created_at: string | null
          id: string
          profile_photo_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
          status: string | null
          user_id: string
          user_profile_id: string
          verification_type: string | null
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string | null
          id?: string
          profile_photo_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          status?: string | null
          user_id: string
          user_profile_id: string
          verification_type?: string | null
        }
        Update: {
          ai_result?: Json | null
          created_at?: string | null
          id?: string
          profile_photo_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          status?: string | null
          user_id?: string
          user_profile_id?: string
          verification_type?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          created_at: string | null
          currency: string | null
          discount_percent: number | null
          duration_months: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          stripe_price_id: string | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          discount_percent?: number | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          stripe_price_id?: string | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          discount_percent?: number | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stripe_price_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_analytics: {
        Row: {
          created_at: string | null
          created_date: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          session_id: string | null
          user_profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_date?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          user_profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_date?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          user_profile_id?: string | null
        }
        Relationships: []
      }
      profile_boosts: {
        Row: {
          boost_type: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          started_at: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          boost_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          boost_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      profile_suggestions: {
        Row: {
          created_at: string | null
          id: string
          reasons: string[] | null
          score: number | null
          status: string | null
          suggested_profile_id: string
          user_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reasons?: string[] | null
          score?: number | null
          status?: string | null
          suggested_profile_id: string
          user_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reasons?: string[] | null
          score?: number | null
          status?: string | null
          suggested_profile_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string | null
          id: string
          source: string | null
          view_duration: number | null
          viewed_profile_id: string
          viewed_user_id: string | null
          viewer_profile_id: string
          viewer_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source?: string | null
          view_duration?: number | null
          viewed_profile_id: string
          viewed_user_id?: string | null
          viewer_profile_id: string
          viewer_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source?: string | null
          view_duration?: number | null
          viewed_profile_id?: string
          viewed_user_id?: string | null
          viewer_profile_id?: string
          viewer_user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string | null
          created_at: string | null
          current_redemptions: number | null
          discount_type: string | null
          discount_value: number
          id: string
          is_active: boolean | null
          max_redemptions: number | null
          name: string
          target_tier: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          current_redemptions?: number | null
          discount_type?: string | null
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          name: string
          target_tier?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          current_redemptions?: number | null
          discount_type?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          name?: string
          target_tier?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string
          quiz_id: string | null
          result_type: string | null
          score: number | null
          user_profile_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          quiz_id?: string | null
          result_type?: string | null
          score?: number | null
          user_profile_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          quiz_id?: string | null
          result_type?: string | null
          score?: number | null
          user_profile_id?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_provider: string | null
          receipt_data: Json | null
          status: string | null
          subscription_id: string | null
          transaction_id: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_provider?: string | null
          receipt_data?: Json | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_provider?: string | null
          receipt_data?: Json | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_user_id: string
          reward_given: boolean | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
          reward_given?: boolean | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_given?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          reported_id: string
          reported_user_id: string
          reporter_id: string
          reporter_user_id: string
          resolution: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reported_id: string
          reported_user_id: string
          reporter_id: string
          reporter_user_id: string
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reported_id?: string
          reported_user_id?: string
          reporter_id?: string
          reporter_user_id?: string
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      safety_checks: {
        Row: {
          check_in_time: string | null
          created_at: string | null
          emergency_contact: Json | null
          id: string
          is_safe: boolean | null
          location: Json | null
          match_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_profile_id: string
        }
        Insert: {
          check_in_time?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          is_safe?: boolean | null
          location?: Json | null
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_profile_id: string
        }
        Update: {
          check_in_time?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          is_safe?: boolean | null
          location?: Json | null
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      scam_analyses: {
        Row: {
          analysis_type: string | null
          created_at: string | null
          id: string
          risk_factors: Json | null
          risk_score: number | null
          status: string | null
          updated_at: string | null
          user_profile_id: string
        }
        Insert: {
          analysis_type?: string | null
          created_at?: string | null
          id?: string
          risk_factors?: Json | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
          user_profile_id: string
        }
        Update: {
          analysis_type?: string | null
          created_at?: string | null
          id?: string
          risk_factors?: Json | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
          user_profile_id?: string
        }
        Relationships: []
      }
      screenshot_alerts: {
        Row: {
          context: string | null
          created_at: string | null
          detected_user_id: string | null
          id: string
          user_profile_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          detected_user_id?: string | null
          id?: string
          user_profile_id: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          detected_user_id?: string | null
          id?: string
          user_profile_id?: string
        }
        Relationships: []
      }
      speed_dating_sessions: {
        Row: {
          created_at: string | null
          current_participants: number | null
          description: string | null
          duration_minutes: number | null
          id: string
          max_participants: number | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
          virtual_link: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          max_participants?: number | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          max_participants?: number | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_expired: boolean | null
          media_type: string
          media_url: string
          updated_at: string
          user_profile_id: string
          views: string[] | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean | null
          media_type?: string
          media_url: string
          updated_at?: string
          user_profile_id: string
          views?: string[] | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean | null
          media_type?: string
          media_url?: string
          updated_at?: string
          user_profile_id?: string
          views?: string[] | null
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          story_id: string
          user_profile_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          story_id: string
          user_profile_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          story_id?: string
          user_profile_id?: string
        }
        Relationships: []
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
      success_stories: {
        Row: {
          created_at: string | null
          id: string
          is_featured: boolean | null
          likes_count: number | null
          partner_profile_id: string | null
          photos: string[] | null
          reviewed_by: string | null
          status: string | null
          story: string
          title: string
          updated_at: string | null
          user_profile_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          partner_profile_id?: string | null
          photos?: string[] | null
          reviewed_by?: string | null
          status?: string | null
          story: string
          title: string
          updated_at?: string | null
          user_profile_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          partner_profile_id?: string | null
          photos?: string[] | null
          reviewed_by?: string | null
          status?: string | null
          story?: string
          title?: string
          updated_at?: string | null
          user_profile_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      success_story_contests: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          prize_description: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          winner_story_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          prize_description?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          winner_story_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          prize_description?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          winner_story_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      tier_configurations: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price_monthly: number | null
          price_quarterly: number | null
          price_yearly: number | null
          sort_order: number | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price_monthly?: number | null
          price_quarterly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number | null
          price_quarterly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_ml_profiles: {
        Row: {
          compatibility_weights: Json | null
          created_at: string | null
          id: string
          interaction_history: Json | null
          last_calculated_at: string | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
          user_profile_id: string | null
        }
        Insert: {
          compatibility_weights?: Json | null
          created_at?: string | null
          id?: string
          interaction_history?: Json | null
          last_calculated_at?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
          user_profile_id?: string | null
        }
        Update: {
          compatibility_weights?: Json | null
          created_at?: string | null
          id?: string
          interaction_history?: Json | null
          last_calculated_at?: string | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string | null
        }
        Relationships: []
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
          is_id_verified: boolean | null
          is_photo_verified: boolean | null
          is_premium: boolean | null
          is_seed: boolean | null
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
          profile_prompts: Json | null
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
          video_profile_url: string | null
          violation_count: number | null
          voice_intro_url: string | null
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
          is_id_verified?: boolean | null
          is_photo_verified?: boolean | null
          is_premium?: boolean | null
          is_seed?: boolean | null
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
          profile_prompts?: Json | null
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
          video_profile_url?: string | null
          violation_count?: number | null
          voice_intro_url?: string | null
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
          is_id_verified?: boolean | null
          is_photo_verified?: boolean | null
          is_premium?: boolean | null
          is_seed?: boolean | null
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
          profile_prompts?: Json | null
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
          video_profile_url?: string | null
          violation_count?: number | null
          voice_intro_url?: string | null
          warning_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          category: string | null
          contact_info: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string | null
          document_url: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_profile_id: string
          verification_type: string
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_profile_id: string
          verification_type: string
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_profile_id?: string
          verification_type?: string
        }
        Relationships: []
      }
      video_calls: {
        Row: {
          caller_profile_id: string
          created_at: string | null
          duration: number | null
          ended_at: string | null
          id: string
          match_id: string | null
          receiver_profile_id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          caller_profile_id: string
          created_at?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          match_id?: string | null
          receiver_profile_id: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          caller_profile_id?: string
          created_at?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          match_id?: string | null
          receiver_profile_id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      vip_event_registrations: {
        Row: {
          created_at: string | null
          id: string
          payment_status: string | null
          status: string | null
          user_id: string
          user_profile_id: string
          vip_event_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          status?: string | null
          user_id: string
          user_profile_id: string
          vip_event_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          status?: string | null
          user_id?: string
          user_profile_id?: string
          vip_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_event_registrations_vip_event_id_fkey"
            columns: ["vip_event_id"]
            isOneToOne: false
            referencedRelation: "vip_events"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_events: {
        Row: {
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_date: string | null
          event_type: string | null
          host_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: Json | null
          max_attendees: number | null
          min_tier: string | null
          price: number | null
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
          virtual_link: string | null
        }
        Insert: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          host_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: Json | null
          max_attendees?: number | null
          min_tier?: string | null
          price?: number | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Update: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          host_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: Json | null
          max_attendees?: number | null
          min_tier?: string | null
          price?: number | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Relationships: []
      }
      virtual_gifts: {
        Row: {
          cost: number | null
          created_at: string | null
          gift_name: string | null
          gift_type: string
          id: string
          is_read: boolean | null
          message: string | null
          receiver_profile_id: string
          sender_profile_id: string
          sender_user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          gift_name?: string | null
          gift_type: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          receiver_profile_id: string
          sender_profile_id: string
          sender_user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          gift_name?: string | null
          gift_type?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          receiver_profile_id?: string
          sender_profile_id?: string
          sender_user_id?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          position: number | null
          referral_code: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          position?: number | null
          referral_code?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          position?: number | null
          referral_code?: string | null
          status?: string | null
        }
        Relationships: []
      }
      wedding_vendors: {
        Row: {
          created_at: string | null
          id: string
          portfolio_urls: string[] | null
          price_range: string | null
          service_type: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          portfolio_urls?: string[] | null
          price_range?: string | null
          service_type?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          portfolio_urls?: string[] | null
          price_range?: string | null
          service_type?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
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
