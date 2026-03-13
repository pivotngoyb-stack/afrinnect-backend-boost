/**
 * Utility functions for the Afrinnect app
 */

// Create page URL helper (replaces Base44 routing)
export const createPageUrl = (pageName: string, params?: Record<string, string>): string => {
  const basePath = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
  if (!params) return basePath;
  const searchParams = new URLSearchParams(params);
  return `${basePath}?${searchParams.toString()}`;
};

// Format date to relative time
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Format currency
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Calculate age from birth date
export const calculateAge = (birthDate: string | Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Check if user is admin (placeholder - should use server-side validation)
export const isAdmin = async (): Promise<boolean> => {
  // This is a placeholder - actual admin check should be done server-side
  return false;
};

// Generate random ID
export const generateId = (): string => {
  return crypto.randomUUID();
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Snake case to title case
export const snakeToTitle = (str: string): string => {
  return str.split('_').map(capitalize).join(' ');
};
