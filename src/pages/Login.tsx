// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { sanitizeRedirectTarget } from '@/lib/auth-redirect';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Heart, Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import LanguageSelector from '@/components/i18n/LanguageSelector';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const redirectingRef = useRef(false);

  const handlePostLogin = useCallback(async (user) => {
    if (!user || redirectingRef.current) return;

    redirectingRef.current = true;

    try {
      const { data: acceptances } = await supabase
        .from('legal_acceptances')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!acceptances || acceptances.length === 0) {
        navigate('/legalacceptance', { replace: true });
        return;
      }

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        navigate('/onboarding', { replace: true });
      } else if (nextUrl) {
        navigate(sanitizeRedirectTarget(nextUrl, '/home'), { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch {
      navigate('/home', { replace: true });
    }
  }, [navigate, nextUrl]);

  useEffect(() => {
    let mounted = true;

    const syncAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted || !session?.user) return;
      void handlePostLogin(session.user);
    };

    void syncAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || !session?.user) return;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queueMicrotask(() => {
          void handlePostLogin(session.user);
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handlePostLogin]);

  const handleOAuthError = (error, provider) => {
    if (
      error?.message?.toLowerCase().includes('cancel') ||
      error?.message?.toLowerCase().includes('popup_closed') ||
      error?.message?.toLowerCase().includes('user_denied') ||
      error?.message?.toLowerCase().includes('access_denied')
    ) return;
    if (
      error?.message?.toLowerCase().includes('network') ||
      error?.message?.toLowerCase().includes('fetch') ||
      error?.message?.toLowerCase().includes('timeout')
    ) {
      toast.error(t('common.loading'));
      return;
    }
    toast.error(t('common.loading'));
    console.error(`${provider} sign-in error:`, error);
  };

  const getRedirectUri = () => {
    if (Capacitor.isNativePlatform()) {
      return 'app.lovable.74bc1c05193745c29046d75ca322d135://';
    }
    return window.location.origin;
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: getRedirectUri() });
      
      if (result?.error) {
        handleOAuthError(result.error, 'Apple');
        return;
      }
      
      if (result?.redirected) {
        // Browser will redirect to Apple — just return and let it happen
        return;
      }
      
      // Tokens received and session set — user is authenticated
      // onAuthStateChange will handle the redirect
    } catch (error) {
      handleOAuthError(error, 'Apple');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: getRedirectUri() });
      
      if (result?.error) {
        handleOAuthError(result.error, 'Google');
        return;
      }
      
      if (result?.redirected) {
        return;
      }
    } catch (error) {
      handleOAuthError(error, 'Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success(t('auth.welcomeBack'));
    } catch (error) {
      toast.error(error.message || t('common.loading'));
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!ageConfirmed) {
      toast.error(t('auth.ageConfirm'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;
      setVerificationSent(true);
    } catch (error) {
      toast.error(error.message || t('common.loading'));
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast.success(t('auth.resendVerification'));
    } catch (error) {
      toast.error(error.message || t('common.loading'));
    }
    setResending(false);
  };

  const anyLoading = loading || googleLoading || appleLoading;

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t('auth.checkEmail')}</CardTitle>
            <CardDescription className="mt-2">
              {t('auth.verificationSent')} <strong className="text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p>📧 {t('auth.openEmailApp')}</p>
              <p>📁 {t('auth.checkSpam')}</p>
              <p>⏱️ {t('auth.linkExpires')}</p>
            </div>

            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full gap-2"
              disabled={resending}
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t('auth.resendVerification')}
            </Button>

            <Button
              onClick={() => { setVerificationSent(false); setEmail(''); setPassword(''); setFullName(''); }}
              variant="ghost"
              className="w-full gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.useDifferentEmail')}
            </Button>

            <div className="text-center">
              <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {t('auth.openGmail')} →
              </a>
              <span className="mx-2 text-muted-foreground">|</span>
              <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {t('auth.openOutlook')} →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start">
            <div />
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">{t('auth.title')}</CardTitle>
              <CardDescription>{t('auth.subtitle')}</CardDescription>
            </div>
            <LanguageSelector />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <Button type="button" variant="outline" className="w-full gap-2" disabled={anyLoading} onClick={handleGoogleSignIn}>
              {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
              {t('auth.continueWithGoogle')}
            </Button>
            <Button type="button" variant="outline" className="w-full gap-2" disabled={anyLoading} onClick={handleAppleSignIn}>
              {appleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              )}
              {t('auth.continueWithApple')}
            </Button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWithEmail')}</span></div>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.logIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={anyLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.password')}</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={anyLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={anyLoading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t('auth.loggingIn')}</> : t('auth.logIn')}
                </Button>
                <Button type="button" variant="link" className="w-full" onClick={() => navigate('/password-reset')} disabled={anyLoading}>
                  {t('auth.forgotPassword')}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                  <Input id="signup-name" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={anyLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={anyLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={anyLoading} />
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="age-confirm-signup" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border" disabled={anyLoading} />
                   <label htmlFor="age-confirm-signup" className="text-xs text-muted-foreground leading-tight">
                    {t('auth.ageConfirm')}{' '}
                    <a href="/terms" className="text-primary underline">{t('auth.termsOfService')}</a>{' & '}
                    <a href="/privacy" className="text-primary underline">{t('auth.privacyPolicy') || 'Privacy Policy'}</a>.
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={anyLoading || !ageConfirmed}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t('auth.creatingAccount')}</> : t('auth.signUp')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}