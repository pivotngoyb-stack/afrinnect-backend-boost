// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { filterRecords, getCurrentUser, invokeFunction, logout, updateRecord } from '@/lib/supabase-helpers';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft, Bell, Lock, Eye, Shield, Globe, Moon, Sun,
  HelpCircle, FileText, LogOut, Trash2, ChevronRight, Download, Smartphone, Loader2, Crown, EyeOff, ShoppingBag
} from 'lucide-react';
import FoundingMemberStatus from '@/components/subscription/FoundingMemberStatus';
import IncognitoModeToggle from '@/components/monetization/IncognitoModeToggle';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/components/i18n/LanguageContext';
import LanguageSelector from '@/components/i18n/LanguageSelector';

export default function Settings() {
  const { t } = useLanguage();
  const [myProfile, setMyProfile] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Load settings from localStorage
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('app_settings');
      return saved ? JSON.parse(saved) : {
        notifications: true,
        emailNotifications: true,
        showDistance: true,
        showLastActive: true,
        darkMode: false
      };
    } catch {
      return {
        notifications: true,
        emailNotifications: true,
        showDistance: true,
        showLastActive: true,
        darkMode: false
      };
    }
  };

  const [settings, setSettings] = useState(loadSettings());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [_exportingData, _setExportingData] = useState(false); // Reserved for future use
  const [showEmailVerifyDialog, setShowEmailVerifyDialog] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [deviceToRemove, setDeviceToRemove] = useState(null);
  const [isRemovingDevice, setIsRemovingDevice] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserEmail(user.email || '');
          const profiles = await filterRecords('user_profiles', { user_id: user.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }
      } catch (e) {
        console.log('Not logged in');
        window.location.href = '/login'; // redirectToLogin(createPageUrl('Landing'));
      }
    };
    fetchProfile();
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
    
    // Apply dark mode
    if (key === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Apply dark mode on mount
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [settings.darkMode]);

  const handleLogout = async () => {
    await logout(createPageUrl('Landing'));
  };

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const user = await getCurrentUser();
      
      // Collect all user data (GDPR compliant)
      const profile = await filterRecords('user_profiles', { user_id: user.id });
      
      // Fetch matches using two queries (no $or support)
      const matches1 = await filterRecords('matches', { user1_user_id: user.id });
      const matches2 = await filterRecords('matches', { user2_user_id: user.id });
      const matches = [...matches1, ...matches2];
      
      // Fetch messages using two queries
      const sentMessages = await filterRecords('messages', { sender_user_id: user.id });
      const receivedMessages = await filterRecords('messages', { receiver_user_id: user.id });
      const messages = [...sentMessages, ...receivedMessages];
      
      const likes = await filterRecords('likes', { liker_user_id: user.id });
      
      let subscriptions = [];
      if (myProfile?.id) {
        try {
          subscriptions = await filterRecords('subscriptions', { user_profile_id: myProfile.id });
        } catch (e) { /* may fail due to RLS */ }
      }
      
      const exportData = {
        exported_at: new Date().toISOString(),
        user: {
          email: user.email,
          full_name: user.full_name,
        },
        profile: profile[0] || null,
        matches: matches,
        messages: messages.map(m => ({ ...m, content: m.content })),
        likes_sent: likes,
        subscriptions: subscriptions
      };
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afrinnect-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await invokeFunction('deleteAccount', { reason: 'Deleted from settings', confirmDelete: true });
      await logout(createPageUrl('Landing'));
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">{t('settingsPage.title')}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Founding Member Status */}
        {myProfile?.is_founding_member && (
          <FoundingMemberStatus profile={myProfile} />
        )}

        {/* Account */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock size={18} className="text-purple-600" />
              {t('settingsPage.account')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to={createPageUrl('EditProfile')} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.editProfile')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
            
            <Separator />

            <Link to={createPageUrl('PhoneVerification')} className="flex items-center justify-between py-2">
              <div>
                <span className="text-gray-700 block">{t('settingsPage.phoneNumber')}</span>
                <span className="text-sm text-gray-500">
                  {myProfile?.verification_status?.phone_verified ? t('settingsPage.verified') : t('settingsPage.notVerified')}
                </span>
              </div>
              {myProfile?.verification_status?.phone_verified ? (
                <Shield size={18} className="text-green-500" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </Link>

            <Separator />

            {/* Device Management */}
            <div className="py-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-gray-700 block">{t('settingsPage.activeDevices')}</span>
                  <span className="text-sm text-gray-500">
                    {myProfile?.device_ids?.length || 0} / 4 {t('settingsPage.devicesUsed')}
                  </span>
                </div>
                <Smartphone size={18} className="text-purple-600" />
              </div>
              
              {myProfile?.device_info?.length > 0 && (
                <div className="space-y-2 mt-2">
                  {myProfile.device_info.map((device, idx) => {
                    const isCurrentDevice = localStorage.getItem('device_id') === device.device_id;
                    return (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                        <div className="overflow-hidden">
                          <p className="font-medium truncate pr-2">
                            {device.device_name}
                            {isCurrentDevice && <span className="text-purple-600 ml-1">({t('settingsPage.current')})</span>}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t('settingsPage.lastLogin')}: {new Date(device.last_login).toLocaleDateString()}
                          </p>
                        </div>
                        <button 
                          onClick={() => setDeviceToRemove(device)}
                          className="text-red-500 text-xs hover:underline whitespace-nowrap ml-2"
                        >
                          {t('common.remove')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            <button onClick={async () => {
              if (myProfile?.verification_status?.email_verified) return;
              
              setIsSendingCode(true);
              
              try {
                const res = await invokeFunction('sendOTP', { email: userEmail });
                if (res.data.success) {
                  setShowEmailVerifyDialog(true);
                } else {
                  toast({ title: res.data.error || "Failed to send code", variant: 'destructive' });
                }
              } catch (e) {
                toast({ title: "Failed to send email. Please try again.", variant: 'destructive' });
              } finally {
                setIsSendingCode(false);
              }
            }} className="flex items-center justify-between py-2 w-full text-left" disabled={isSendingCode || myProfile?.verification_status?.email_verified}>
              <div>
                <span className="text-gray-700 block">{t('settingsPage.emailLabel')}</span>
                <span className="text-sm text-gray-500">
                  {myProfile?.verification_status?.email_verified ? t('settingsPage.verified') : isSendingCode ? t('settingsPage.sendingCode') : t('settingsPage.verifyNow')}
                </span>
              </div>
              {myProfile?.verification_status?.email_verified ? (
                <Shield size={18} className="text-green-500" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe size={18} className="text-purple-600" />
              {t('settingsPage.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label className="text-gray-700">{t('settingsPage.changeLanguage')}</Label>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell size={18} className="text-purple-600" />
              {t('settingsPage.notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push" className="text-gray-700">{t('settingsPage.pushNotifications')}</Label>
              <Switch
                id="push"
                checked={settings.notifications}
                onCheckedChange={(v) => updateSetting('notifications', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email" className="text-gray-700 block">{t('settingsPage.emailNotifications')}</Label>
                <span className="text-xs text-gray-500">{t('settingsPage.emailNotificationsDesc')}</span>
              </div>
              <Switch
                id="email"
                checked={settings.emailNotifications}
                onCheckedChange={(v) => updateSetting('emailNotifications', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} className="text-purple-600" />
              {t('settingsPage.privacy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="distance" className="text-gray-700 block">{t('settingsPage.showDistance')}</Label>
                <span className="text-xs text-gray-500">{t('settingsPage.showDistanceDesc')}</span>
              </div>
              <Switch
                id="distance"
                checked={settings.showDistance}
                onCheckedChange={(v) => updateSetting('showDistance', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lastActive" className="text-gray-700 block">{t('settingsPage.showLastActive')}</Label>
                <span className="text-xs text-gray-500">{t('settingsPage.showLastActiveDesc')}</span>
              </div>
              <Switch
                id="lastActive"
                checked={settings.showLastActive}
                onCheckedChange={(v) => updateSetting('showLastActive', v)}
              />
            </div>

            <Separator />

            <Link to={createPageUrl('BlockedUsers')} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.blockedUsers')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>

            <Separator />

            {/* Incognito Mode */}
            <IncognitoModeToggle 
              userProfile={myProfile} 
              onUpdate={(updated) => setMyProfile(updated)}
            />
          </CardContent>
        </Card>

        {/* Shop */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-4">
            <Link to={createPageUrl('Shop')} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block">{t('settingsPage.shop')}</span>
                  <span className="text-xs text-gray-500">{t('settingsPage.shopDesc')}</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-purple-600" />
            </Link>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {settings.darkMode ? <Moon size={18} className="text-purple-600" /> : <Sun size={18} className="text-purple-600" />}
              {t('settingsPage.appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="text-gray-700">{t('settingsPage.darkMode')}</Label>
              <Switch
                id="darkMode"
                checked={settings.darkMode}
                onCheckedChange={(v) => updateSetting('darkMode', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discovery */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe size={18} className="text-purple-600" />
              {t('settingsPage.discovery')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={createPageUrl('Home')} className="flex items-center justify-between py-2">
              <div>
                <span className="text-gray-700 block">{t('settingsPage.discoveryPreferences')}</span>
                <span className="text-xs text-gray-500">{t('settingsPage.discoveryPreferencesDesc')}</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
            
            <Separator />
            
            <Link to={createPageUrl('PricingPlans')} className="flex items-center justify-between py-2">
              <div>
                <span className="text-gray-700 block">{t('settingsPage.subscriptionPricing')}</span>
                <span className="text-xs text-gray-500">{t('settingsPage.managePlan')}</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
            
            {/* Cancel Subscription - only if active */}
            {myProfile?.subscription_tier && myProfile.subscription_tier !== 'free' && (
              <>
                <Separator />
                <button
                  onClick={async () => {
                  if (!confirm(t('settingsPage.cancelSubConfirm'))) return;
                    
                    try {
                      const res = await invokeFunction('cancelSubscription', { immediate: false });
                      if (res.data.success) {
                        toast({ title: t('settingsPage.cancelSubscription') });
                      } else {
                        toast({ title: res.data.error || t('settingsPage.cancelSubscription'), variant: 'destructive' });
                      }
                    } catch (e) {
                      toast({ title: t('settingsPage.cancelSubscription'), variant: 'destructive' });
                    }
                  }}
                  className="flex items-center justify-between py-2 w-full text-left text-red-600"
                >
                  <div>
                    <span className="block">{t('settingsPage.cancelSubscription')}</span>
                    <span className="text-xs text-red-400">{t('settingsPage.cancelSubDesc')}</span>
                  </div>
                  <ChevronRight size={20} className="text-red-400" />
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle size={18} className="text-purple-600" />
              {t('settingsPage.support')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to={createPageUrl('SupportChat')} className="flex items-center justify-between py-2 bg-purple-50 rounded-lg px-3 -mx-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center">
                  <span className="text-white text-sm">✨</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium block">{t('settingsPage.chatWithAI')}</span>
                  <span className="text-xs text-purple-600">{t('settingsPage.getInstantHelp')}</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-purple-600" />
            </Link>

            <Separator />

            <Link to={createPageUrl('Support')} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.supportTickets')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>

            <Separator />

            <a href="mailto:support@afrinnect.com" className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.contactUs')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </a>

            <Separator />

            <Link to={createPageUrl('CommunityGuidelines')} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.safetyTips')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              {t('settingsPage.legal')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to={createPageUrl('Privacy')} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.privacyPolicy')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>

            <Separator />

            <Link to={createPageUrl('Terms')} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.termsOfService')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>

            <Separator />

            <Link to={createPageUrl('CommunityGuidelines')} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{t('settingsPage.communityGuidelines')}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>

            <Separator />

            <button
              onClick={() => exportDataMutation.mutate()}
              disabled={exportDataMutation.isPending}
              className="flex items-center justify-between py-2 w-full text-left"
            >
              <div>
                <span className="text-gray-700 block">{t('settingsPage.downloadMyData')}</span>
                <span className="text-xs text-gray-500">
                  {exportDataMutation.isPending ? t('settingsPage.preparingDownload') : t('settingsPage.gdprExport')}
                </span>
              </div>
              {exportDataMutation.isPending ? (
                <Loader2 size={20} className="text-purple-600 animate-spin" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>
          </CardContent>
        </Card>

        {/* Delete Account - Apple App Store Requirement (Prominent Placement) */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <Trash2 size={18} />
              {t('settingsPage.accountDeletion')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">
              {t('settingsPage.deleteAccountDesc')}
            </p>
            <Link to={createPageUrl('DeleteAccount')}>
              <Button variant="destructive" className="w-full">
                <Trash2 size={18} className="mr-2" />
                {t('settingsPage.deleteMyAccount')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="space-y-3">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut size={18} className="mr-2" />
            {t('settingsPage.logOut')}
          </Button>
        </div>

        {/* App Version */}
        <p className="text-center text-gray-400 text-xs">
          Afrinnect v1.0.1 (Build 2024.02)
        </p>
      </main>

      {/* Email Verification Dialog */}
      <AlertDialog open={showEmailVerifyDialog} onOpenChange={setShowEmailVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settingsPage.verifyEmail')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settingsPage.verifyEmailDesc')} {userEmail}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="123456"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowEmailVerifyDialog(false); setInputCode(""); }}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={async (e) => {
              e.preventDefault(); // Prevent auto-close
              try {
                const res = await invokeFunction('verifyOTP', { code: inputCode, type: 'email' });
                
                if (res.data.success) {
                  setMyProfile({
                    ...myProfile,
                    verification_status: {
                      ...myProfile.verification_status,
                      email_verified: true
                    }
                  });
                  toast({ title: "Email verified successfully!" });
                  setShowEmailVerifyDialog(false);
                  setInputCode("");
                } else {
                  toast({ title: res.data.error || "Invalid code", variant: 'destructive' });
                }
              } catch (err) {
                toast({ title: "Verification failed. Please try again.", variant: 'destructive' });
              }
            }}>
              Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your profile, matches, and messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Device Dialog */}
      <AlertDialog open={!!deviceToRemove} onOpenChange={(open) => !open && setDeviceToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deviceToRemove?.device_name}"? You will be logged out on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovingDevice}
              onClick={async (e) => {
                e.preventDefault(); // Prevent auto-close
                if (!deviceToRemove) return;
                
                setIsRemovingDevice(true);
                const device = deviceToRemove;
                const isCurrentDevice = localStorage.getItem('device_id') === device.device_id;
                
                // Store previous state for revert
                const previousProfile = { ...myProfile };
                
                // Optimistic update
                const newIds = myProfile.device_ids.filter(id => id !== device.device_id);
                const newInfo = myProfile.device_info.filter(d => d.device_id !== device.device_id);
                
                setMyProfile({
                  ...myProfile,
                  device_ids: newIds,
                  device_info: newInfo
                });
                
                try {
                  await updateRecord('user_profiles', myProfile.id, {
                    device_ids: newIds,
                    device_info: newInfo
                  });

                  if (isCurrentDevice) {
                    await logout(createPageUrl('Landing'));
                  }
                  setDeviceToRemove(null);
                } catch (e) {
                  console.error('Failed to remove device', e);
                  setMyProfile(previousProfile); // Revert local state
                } finally {
                  setIsRemovingDevice(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemovingDevice ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}