

# Advanced Engagement & Retention System Upgrade

## Current System Audit

| Feature | Status | Notes |
|---------|--------|-------|
| Profile completion bar | Fully implemented | Shows weighted %, links to edit profile |
| Match celebration + confetti | Fully implemented | Confetti, vibration, NewMatchToast |
| Live activity feed | Fully implemented | Rotating simulated ticker |
| "People interested in you" teaser | Fully implemented | Blurred profiles, simulated count, premium gate |
| Daily login / streak system | Fully implemented | Streak tracking, DailyReturnBanner |
| Push notification setup | Partially implemented | Client setup exists but FCM keys not configured |
| Chat system (typing, icebreakers, AI starters) | Fully implemented | Realtime typing, AI suggestions, icebreakers |
| Match countdown/expiry | Fully implemented | MatchCountdownBanner with 24h timer |
| Profile badges | Partially implemented | Component exists but badges not auto-assigned |
| Retention rewards (streak milestones) | Partially implemented | Only triggers at days 7, 30, 100 |
| Profile views system | Partially implemented | Analytics page shows views, but no home-screen nudge |
| Message urgency after match | Missing | No "say hi, they're online" prompt on matches page |
| Daily reward ladder (day 1-7) | Missing | Only milestone rewards at 7/30/100 |
| Variable reward / surprise match | Missing | Match probability is fixed (100% first, 70% seed) |
| Social pressure system | Partially implemented | Live feed exists but no competitive pressure |
| Chat reminders for inactive conversations | Missing | No nudges for dead chats |

## Plan: What to Build (Only Missing/Incomplete)

### 1. Profile Views Nudge on Home (Step 2)
**New component**: `src/components/engagement/ProfileViewsNudge.tsx`
- Query `profile_views` table for today's views
- Display "X people viewed your profile today" with eye icon
- Simulate minimum count (2-5) for new users
- Tap navigates to `/who-likes-you` or `/pricing-plans` based on tier
- Add to Home.tsx below PeopleLikeYouTeaser

### 2. Message Urgency System (Step 3)
**New component**: `src/components/engagement/MatchUrgencyPrompt.tsx`
- On Matches page, for matches with no messages yet:
  - Show "Say hi now - they're online" banner
  - After 2h with no message: "They're waiting for your message..."
  - After 12h: "Don't miss this connection - expires soon"
- Add to Matches.tsx, rendered per unmessaged match

### 3. Daily Reward Ladder (Step 4)
**Enhance**: `src/components/monetization/RetentionRewards.tsx`
- Replace the sparse 7/30/100 system with a daily ladder:
  - Day 1: Welcome boost (+5 likes)
  - Day 2: +10% visibility
  - Day 3: 1 free boost
  - Day 4: +5 super like chances
  - Day 5: Profile highlight for 24h
  - Day 6: Priority in discovery
  - Day 7: 1 Super Like + streak badge
- Show a visual progress ladder (7 dots/circles)
- Celebratory animation on claim

### 4. Variable Reward / Surprise Match (Step 5)
**Modify**: `src/pages/Home.tsx` likeMutation
- After first guaranteed match, vary seed match probability between 30-80% randomly per session
- Add "Almost matched!" notification (1 in 5 passes on seed profiles): "You almost matched with someone - keep swiping!"
- Occasional delayed match: instead of instant, show "Checking..." for 2-3 seconds before revealing match
- Creates unpredictability and dopamine uncertainty

### 5. Social Pressure Enhancement (Step 6)
**Enhance**: `src/components/engagement/LiveActivityFeed.tsx`
- Add competitive templates:
  - "People in {userCity} got 12 matches today"
  - "{Name} got 3 matches this hour"
  - "Users who completed profiles get 5x more matches"
- Personalize with user's actual city from `myProfile.current_city`
- Pass `userProfile` prop to LiveActivityFeed

### 6. Auto-Assign Profile Badges (Step 8)
**New utility**: Badge assignment logic in Home.tsx profile fetch
- Auto-compute badges based on profile data:
  - `recently_active`: last_active within 24h
  - `popular`: received 10+ likes
  - `new_here`: account created within 7 days
  - `top_pick`: high completion + verified
  - `highly_liked`: top 20% in likes received
- Store computed badges on profile or pass to ProfileCard
- Add new badge types: `highly_liked`, `active_member`

### 7. Chat Momentum / Dead Chat Reminders (Step 10)
**New component**: `src/components/engagement/ChatReminderBanner.tsx`
- On Matches page, detect matches where last message > 24h ago
- Show: "Your conversation with {name} is going quiet - send a message!"
- Include suggested prompt button that deep-links to chat with a pre-filled starter
- Add to Matches.tsx

### 8. Push Notification Triggers (Step 9 - Enhancement)
**New component**: `src/components/engagement/InAppNotificationCenter.tsx`
- Since FCM is not configured, create in-app notification toasts for:
  - Profile viewed (when profile_views record created)
  - Inactivity (if user hasn't opened app in session for 5+ min, show a browser notification if permission granted)
- Enhance existing notification creation in likeMutation to include "profile_viewed" type
- Add a "Someone viewed your profile" in-app toast on Home

### Technical Details

**Files to create:**
- `src/components/engagement/ProfileViewsNudge.tsx`
- `src/components/engagement/MatchUrgencyPrompt.tsx`
- `src/components/engagement/ChatReminderBanner.tsx`

**Files to modify:**
- `src/pages/Home.tsx` — add ProfileViewsNudge, variable match logic, delayed match reveal, badge computation
- `src/pages/Matches.tsx` — add MatchUrgencyPrompt, ChatReminderBanner
- `src/components/monetization/RetentionRewards.tsx` — rewrite with daily reward ladder (days 1-7)
- `src/components/engagement/LiveActivityFeed.tsx` — add social pressure templates, accept userProfile prop
- `src/components/profile/ProfileBadges.tsx` — add `highly_liked` and `active_member` badge configs
- `src/components/home/SwipeView.tsx` — add "Almost matched!" near-miss notification

**No database changes needed** — all features use existing tables (profile_views, likes, matches, notifications, user_profiles).

