
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  let cleaned = text.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');
  return cleaned.trim();
};

export const blockLinks = (text: string): string => {
  if (!text) return '';
  return text.replace(/https?:\/\/[^\s]+/gi, '[link removed for safety]');
};

export const containsHarmfulContent = (text: string): boolean => {
  const harmful = [/<script/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i, /<embed/i, /<object/i];
  return harmful.some(pattern => pattern.test(text));
};

export const validateInput = {
  email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone: string) => /^\+?[\d\s\-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10,
  url: (url: string) => { try { new URL(url); return true; } catch { return false; } },
  length: (text: string, min = 1, max = 1000) => { const l = text?.length || 0; return l >= min && l <= max; },
  noSpam: (text: string) => !(/(.)\1{10,}/.test(text)) && !(/(\b\w+\b)(?:\s+\1){5,}/i.test(text))
};

export const rateLimiter = (key: string, limit = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;
  let data = JSON.parse(localStorage.getItem(storageKey) || '{"attempts": [], "blocked": false}');
  data.attempts = data.attempts.filter((t: number) => now - t < windowMs);
  if (data.attempts.length >= limit) { data.blocked = true; localStorage.setItem(storageKey, JSON.stringify(data)); return false; }
  data.attempts.push(now); data.blocked = false; localStorage.setItem(storageKey, JSON.stringify(data));
  return true;
};
