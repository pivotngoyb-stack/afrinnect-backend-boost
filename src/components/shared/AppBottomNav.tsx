import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

// Pages where bottom nav should NOT appear
const HIDDEN_ON = ['/', '/landing', '/login', '/waitlist', '/onboarding', '/password-reset', '/auth-flow-test', '/chat', '/eventchat', '/communitychat', '/supportchat'];
const HIDDEN_PREFIXES = ['/admin'];

const AppBottomNav = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { pathname } = useLocation();

  const hidden = HIDDEN_ON.includes(pathname) || HIDDEN_PREFIXES.some(p => pathname.startsWith(p));

  if (hidden) return null;
  return <BottomNav ref={ref} />;
});

AppBottomNav.displayName = 'AppBottomNav';

export default AppBottomNav;
