
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom enums
CREATE TYPE ethnicity_type AS ENUM ('african', 'african_descent', 'non_african_interested');
CREATE TYPE gender_type AS ENUM ('man', 'woman', 'non_binary', 'other');
CREATE TYPE language_pref AS ENUM ('en', 'fr');
CREATE TYPE religion_type AS ENUM ('christianity', 'islam', 'traditional_african', 'judaism', 'buddhism', 'hindu', 'spiritual', 'agnostic', 'atheist', 'other', 'prefer_not_say');
CREATE TYPE education_type AS ENUM ('high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'trade_school', 'other');
CREATE TYPE relationship_goal_type AS ENUM ('dating', 'serious_relationship', 'marriage', 'friendship_community', 'networking');
CREATE TYPE subscription_tier_type AS ENUM ('free', 'premium', 'elite', 'vip');
CREATE TYPE founding_source_type AS ENUM ('global_toggle', 'invite_code', 'manual_admin');
CREATE TYPE match_status_type AS ENUM ('active', 'unmatched', 'blocked', 'expired');
CREATE TYPE message_type AS ENUM ('text', 'voice_note', 'image', 'ice_breaker', 'gif');
CREATE TYPE notification_type AS ENUM ('match', 'like', 'message', 'admin_message', 'super_like');
CREATE TYPE subscription_plan_type AS ENUM ('free', 'premium_monthly', 'premium_quarterly', 'premium_yearly', 'elite_monthly', 'elite_quarterly', 'vip_monthly', 'vip_6months');
CREATE TYPE subscription_status_type AS ENUM ('active', 'cancelled', 'expired', 'paused');
CREATE TYPE payment_provider_type AS ENUM ('stripe', 'apple', 'google', 'manual');

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    display_name TEXT NOT NULL,
    ethnicity ethnicity_type,
    birth_date DATE,
    gender gender_type NOT NULL,
    looking_for TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    primary_photo TEXT,
    bio TEXT,
    country_of_origin TEXT,
    current_country TEXT NOT NULL DEFAULT '',
    current_state TEXT,
    current_city TEXT,
    tribe_ethnicity TEXT,
    languages TEXT[] DEFAULT '{}',
    preferred_language language_pref DEFAULT 'en',
    religion religion_type,
    education education_type,
    profession TEXT,
    relationship_goal relationship_goal_type,
    height_cm NUMERIC,
    lifestyle JSONB DEFAULT '{}',
    cultural_values TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    prompts JSONB DEFAULT '[]',
    blocked_users UUID[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    device_ids TEXT[] DEFAULT '{}',
    device_info JSONB DEFAULT '[]',
    verification_status JSONB DEFAULT '{"email_verified": false, "phone_verified": false, "photo_verified": false}',
    verification_selfie_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_tier subscription_tier_type DEFAULT 'free',
    premium_until DATE,
    is_founding_member BOOLEAN DEFAULT FALSE,
    founding_member_granted_at TIMESTAMPTZ,
    founding_member_trial_ends_at TIMESTAMPTZ,
    founding_member_source founding_source_type,
    founding_member_code_used TEXT,
    founding_member_eligible BOOLEAN DEFAULT TRUE,
    founding_trial_consumed BOOLEAN DEFAULT FALSE,
    founding_member_converted BOOLEAN DEFAULT FALSE,
    founding_member_converted_at TIMESTAMPTZ,
    profile_boost_active BOOLEAN DEFAULT FALSE,
    boost_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    location JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    daily_likes_count INTEGER DEFAULT 0,
    daily_likes_reset_date DATE,
    login_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    ai_safety_score NUMERIC,
    violation_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_expires_at TIMESTAMPTZ,
    suspension_reason TEXT,
    ban_reason TEXT,
    tutorial_completed BOOLEAN DEFAULT FALSE,
    has_matched_before BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    phone_number TEXT,
    is_test_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_current_country ON user_profiles(current_country);
CREATE INDEX idx_user_profiles_is_premium ON user_profiles(is_premium);
CREATE INDEX idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active);
CREATE INDEX idx_user_profiles_is_banned ON user_profiles(is_banned);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
