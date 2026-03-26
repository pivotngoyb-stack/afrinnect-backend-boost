/**
 * Base44 Compatibility Layer
 * Re-exports from supabase-helpers for backward compatibility.
 * New code should import from '@/lib/supabase-helpers' directly.
 * @deprecated Use '@/lib/supabase-helpers' instead.
 */
import {
  getCurrentUser,
  isAuthenticated,
  logout,
  updateCurrentUser,
  listRecords,
  filterRecords,
  createRecord,
  bulkCreateRecords,
  updateRecord,
  deleteRecord,
  countRecords,
  subscribeToTable,
  invokeFunction,
  invokeLLM,
  uploadFile,
  sendEmail,
  trackEvent,
} from '@/lib/supabase-helpers';

import { supabase } from '@/integrations/supabase/client';

// Entity name → table name map
const entityTableMap: Record<string, string> = {
  UserProfile: 'user_profiles',
  UserMLProfile: 'user_ml_profiles',
  Like: 'likes',
  Pass: 'passes',
  Match: 'matches',
  Message: 'messages',
  MessageTranslation: 'message_translations',
  Notification: 'notifications',
  Subscription: 'subscriptions',
  TierConfiguration: 'tier_configurations',
  InAppPurchase: 'in_app_purchases',
  PricingPlan: 'pricing_plans',
  FounderInviteCode: 'founder_invite_codes',
  FounderCodeRedemption: 'founder_code_redemptions',
  Receipt: 'receipts',
  ProfileBoost: 'profile_boosts',
  Promotion: 'promotions',
  Event: 'events',
  VIPEvent: 'vip_events',
  VIPEventRegistration: 'vip_event_registrations',
  SpeedDatingSession: 'speed_dating_sessions',
  Report: 'reports',
  SafetyCheck: 'safety_checks',
  ScreenshotAlert: 'screenshot_alerts',
  PhotoModeration: 'photo_moderations',
  VerificationRequest: 'verification_requests',
  ScamAnalysis: 'scam_analyses',
  FakeProfileDetection: 'fake_profile_detections',
  BackgroundCheck: 'background_checks',
  ModerationRule: 'moderation_rules',
  ModerationAction: 'moderation_actions',
  Dispute: 'disputes',
  BroadcastMessage: 'broadcast_messages',
  ProfileAnalytics: 'profile_analytics',
  AdminAuditLog: 'admin_audit_logs',
  ErrorLog: 'error_logs',
  MatchFeedback: 'match_feedbacks',
  Ambassador: 'ambassadors',
  AmbassadorReferral: 'ambassador_referrals',
  AmbassadorCommission: 'ambassador_commissions',
  AmbassadorPayout: 'ambassador_payouts',
  AmbassadorCommissionPlan: 'ambassador_commission_plans',
  AmbassadorReferralEvent: 'ambassador_referral_events',
  AmbassadorCampaign: 'ambassador_campaigns',
  AmbassadorContentAsset: 'ambassador_content_assets',
  SystemSettings: 'system_settings',
  FeatureFlag: 'feature_flags',
  SupportTicket: 'support_tickets',
  LegalAcceptance: 'legal_acceptances',
  DeletedAccount: 'deleted_accounts',
  ABTest: 'ab_tests',
  Advertisement: 'advertisements',
  Referral: 'referrals',
  PhoneVerification: 'phone_verifications',
  WaitlistEntry: 'waitlist_entries',
  SuccessStory: 'success_stories',
  SuccessStoryContest: 'success_story_contests',
  ContestPeriod: 'contest_periods',
  CompatibilityQuiz: 'compatibility_quizzes',
  QuizResult: 'quiz_results',
  Community: 'communities',
  WeddingVendor: 'wedding_vendors',
  Vendor: 'vendors',
  LanguageExchange: 'language_exchanges',
  DailyMatch: 'daily_matches',
  DatePlan: 'date_plans',
  DateFeedback: 'date_feedbacks',
  IceBreaker: 'ice_breakers',
  LiveLocation: 'live_locations',
  PhotoEngagement: 'photo_engagements',
  ChatGame: 'chat_games',
  Story: 'stories',
  StoryComment: 'story_comments',
  VideoCall: 'video_calls',
  VirtualGift: 'virtual_gifts',
  ProfileView: 'profile_views',
  ProfileSuggestion: 'profile_suggestions',
  AIInsight: 'ai_insights',
};

const createEntityProxy = (entityName: string) => {
  const table = entityTableMap[entityName] || entityName;
  return {
    list: (sort?: string, limit?: number) => listRecords(table, sort, limit),
    filter: (filters: any, sort?: string, limit?: number) => filterRecords(table, filters, sort, limit),
    create: (data: any) => createRecord(table, data),
    bulkCreate: (items: any[]) => bulkCreateRecords(table, items),
    update: (id: string, data: any) => updateRecord(table, id, data),
    delete: (id: string) => deleteRecord(table, id),
    count: (filters?: any) => countRecords(table, filters),
    schema: async () => ({}),
    subscribe: (cb: any) => subscribeToTable(table, cb),
  };
};

const entitiesProxy = new Proxy({} as Record<string, ReturnType<typeof createEntityProxy>>, {
  get: (_target, prop: string) => createEntityProxy(prop),
});

export const auth = {
  me: getCurrentUser,
  isAuthenticated,
  logout,
  updateMe: updateCurrentUser,
  redirectToLogin(nextUrl?: string) {
    window.location.href = `/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;
  },
};

export const entities = entitiesProxy;

export const integrations = {
  Core: {
    InvokeLLM: invokeLLM,
    UploadFile: ({ file }: { file: File }) => uploadFile(file),
    SendEmail: sendEmail,
    async GenerateImage({ prompt, existing_image_urls }: any) {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, existingImageUrls: existing_image_urls }
      });
      if (error) throw error;
      return data;
    }
  }
};

export const functions = {
  invoke: async (name: string, payload?: any) => {
    const data = await invokeFunction(name, payload);
    return { data };
  }
};

export const analytics = {
  track: ({ eventName, properties }: { eventName: string; properties?: any }) =>
    trackEvent(eventName, properties),
};

export const users = {
  async inviteUser(email: string, role: string) {
    return invokeFunction('inviteUser', { email, role });
  }
};

export const base44 = { auth, entities, integrations, functions, analytics, users };
export const InvokeLLM = invokeLLM;
export const UploadFile = uploadFile;
export const SendEmail = sendEmail;
export default base44;
