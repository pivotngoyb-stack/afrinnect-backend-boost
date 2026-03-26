// @ts-nocheck
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

// Pages where bottom nav should NOT appear
const HIDDEN_ON = ['/', '/landing', '/login', '/waitlist', '/onboarding', '/password-reset', '/auth-flow-test'];
const HIDDEN_PREFIXES = ['/admin'];

export default function AppBottomNav() {
  const { pathname } = useLocation();

  const hidden = HIDDEN_ON.includes(pathname) || HIDDEN_PREFIXES.some(p => pathname.startsWith(p));

  if (hidden) return null;
  return <BottomNav />;
}
