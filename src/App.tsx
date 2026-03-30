import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import InstallPrompt from "@/components/mobile/InstallPrompt";
import AppBottomNav from "@/components/shared/AppBottomNav";
import AuthGuard from "@/components/shared/AuthGuard";
import AdminGuard from "@/components/shared/AdminGuard";
import ScrollToTop from "@/components/ScrollToTop";

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

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

// Auth wrapper for protected routes
const Protected = ({ children, requireProfile = false }: { children: React.ReactNode; requireProfile?: boolean }) => (
  <AuthGuard requireAuth requireProfile={requireProfile} redirectTo="/login">
    {children}
  </AuthGuard>
);

// Admin wrapper — checks auth + admin role
const AdminProtected = ({ children }: { children: React.ReactNode }) => (
  <Protected>
    <AdminGuard>{children}</AdminGuard>
  </Protected>
);

// Lazy-load all pages
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
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
const EmailUnsubscribe = lazy(() => import("./pages/EmailUnsubscribe"));
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
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminBroadcast = lazy(() => import("./pages/AdminBroadcast"));
const AdminAmbassadors = lazy(() => import("./pages/AdminAmbassadors"));
const AdminContent = lazy(() => import("./pages/AdminContent"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const AdminVIPEvents = lazy(() => import("./pages/AdminVIPEvents"));
const AdminFeatureFlags = lazy(() => import("./pages/AdminFeatureFlags"));
const AdminManual = lazy(() => import("./pages/AdminManual"));
const AdminLaunchChecklist = lazy(() => import("./pages/AdminLaunchChecklist"));
const AdminMarketplace = lazy(() => import("./pages/AdminMarketplace"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AdminLaunchCertification = lazy(() => import("./pages/AdminLaunchCertification"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Suspense fallback={<PageLoader />}><Index /></Suspense>} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/communityguidelines" element={<CommunityGuidelines />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/email-unsubscribe" element={<EmailUnsubscribe />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/auth-flow-test" element={<AuthFlowTest />} />

            {/* Legacy aliases */}
            <Route path="/discover" element={<Navigate to="/explore" replace />} />
            <Route path="/pricing" element={<Navigate to="/pricingplans" replace />} />
            <Route path="/support-chat" element={<Navigate to="/supportchat" replace />} />
            <Route path="/edit-profile" element={<Navigate to="/editprofile" replace />} />
            <Route path="/videochat" element={<Navigate to="/chat" replace />} />
            <Route path="/admin" element={<Navigate to="/admindashboard" replace />} />

            {/* Protected Core App */}
            <Route path="/home" element={<Protected><Home /></Protected>} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
            <Route path="/editprofile" element={<Protected requireProfile><EditProfile /></Protected>} />
            <Route path="/profile" element={<Protected requireProfile><Profile /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/chat" element={<Protected requireProfile><Chat /></Protected>} />
            <Route path="/matches" element={<Protected requireProfile><Matches /></Protected>} />
            <Route path="/dailymatches" element={<Protected requireProfile><DailyMatches /></Protected>} />
            <Route path="/wholikesyou" element={<Protected requireProfile><WhoLikesYou /></Protected>} />
            <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
            <Route path="/blockedusers" element={<Protected><BlockedUsers /></Protected>} />
            <Route path="/deleteaccount" element={<Protected><DeleteAccount /></Protected>} />

            {/* Protected Discovery & Social */}
            <Route path="/explore" element={<Protected><Explore /></Protected>} />
            <Route path="/events" element={<Protected><Events /></Protected>} />
            <Route path="/eventdetails" element={<Protected><EventDetails /></Protected>} />
            <Route path="/eventchat" element={<Protected><EventChat /></Protected>} />
            <Route path="/createevent" element={<Protected><CreateEvent /></Protected>} />
            <Route path="/communities" element={<Protected><Communities /></Protected>} />
            <Route path="/communitychat" element={<Protected><CommunityChat /></Protected>} />
            <Route path="/stories" element={<Protected><Stories /></Protected>} />
            <Route path="/compatibilityquiz" element={<Protected><CompatibilityQuiz /></Protected>} />
            <Route path="/compatibilityquizzes" element={<Protected><CompatibilityQuizzes /></Protected>} />
            <Route path="/dateplanner" element={<Protected><DatePlanner /></Protected>} />
            <Route path="/virtualgifts" element={<Protected><VirtualGifts /></Protected>} />
            <Route path="/speeddatinglobby" element={<Protected><SpeedDatingLobby /></Protected>} />
            <Route path="/languageexchangehub" element={<Protected><LanguageExchangeHub /></Protected>} />

            {/* Protected Monetization & Premium */}
            <Route path="/shop" element={<Protected><Shop /></Protected>} />
            <Route path="/marketplace" element={<Protected><Marketplace /></Protected>} />
            <Route path="/pricingplans" element={<Protected><PricingPlans /></Protected>} />
            <Route path="/vipeventshub" element={<Protected><VIPEventsHub /></Protected>} />
            <Route path="/submitstory" element={<Protected><SubmitStory /></Protected>} />
            <Route path="/successstorycontest" element={<Protected><SuccessStoryContest /></Protected>} />
            <Route path="/referralprogram" element={<Protected><ReferralProgram /></Protected>} />
            <Route path="/ambassadorapply" element={<Protected><AmbassadorApply /></Protected>} />
            <Route path="/ambassadorportal" element={<Protected><AmbassadorPortal /></Protected>} />

            {/* Protected Safety & Verification */}
            <Route path="/report" element={<Protected><Report /></Protected>} />
            <Route path="/safetychecksetup" element={<Protected><SafetyCheckSetup /></Protected>} />
            <Route path="/safetycheckmonitor" element={<Protected><SafetyCheckMonitor /></Protected>} />
            <Route path="/idverification" element={<Protected><IDVerification /></Protected>} />
            <Route path="/verifyphoto" element={<Protected><VerifyPhoto /></Protected>} />
            <Route path="/phoneverification" element={<Protected><PhoneVerification /></Protected>} />
            <Route path="/backgroundcheckrequest" element={<Protected><BackgroundCheckRequest /></Protected>} />

            {/* Protected Profile & Analytics */}
            <Route path="/photoperformance" element={<Protected><PhotoPerformance /></Protected>} />
            <Route path="/profileoptimization" element={<Protected><ProfileOptimization /></Protected>} />
            <Route path="/customerview" element={<Protected><CustomerView /></Protected>} />
            <Route path="/analytics" element={<Protected><Analytics /></Protected>} />

            {/* Protected Support & Legal */}
            <Route path="/support" element={<Protected><Support /></Protected>} />
            <Route path="/supportchat" element={<Protected><SupportChat /></Protected>} />
            <Route path="/legalacceptance" element={<Protected><LegalAcceptance /></Protected>} />

            {/* Protected Internal */}
            <Route path="/investorreport" element={<Protected><InvestorReport /></Protected>} />
            <Route path="/appstorecompliance" element={<Protected><AppStoreCompliance /></Protected>} />
            <Route path="/vendormanagement" element={<Protected><VendorManagement /></Protected>} />
            <Route path="/migrationcalculator" element={<Protected><MigrationCalculator /></Protected>} />
            <Route path="/migrationdocument" element={<Protected><MigrationDocument /></Protected>} />

            {/* Protected Admin — requires admin role */}
            <Route path="/admindashboard" element={<AdminProtected><AdminDashboard /></AdminProtected>} />
            <Route path="/adminusers" element={<AdminProtected><AdminUsers /></AdminProtected>} />
            <Route path="/adminmoderation" element={<AdminProtected><AdminModeration /></AdminProtected>} />
            <Route path="/adminanalytics" element={<AdminProtected><AdminAnalytics /></AdminProtected>} />
            <Route path="/adminsubscriptions" element={<AdminProtected><AdminSubscriptions /></AdminProtected>} />
            <Route path="/adminsettings" element={<AdminProtected><AdminSettings /></AdminProtected>} />
            <Route path="/adminbroadcast" element={<AdminProtected><AdminBroadcast /></AdminProtected>} />
            <Route path="/adminambassadors" element={<AdminProtected><AdminAmbassadors /></AdminProtected>} />
            <Route path="/admincontent" element={<AdminProtected><AdminContent /></AdminProtected>} />
            <Route path="/adminevents" element={<AdminProtected><AdminEvents /></AdminProtected>} />
            <Route path="/adminvipevents" element={<AdminProtected><AdminVIPEvents /></AdminProtected>} />
            <Route path="/adminfeatureflags" element={<AdminProtected><AdminFeatureFlags /></AdminProtected>} />
            <Route path="/adminmanual" element={<AdminProtected><AdminManual /></AdminProtected>} />
            <Route path="/adminlaunchchecklist" element={<AdminProtected><AdminLaunchChecklist /></AdminProtected>} />
            <Route path="/adminmarketplace" element={<AdminProtected><AdminMarketplace /></AdminProtected>} />
            <Route path="/adminauditlogs" element={<AdminProtected><AdminAuditLogs /></AdminProtected>} />

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
