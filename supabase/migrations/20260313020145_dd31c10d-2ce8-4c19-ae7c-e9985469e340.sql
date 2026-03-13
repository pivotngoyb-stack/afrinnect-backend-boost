
-- Likes Table
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    liker_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    liked_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    liker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_super_like BOOLEAN DEFAULT FALSE,
    is_seen BOOLEAN DEFAULT FALSE,
    is_priority BOOLEAN DEFAULT FALSE,
    priority_boost_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);
CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_id ON likes(liked_id);
CREATE INDEX idx_likes_liker_user_id ON likes(liker_user_id);
CREATE INDEX idx_likes_liked_user_id ON likes(liked_user_id);

-- Passes Table
CREATE TABLE passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    passed_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    passer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_rewindable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(passer_id, passed_id)
);
CREATE INDEX idx_passes_passer_id ON passes(passer_id);
CREATE INDEX idx_passes_passed_id ON passes(passed_id);

-- Matches Table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user1_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user1_liked BOOLEAN DEFAULT FALSE,
    user2_liked BOOLEAN DEFAULT FALSE,
    is_match BOOLEAN DEFAULT FALSE,
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT FALSE,
    last_chance_sent BOOLEAN DEFAULT FALSE,
    compatibility_score NUMERIC,
    compatibility_reasons TEXT[] DEFAULT '{}',
    is_super_like BOOLEAN DEFAULT FALSE,
    status match_status_type DEFAULT 'active',
    has_nudged BOOLEAN DEFAULT FALSE,
    typing_user_id UUID,
    first_message_sent BOOLEAN DEFAULT FALSE,
    first_message_sent_by UUID,
    first_message_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_matches_user1_user_id ON matches(user1_user_id);
CREATE INDEX idx_matches_user2_user_id ON matches(user2_user_id);
CREATE INDEX idx_matches_is_match ON matches(is_match);
CREATE INDEX idx_matches_status ON matches(status);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sequence_number INTEGER,
    idempotency_key TEXT UNIQUE,
    content TEXT NOT NULL,
    message_type message_type NOT NULL DEFAULT 'text',
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_translated BOOLEAN DEFAULT FALSE,
    like_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_user_id ON messages(sender_user_id);
CREATE INDEX idx_messages_receiver_user_id ON messages(receiver_user_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    from_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    link_to TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_type subscription_plan_type NOT NULL,
    status subscription_status_type NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    payment_provider payment_provider_type,
    external_id TEXT,
    amount_paid NUMERIC,
    currency TEXT DEFAULT 'USD',
    boosts_remaining INTEGER DEFAULT 0,
    super_likes_remaining INTEGER DEFAULT 0,
    auto_renew BOOLEAN DEFAULT TRUE,
    regional_pricing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user_profile_id ON subscriptions(user_profile_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS for all new tables
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their likes" ON likes FOR SELECT USING (auth.uid() = liker_user_id OR auth.uid() = liked_user_id);
CREATE POLICY "Users can create likes" ON likes FOR INSERT WITH CHECK (auth.uid() = liker_user_id);
CREATE POLICY "Users can update their likes" ON likes FOR UPDATE USING (auth.uid() = liker_user_id OR auth.uid() = liked_user_id);
CREATE POLICY "Users can delete their likes" ON likes FOR DELETE USING (auth.uid() = liker_user_id);

CREATE POLICY "Users can read own passes" ON passes FOR SELECT USING (auth.uid() = passer_user_id);
CREATE POLICY "Users can create passes" ON passes FOR INSERT WITH CHECK (auth.uid() = passer_user_id);
CREATE POLICY "Users can delete own passes" ON passes FOR DELETE USING (auth.uid() = passer_user_id);

CREATE POLICY "Users can read their matches" ON matches FOR SELECT USING (auth.uid() = user1_user_id OR auth.uid() = user2_user_id);
CREATE POLICY "Authenticated users can create matches" ON matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their matches" ON matches FOR UPDATE USING (auth.uid() = user1_user_id OR auth.uid() = user2_user_id);

CREATE POLICY "Users can read their messages" ON messages FOR SELECT USING (auth.uid() = sender_user_id OR auth.uid() = receiver_user_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
CREATE POLICY "Users can update their messages" ON messages FOR UPDATE USING (auth.uid() = sender_user_id);

CREATE POLICY "Users can read their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read their subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_profiles WHERE id = user_profile_id));

-- Realtime for messages and matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_likes_updated_at BEFORE UPDATE ON likes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
