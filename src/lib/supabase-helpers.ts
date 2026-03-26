/**
 * Supabase Helper Utilities
 * Clean, typed wrapper functions for common Supabase operations.
 * All functions use the Supabase client directly.
 */
import { supabase } from "@/integrations/supabase/client";

// Use untyped client for dynamic table access
const db = supabase as any;

// ─── AUTH HELPERS ───────────────────────────────────────────────

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileResult, roleResult] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', user.id),
  ]);

  const profile = profileResult.data;
  const roles = (roleResult.data || []).map((r: any) => r.role);
  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator');

  return {
    ...(profile || {}),
    profile_id: profile?.id ?? null,
    id: user.id,
    user_id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name,
    auth_role: user.role,
    role: isAdmin ? 'admin' : isModerator ? 'moderator' : 'user',
    roles,
  };
}

export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export async function logout(redirectUrl?: string) {
  await supabase.auth.signOut();
  if (redirectUrl) window.location.href = redirectUrl;
  else window.location.reload();
}

export async function updateCurrentUser(data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const { data: updated, error } = await supabase
    .from('user_profiles')
    .update(data)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

// ─── QUERY HELPERS ──────────────────────────────────────────────

type SortString = string; // e.g. '-created_at' or 'name'

function parseSort(sort: SortString) {
  const ascending = !sort.startsWith('-');
  let column = sort.replace(/^-/, '');
  if (column === 'created_date') column = 'created_at';
  return { column, ascending };
}

const addLegacyAliases = (rows: any[]): any[] =>
  rows.map(r => r && !r.created_date && r.created_at ? { ...r, created_date: r.created_at } : r);

/**
 * List records from a table with sorting and limit.
 */
export async function listRecords(table: string, sort = '-created_at', limit = 50) {
  const { column, ascending } = parseSort(sort);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order(column, { ascending })
    .limit(limit);
  if (error) throw error;
  return addLegacyAliases(data || []);
}

/**
 * Filter records from a table with MongoDB-style operators.
 */
export async function filterRecords(
  table: string,
  filters: Record<string, any>,
  sort = '-created_at',
  limit = 50
) {
  const { column, ascending } = parseSort(sort);
  const mapped = mapFilterKeys(filters);
  let query = supabase.from(table).select('*');

  if (mapped.$or && Array.isArray(mapped.$or)) {
    const orConditions = mapped.$or.map((cond: Record<string, any>) =>
      Object.entries(cond).map(([k, v]) => `${k}.eq.${v}`).join(',')
    );
    query = query.or(orConditions.join(','));
    Object.entries(mapped).forEach(([key, value]) => {
      if (key === '$or') return;
      query = applyFilter(query, key, value);
    });
  } else {
    Object.entries(mapped).forEach(([key, value]) => {
      query = applyFilter(query, key, value);
    });
  }

  const { data, error } = await query.order(column, { ascending }).limit(limit);
  if (error) throw error;
  return addLegacyAliases(data || []);
}

function mapFilterKeys(filters: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    mapped[key === 'created_date' ? 'created_at' : key] = value;
  }
  return mapped;
}

function applyFilter(query: any, key: string, value: any) {
  if (Array.isArray(value)) return query.in(key, value);
  if (typeof value === 'object' && value !== null) {
    Object.entries(value as Record<string, any>).forEach(([op, val]) => {
      if (op === '$gte') query = query.gte(key, val);
      if (op === '$lte') query = query.lte(key, val);
      if (op === '$gt') query = query.gt(key, val);
      if (op === '$lt') query = query.lt(key, val);
      if (op === '$ne') query = query.neq(key, val);
    });
    return query;
  }
  return query.eq(key, value);
}

/**
 * Create a record in a table.
 */
export async function createRecord(table: string, data: any) {
  const { data: created, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return addLegacyAliases([created])[0];
}

/**
 * Bulk create records in a table.
 */
export async function bulkCreateRecords(table: string, items: any[]) {
  const { data, error } = await supabase.from(table).insert(items).select();
  if (error) throw error;
  return addLegacyAliases(data || []);
}

/**
 * Update a record by ID.
 */
export async function updateRecord(table: string, id: string, data: any) {
  const { data: updated, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return addLegacyAliases([updated])[0];
}

/**
 * Delete a record by ID.
 */
export async function deleteRecord(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

/**
 * Count records with optional filters.
 */
export async function countRecords(table: string, filters?: Record<string, any>) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/**
 * Subscribe to realtime changes on a table.
 */
export function subscribeToTable(table: string, callback: (event: any) => void) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      callback({
        type: payload.eventType,
        id: (payload.new as any)?.id || (payload.old as any)?.id,
        data: payload.new,
        old_data: payload.old,
      });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─── EDGE FUNCTION HELPERS ──────────────────────────────────────

const functionNameMap: Record<string, string> = {
  deleteAccount: 'delete-account',
  rateLimitAuth: 'rate-limit-auth',
  acceptLegalTerms: 'accept-legal-terms',
  submitReport: 'submit-report',
  mlMatchingEngine: 'ml-matching-engine',
  sendOTP: 'send-otp',
  verifyOTP: 'send-otp',
  cancelSubscription: 'cancel-subscription',
  sendNewsletterEmail: 'send-newsletter-email',
  sendPushNotification: 'send-push-notification',
  getFounderStats: 'get-founder-stats',
  chatSuggestions: 'chat-suggestions',
  profileOptimization: 'profile-optimization',
  openaiChat: 'openai-chat',
  generateImage: 'generate-image',
  inviteUser: 'invite-user',
  sendEmail: 'send-email',
  sendMessage: 'send-message',
  blockUser: 'block-user',
  stripeWebhook: 'stripe-webhook',
  verifyVideoIdentity: 'verify-photo',
  moderateContent: 'moderate-content',
  ubuntuAi: 'ubuntu-ai',
  createProfile: 'createProfile',
  autoDetectScammers: 'auto-detect-scammers',
  autoVerifyPhotos: 'auto-verify-photos',
  analyzeConversationPatterns: 'analyze-conversation-patterns',
  checkExpiredSubscriptions: 'check-expired-subscriptions',
  sendWinbackEmail: 'send-winback-email',
  boostProfile: 'boost-profile',
};

/**
 * Invoke an edge function with automatic name mapping.
 */
export async function invokeFunction(functionName: string, payload?: any) {
  const resolvedName = functionNameMap[functionName] || functionName;
  const { data, error } = await supabase.functions.invoke(resolvedName, { body: payload });
  if (error) {
    let errorMessage = 'Unknown error';
    if (data && typeof data === 'object' && data.error) {
      errorMessage = data.error;
    } else if (error.message) {
      try {
        const parsed = JSON.parse(error.message);
        errorMessage = parsed.error || error.message;
      } catch {
        errorMessage = error.message;
      }
    }
    throw new Error(errorMessage);
  }
  return data;
}

// ─── INTEGRATION HELPERS ────────────────────────────────────────

export async function invokeLLM({ prompt, add_context_from_internet, response_json_schema, file_urls }: {
  prompt: string;
  add_context_from_internet?: boolean;
  response_json_schema?: any;
  file_urls?: string[];
}) {
  const { data, error } = await supabase.functions.invoke('openai-chat', {
    body: { prompt, addContext: add_context_from_internet, jsonSchema: response_json_schema, fileUrls: file_urls }
  });
  if (error) throw error;
  return data;
}

export async function uploadFile(file: File) {
  const fileName = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('photos').upload(fileName, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
  return { file_url: publicUrl };
}

export async function sendEmail({ to, subject, body, from_name }: {
  to: string;
  subject: string;
  body: string;
  from_name?: string;
}) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, body, fromName: from_name }
  });
  if (error) throw error;
  return data;
}

// ─── TABLE NAME CONSTANTS ───────────────────────────────────────

export const Tables = {
  UserProfiles: 'user_profiles',
  UserMLProfiles: 'user_ml_profiles',
  Likes: 'likes',
  Passes: 'passes',
  Matches: 'matches',
  Messages: 'messages',
  MessageTranslations: 'message_translations',
  Notifications: 'notifications',
  Subscriptions: 'subscriptions',
  TierConfigurations: 'tier_configurations',
  InAppPurchases: 'in_app_purchases',
  PricingPlans: 'pricing_plans',
  FounderInviteCodes: 'founder_invite_codes',
  FounderCodeRedemptions: 'founder_code_redemptions',
  Receipts: 'receipts',
  ProfileBoosts: 'profile_boosts',
  Promotions: 'promotions',
  Events: 'events',
  VIPEvents: 'vip_events',
  VIPEventRegistrations: 'vip_event_registrations',
  SpeedDatingSessions: 'speed_dating_sessions',
  Reports: 'reports',
  SafetyChecks: 'safety_checks',
  ScreenshotAlerts: 'screenshot_alerts',
  PhotoModerations: 'photo_moderations',
  VerificationRequests: 'verification_requests',
  ScamAnalyses: 'scam_analyses',
  FakeProfileDetections: 'fake_profile_detections',
  BackgroundChecks: 'background_checks',
  ModerationRules: 'moderation_rules',
  ModerationActions: 'moderation_actions',
  Disputes: 'disputes',
  BroadcastMessages: 'broadcast_messages',
  ProfileAnalytics: 'profile_analytics',
  AdminAuditLogs: 'admin_audit_logs',
  ErrorLogs: 'error_logs',
  MatchFeedbacks: 'match_feedbacks',
  Ambassadors: 'ambassadors',
  AmbassadorReferrals: 'ambassador_referrals',
  AmbassadorCommissions: 'ambassador_commissions',
  AmbassadorPayouts: 'ambassador_payouts',
  AmbassadorCommissionPlans: 'ambassador_commission_plans',
  AmbassadorReferralEvents: 'ambassador_referral_events',
  AmbassadorCampaigns: 'ambassador_campaigns',
  AmbassadorContentAssets: 'ambassador_content_assets',
  SystemSettings: 'system_settings',
  FeatureFlags: 'feature_flags',
  SupportTickets: 'support_tickets',
  LegalAcceptances: 'legal_acceptances',
  DeletedAccounts: 'deleted_accounts',
  ABTests: 'ab_tests',
  Advertisements: 'advertisements',
  Referrals: 'referrals',
  PhoneVerifications: 'phone_verifications',
  WaitlistEntries: 'waitlist_entries',
  SuccessStories: 'success_stories',
  SuccessStoryContests: 'success_story_contests',
  ContestPeriods: 'contest_periods',
  CompatibilityQuizzes: 'compatibility_quizzes',
  QuizResults: 'quiz_results',
  Communities: 'communities',
  CommunityMessages: 'community_messages',
  CommunityMembers: 'community_members',
  WeddingVendors: 'wedding_vendors',
  Vendors: 'vendors',
  LanguageExchanges: 'language_exchanges',
  DailyMatches: 'daily_matches',
  DatePlans: 'date_plans',
  DateFeedbacks: 'date_feedbacks',
  IceBreakers: 'ice_breakers',
  LiveLocations: 'live_locations',
  PhotoEngagements: 'photo_engagements',
  ChatGames: 'chat_games',
  Stories: 'stories',
  StoryComments: 'story_comments',
  VideoCalls: 'video_calls',
  VirtualGifts: 'virtual_gifts',
  ProfileViews: 'profile_views',
  ProfileSuggestions: 'profile_suggestions',
  AIInsights: 'ai_insights',
  MarketplaceBusinesses: 'marketplace_businesses',
  BusinessReviews: 'business_reviews',
  BusinessFavorites: 'business_favorites',
  ContentModerations: 'content_moderations',
  IDVerifications: 'id_verifications',
} as const;

// ─── ANALYTICS ──────────────────────────────────────────────────

export function trackEvent(eventName: string, properties?: any) {
  console.log('Track event:', eventName, properties);
}
