// @ts-nocheck
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import InstallPrompt from "@/components/mobile/InstallPrompt";
import AppBottomNav from "@/components/shared/AppBottomNav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

// Lazy-load all pages
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Chat = lazy(() => import("./pages/Chat"));
const Matches = lazy(() => import("./pages/Matches"));
const DailyMatches = lazy(() => import("./pages/DailyMatches"));
const WhoLikesYou = lazy(() => import("./pages/WhoLikesYou"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const EventChat = lazy(() => import("./pages/EventChat"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const Communities = lazy(() => import("./pages/Communities"));
const CommunityChat = lazy(() => import("./pages/CommunityChat"));
const Explore = lazy(() => import("./pages/Explore"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const Stories = lazy(() => import("./pages/Stories"));
const CompatibilityQuiz = lazy(() => import("./pages/CompatibilityQuiz"));
const CompatibilityQuizzes = lazy(() => import("./pages/CompatibilityQuizzes"));
const DatePlanner = lazy(() => import("./pages/DatePlanner"));
const VirtualGifts = lazy(() => import("./pages/VirtualGifts"));
const SpeedDatingLobby = lazy(() => import("./pages/SpeedDatingLobby"));
const LanguageExchangeHub = lazy(() => import("./pages/LanguageExchangeHub"));
const Shop = lazy(() => import("./pages/Shop"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const PricingPlans = lazy(() => import("./pages/PricingPlans"));
const VIPEventsHub = lazy(() => import("./pages/VIPEventsHub"));
const SuccessStories = lazy(() => import("./pages/SuccessStories"));
const SubmitStory = lazy(() => import("./pages/SubmitStory"));
const SuccessStoryContest = lazy(() => import("./pages/SuccessStoryContest"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const AmbassadorApply = lazy(() => import("./pages/AmbassadorApply"));
const AmbassadorPortal = lazy(() => import("./pages/AmbassadorPortal"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Support = lazy(() => import("./pages/Support"));
const SupportChat = lazy(() => import("./pages/SupportChat"));
const Report = lazy(() => import("./pages/Report"));
const BlockedUsers = lazy(() => import("./pages/BlockedUsers"));
const SafetyCheckSetup = lazy(() => import("./pages/SafetyCheckSetup"));
const SafetyCheckMonitor = lazy(() => import("./pages/SafetyCheckMonitor"));
const IDVerification = lazy(() => import("./pages/IDVerification"));
const VerifyPhoto = lazy(() => import("./pages/VerifyPhoto"));
const PhoneVerification = lazy(() => import("./pages/PhoneVerification"));
const BackgroundCheckRequest = lazy(() => import("./pages/BackgroundCheckRequest"));
const PhotoPerformance = lazy(() => import("./pages/PhotoPerformance"));
const ProfileOptimization = lazy(() => import("./pages/ProfileOptimization"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const LegalAcceptance = lazy(() => import("./pages/LegalAcceptance"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CustomerView = lazy(() => import("./pages/CustomerView"));
const Analytics = lazy(() => import("./pages/Analytics"));
const InvestorReport = lazy(() => import("./pages/InvestorReport"));
const AppStoreCompliance = lazy(() => import("./pages/AppStoreCompliance"));
const VendorManagement = lazy(() => import("./pages/VendorManagement"));
const MigrationCalculator = lazy(() => import("./pages/MigrationCalculator"));
const MigrationDocument = lazy(() => import("./pages/MigrationDocument"));
const AuthFlowTest = lazy(() => import("./pages/AuthFlowTest"));
const ErrorPage = lazy(() => import("./pages/Error"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminBroadcast = lazy(() => import("./pages/AdminBroadcast"));
const AdminAmbassadors = lazy(() => import("./pages/AdminAmbassadors"));
const AdminContent = lazy(() => import("./pages/AdminContent"));
const AdminVIPEvents = lazy(() => import("./pages/AdminVIPEvents"));
const AdminFeatureFlags = lazy(() => import("./pages/AdminFeatureFlags"));
const AdminManual = lazy(() => import("./pages/AdminManual"));
const AdminLaunchChecklist = lazy(() => import("./pages/AdminLaunchChecklist"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/communityguidelines" element={<CommunityGuidelines />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/auth-flow-test" element={<AuthFlowTest />} />

            {/* Legacy URL aliases (MVP 404 prevention) */}
            <Route path="/discover" element={<Navigate to="/explore" replace />} />
            <Route path="/pricing" element={<Navigate to="/pricingplans" replace />} />
            <Route path="/support-chat" element={<Navigate to="/supportchat" replace />} />
            <Route path="/edit-profile" element={<Navigate to="/editprofile" replace />} />
            <Route path="/videochat" element={<Navigate to="/chat" replace />} />
            <Route path="/admin" element={<Navigate to="/admindashboard" replace />} />

            {/* Core App */}
            <Route path="/home" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/editprofile" element={<EditProfile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/dailymatches" element={<DailyMatches />} />
            <Route path="/wholikesyou" element={<WhoLikesYou />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/blockedusers" element={<BlockedUsers />} />
            <Route path="/deleteaccount" element={<DeleteAccount />} />

            {/* Discovery & Social */}
            <Route path="/explore" element={<Explore />} />
            <Route path="/events" element={<Events />} />
            <Route path="/eventdetails" element={<EventDetails />} />
            <Route path="/eventchat" element={<EventChat />} />
            <Route path="/createevent" element={<CreateEvent />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communitychat" element={<CommunityChat />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/compatibilityquiz" element={<CompatibilityQuiz />} />
            <Route path="/compatibilityquizzes" element={<CompatibilityQuizzes />} />
            <Route path="/dateplanner" element={<DatePlanner />} />
            <Route path="/virtualgifts" element={<VirtualGifts />} />
            <Route path="/speeddatinglobby" element={<SpeedDatingLobby />} />
            <Route path="/languageexchangehub" element={<LanguageExchangeHub />} />

            {/* Monetization & Premium */}
            <Route path="/shop" element={<Shop />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/pricingplans" element={<PricingPlans />} />
            <Route path="/vipeventshub" element={<VIPEventsHub />} />
            <Route path="/submitstory" element={<SubmitStory />} />
            <Route path="/successstorycontest" element={<SuccessStoryContest />} />
            <Route path="/referralprogram" element={<ReferralProgram />} />
            <Route path="/ambassadorapply" element={<AmbassadorApply />} />
            <Route path="/ambassadorportal" element={<AmbassadorPortal />} />

            {/* Safety & Verification */}
            <Route path="/report" element={<Report />} />
            <Route path="/safetychecksetup" element={<SafetyCheckSetup />} />
            <Route path="/safetycheckmonitor" element={<SafetyCheckMonitor />} />
            <Route path="/idverification" element={<IDVerification />} />
            <Route path="/verifyphoto" element={<VerifyPhoto />} />
            <Route path="/phoneverification" element={<PhoneVerification />} />
            <Route path="/backgroundcheckrequest" element={<BackgroundCheckRequest />} />

            {/* Profile & Analytics */}
            <Route path="/photoperformance" element={<PhotoPerformance />} />
            <Route path="/profileoptimization" element={<ProfileOptimization />} />
            <Route path="/customerview" element={<CustomerView />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Support & Legal */}
            <Route path="/support" element={<Support />} />
            <Route path="/supportchat" element={<SupportChat />} />
            <Route path="/legalacceptance" element={<LegalAcceptance />} />

            {/* Internal */}
            <Route path="/investorreport" element={<InvestorReport />} />
            <Route path="/appstorecompliance" element={<AppStoreCompliance />} />
            <Route path="/vendormanagement" element={<VendorManagement />} />
            <Route path="/migrationcalculator" element={<MigrationCalculator />} />
            <Route path="/migrationdocument" element={<MigrationDocument />} />

            {/* Admin */}
            <Route path="/admindashboard" element={<AdminDashboard />} />
            <Route path="/adminusers" element={<AdminUsers />} />
            <Route path="/adminmoderation" element={<AdminModeration />} />
            <Route path="/adminanalytics" element={<AdminAnalytics />} />
            <Route path="/adminsubscriptions" element={<AdminSubscriptions />} />
            <Route path="/adminsettings" element={<AdminSettings />} />
            <Route path="/adminbroadcast" element={<AdminBroadcast />} />
            <Route path="/adminambassadors" element={<AdminAmbassadors />} />
            <Route path="/admincontent" element={<AdminContent />} />
            <Route path="/adminvipevents" element={<AdminVIPEvents />} />
            <Route path="/adminfeatureflags" element={<AdminFeatureFlags />} />
            <Route path="/adminmanual" element={<AdminManual />} />
            <Route path="/adminlaunchchecklist" element={<AdminLaunchChecklist />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <AppBottomNav />
      </BrowserRouter>
      <InstallPrompt />
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
