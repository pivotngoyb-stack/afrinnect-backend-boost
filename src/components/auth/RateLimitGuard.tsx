import { supabase } from '@/integrations/supabase/client';

export const checkRateLimit = async (action: string, identifier: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limit-auth', {
      body: { action, identifier }
    });
    if (error) {
      console.warn('Rate limit check failed:', error);
      return { allowed: true };
    }
    return data;
  } catch (error: any) {
    if (error?.response?.status === 429) {
      return {
        allowed: false,
        error: error.response.data?.error || 'Too many attempts. Please try again later.'
      };
    }
    console.warn('Rate limit check failed:', error);
    return { allowed: true };
  }
};

export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return 'unknown';
  }
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^\+\d{10,15}$/;
  return re.test(phone);
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must contain lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain a number' };
  return { valid: true };
};
