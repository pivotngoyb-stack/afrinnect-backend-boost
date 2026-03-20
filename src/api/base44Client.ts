/**
 * Base44 Compatibility Shim
 * Drop-in replacement that wraps Supabase client to match Base44 API patterns.
 */
import { supabase } from "@/integrations/supabase/client";

const client: any = supabase;

// AUTH HELPERS
export const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch profile and server-side role in parallel
    const [profileResult, roleResult] = await Promise.all([
      client.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      client.from('user_roles').select('role').eq('user_id', user.id),
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
  },
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
  async logout(redirectUrl?: string) {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
    else window.location.reload();
  },
  redirectToLogin(nextUrl?: string) {
    window.location.href = `/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;
  },
  async updateMe(data: any) {
    const user = await this.me();
    if (!user) throw new Error('Not authenticated');
    const { data: updated, error } = await client.from('user_profiles').update(data).eq('user_id', user.id).select().single();
    if (error) throw error;
    return updated;
  }
};

// ENTITY HELPERS
// Add legacy aliases so code using created_date still works
const addLegacyAliases = (rows: any[]): any[] =>
  rows.map(r => r && !r.created_date && r.created_at ? { ...r, created_date: r.created_at } : r);

const mapFilterKeys = (filters: Record<string, any>): Record<string, any> => {
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    mapped[key === 'created_date' ? 'created_at' : key] = value;
  }
  return mapped;
};

const createEntityHelper = (tableName: string) => ({
  async list(sort = '-created_at', limit = 50): Promise<any[]> {
    const ascending = !sort.startsWith('-');
    let column = sort.replace('-', '');
    if (column === 'created_date') column = 'created_at';
    const { data, error } = await client.from(tableName).select('*').order(column, { ascending }).limit(limit);
    if (error) throw error;
    return addLegacyAliases(data || []);
  },
  async filter(filters: Record<string, any>, sort = '-created_at', limit = 50): Promise<any[]> {
    const ascending = !sort.startsWith('-');
    let column = sort.replace('-', '');
    if (column === 'created_date') column = 'created_at';
    const mappedFilters = mapFilterKeys(filters);
    let query = client.from(tableName).select('*');
    Object.entries(mappedFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) { query = query.in(key, value); }
      else if (typeof value === 'object' && value !== null) {
        Object.entries(value as Record<string, any>).forEach(([op, val]) => {
          if (op === '$gte') query = query.gte(key, val);
          if (op === '$lte') query = query.lte(key, val);
          if (op === '$gt') query = query.gt(key, val);
          if (op === '$lt') query = query.lt(key, val);
          if (op === '$ne') query = query.neq(key, val);
        });
      } else { query = query.eq(key, value); }
    });
    const { data, error } = await query.order(column, { ascending }).limit(limit);
    if (error) throw error;
    return addLegacyAliases(data || []);
  },
  async create(data: any): Promise<any> {
    const { data: created, error } = await client.from(tableName).insert(data).select().single();
    if (error) throw error;
    return addLegacyAliases([created])[0];
  },
  async bulkCreate(items: any[]): Promise<any[]> {
    const { data, error } = await client.from(tableName).insert(items).select();
    if (error) throw error;
    return addLegacyAliases(data || []);
  },
  async update(id: string, data: any): Promise<any> {
    const { data: updated, error } = await client.from(tableName).update(data).eq('id', id).select().single();
    if (error) throw error;
    return addLegacyAliases([updated])[0];
  },
  async delete(id: string): Promise<boolean> {
    const { error } = await client.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  async count(filters?: Record<string, any>): Promise<number> {
    let query = client.from(tableName).select('*', { count: 'exact', head: true });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },
  async schema(): Promise<any> { return {}; },
  subscribe(callback: (event: any) => void) {
    const channel = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        callback({ type: payload.eventType, id: (payload.new as any)?.id || (payload.old as any)?.id, data: payload.new, old_data: payload.old });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
});

export const entities: Record<string, ReturnType<typeof createEntityHelper>> = {
  UserProfile: createEntityHelper('user_profiles'),
  UserMLProfile: createEntityHelper('user_ml_profiles'),
  Like: createEntityHelper('likes'),
  Pass: createEntityHelper('passes'),
  Match: createEntityHelper('matches'),
  Message: createEntityHelper('messages'),
  MessageTranslation: createEntityHelper('message_translations'),
  Notification: createEntityHelper('notifications'),
  Subscription: createEntityHelper('subscriptions'),
  TierConfiguration: createEntityHelper('tier_configurations'),
  InAppPurchase: createEntityHelper('in_app_purchases'),
  PricingPlan: createEntityHelper('pricing_plans'),
  FounderInviteCode: createEntityHelper('founder_invite_codes'),
  FounderCodeRedemption: createEntityHelper('founder_code_redemptions'),
  Receipt: createEntityHelper('receipts'),
  ProfileBoost: createEntityHelper('profile_boosts'),
  Promotion: createEntityHelper('promotions'),
  Event: createEntityHelper('events'),
  VIPEvent: createEntityHelper('vip_events'),
  VIPEventRegistration: createEntityHelper('vip_event_registrations'),
  SpeedDatingSession: createEntityHelper('speed_dating_sessions'),
  Report: createEntityHelper('reports'),
  SafetyCheck: createEntityHelper('safety_checks'),
  ScreenshotAlert: createEntityHelper('screenshot_alerts'),
  PhotoModeration: createEntityHelper('photo_moderations'),
  VerificationRequest: createEntityHelper('verification_requests'),
  ScamAnalysis: createEntityHelper('scam_analyses'),
  FakeProfileDetection: createEntityHelper('fake_profile_detections'),
  BackgroundCheck: createEntityHelper('background_checks'),
  ModerationRule: createEntityHelper('moderation_rules'),
  ModerationAction: createEntityHelper('moderation_actions'),
  Dispute: createEntityHelper('disputes'),
  BroadcastMessage: createEntityHelper('broadcast_messages'),
  ProfileAnalytics: createEntityHelper('profile_analytics'),
  AdminAuditLog: createEntityHelper('admin_audit_logs'),
  ErrorLog: createEntityHelper('error_logs'),
  MatchFeedback: createEntityHelper('match_feedbacks'),
  Ambassador: createEntityHelper('ambassadors'),
  AmbassadorReferral: createEntityHelper('ambassador_referrals'),
  AmbassadorCommission: createEntityHelper('ambassador_commissions'),
  AmbassadorPayout: createEntityHelper('ambassador_payouts'),
  AmbassadorCommissionPlan: createEntityHelper('ambassador_commission_plans'),
  AmbassadorReferralEvent: createEntityHelper('ambassador_referral_events'),
  AmbassadorCampaign: createEntityHelper('ambassador_campaigns'),
  AmbassadorContentAsset: createEntityHelper('ambassador_content_assets'),
  SystemSettings: createEntityHelper('system_settings'),
  FeatureFlag: createEntityHelper('feature_flags'),
  SupportTicket: createEntityHelper('support_tickets'),
  LegalAcceptance: createEntityHelper('legal_acceptances'),
  DeletedAccount: createEntityHelper('deleted_accounts'),
  ABTest: createEntityHelper('ab_tests'),
  Advertisement: createEntityHelper('advertisements'),
  Referral: createEntityHelper('referrals'),
  PhoneVerification: createEntityHelper('phone_verifications'),
  WaitlistEntry: createEntityHelper('waitlist_entries'),
  SuccessStory: createEntityHelper('success_stories'),
  SuccessStoryContest: createEntityHelper('success_story_contests'),
  ContestPeriod: createEntityHelper('contest_periods'),
  CompatibilityQuiz: createEntityHelper('compatibility_quizzes'),
  QuizResult: createEntityHelper('quiz_results'),
  Community: createEntityHelper('communities'),
  WeddingVendor: createEntityHelper('wedding_vendors'),
  Vendor: createEntityHelper('vendors'),
  LanguageExchange: createEntityHelper('language_exchanges'),
  DailyMatch: createEntityHelper('daily_matches'),
  DatePlan: createEntityHelper('date_plans'),
  DateFeedback: createEntityHelper('date_feedbacks'),
  IceBreaker: createEntityHelper('ice_breakers'),
  LiveLocation: createEntityHelper('live_locations'),
  PhotoEngagement: createEntityHelper('photo_engagements'),
  ChatGame: createEntityHelper('chat_games'),
  Story: createEntityHelper('stories'),
  StoryComment: createEntityHelper('story_comments'),
  VideoCall: createEntityHelper('video_calls'),
  VirtualGift: createEntityHelper('virtual_gifts'),
  ProfileView: createEntityHelper('profile_views'),
  ProfileSuggestion: createEntityHelper('profile_suggestions'),
  AIInsight: createEntityHelper('ai_insights'),
};

// INTEGRATIONS
export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet, response_json_schema, file_urls }: any) {
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { prompt, addContext: add_context_from_internet, jsonSchema: response_json_schema, fileUrls: file_urls }
      });
      if (error) throw error;
      return data;
    },
    async UploadFile({ file }: { file: File }) {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('photos').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
      return { file_url: publicUrl };
    },
    async SendEmail({ to, subject, body, from_name }: any) {
      const { data, error } = await supabase.functions.invoke('send-email', { body: { to, subject, body, fromName: from_name } });
      if (error) throw error;
      return data;
    },
    async GenerateImage({ prompt, existing_image_urls }: any) {
      const { data, error } = await supabase.functions.invoke('generate-image', { body: { prompt, existingImageUrls: existing_image_urls } });
      if (error) throw error;
      return data;
    }
  }
};

// FUNCTIONS
// Map legacy camelCase function names to kebab-case edge function names
const functionNameMap: Record<string, string> = {
  deleteAccount: 'delete-account',
  rateLimitAuth: 'rate-limit-auth',
  acceptLegalTerms: 'accept-legal-terms',
  submitReport: 'submit-report',
  mlMatchingEngine: 'ml-matching-engine',
  sendOTP: 'send-otp',
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
};

export const functions = {
  async invoke(functionName: string, payload?: any) {
    const resolvedName = functionNameMap[functionName] || functionName;
    const { data, error } = await supabase.functions.invoke(resolvedName, { body: payload });
    if (error) throw error;
    return data;
  }
};

// ANALYTICS
export const analytics = {
  track({ eventName, properties }: { eventName: string; properties?: any }) {
    console.log('Track event:', eventName, properties);
  }
};

// USERS
export const users = {
  async inviteUser(email: string, role: string) {
    const { data, error } = await supabase.functions.invoke('invite-user', { body: { email, role } });
    if (error) throw error;
    return data;
  }
};

// MAIN EXPORT
export const base44 = { auth, entities, integrations, functions, analytics, users };
export const InvokeLLM = integrations.Core.InvokeLLM;
export const UploadFile = integrations.Core.UploadFile;
export const SendEmail = integrations.Core.SendEmail;
export default base44;
