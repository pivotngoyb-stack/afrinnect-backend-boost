// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle, Loader2, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from '@/components/shared/Logo';
import { validateEmail, checkRateLimit } from '@/components/auth/RateLimitGuard';
import { toast } from 'sonner';

export default function PasswordReset() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Recovery mode: user clicked the reset link from email
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    // Check if this is a recovery redirect (hash contains type=recovery)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async () => {
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setPasswordUpdated(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password. The link may have expired.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleReset = async () => {
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    const rateLimitCheck = await checkRateLimit('password_reset', email);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.error);
      return;
    }
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset`
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Recovery mode: show new password form
  if (isRecoveryMode) {
    if (passwordUpdated) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center max-w-md">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Password Updated!</h2>
            <p className="text-muted-foreground mb-6">Redirecting you to login...</p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-2xl font-bold text-foreground mt-4">Set New Password</h1>
            <p className="text-muted-foreground mt-2">Enter your new password below</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={20} />
                New Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2"
                  minLength={6}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
                  className="mt-2"
                />
              </div>
              <Button
                onClick={handleUpdatePassword}
                disabled={!newPassword || !confirmPassword || updatingPassword}
                className="w-full"
              >
                {updatingPassword ? (
                  <><Loader2 className="animate-spin mr-2" size={18} /> Updating...</>
                ) : (
                  'Update Password'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center max-w-md">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Check Your Email</h2>
          <p className="text-muted-foreground mb-6">
            We've sent password reset instructions to <strong className="text-foreground">{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <Button variant="outline" onClick={() => { setSent(false); setEmail(''); }} className="w-full">
              Try Different Email
            </Button>
            <Link to="/login">
              <Button variant="ghost" className="w-full">Back to Login</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold text-foreground mt-4">Reset Your Password</h1>
          <p className="text-muted-foreground mt-2">Enter your email to receive reset instructions</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={20} />
              Password Reset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                className="mt-2"
              />
            </div>
            <Button onClick={handleReset} disabled={!email || loading} className="w-full">
              {loading ? (
                <><Loader2 className="animate-spin mr-2" size={18} /> Sending...</>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            <div className="text-center">
              <Link to="/login">
                <Button variant="ghost" className="text-sm">
                  <ArrowLeft size={16} className="mr-2" /> Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}