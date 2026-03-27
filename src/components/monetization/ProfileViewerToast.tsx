import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Crown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function ProfileViewerToast({ userProfile }: { userProfile: any }) {
  const [visible, setVisible] = useState(false);
  const [viewerName, setViewerName] = useState('');
  const [recentViewCount, setRecentViewCount] = useState(0);

  const tier = userProfile?.subscription_tier || 'free';
  const isPaid = ['premium', 'elite', 'vip'].includes(tier);

  useEffect(() => {
    if (!userProfile?.id) return;

    const checkRecentViews = async () => {
      try {
        // Get views from the last 24 hours
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: views, error } = await supabase
          .from('profile_views')
          .select('viewer_profile_id, created_at')
          .eq('viewed_profile_id', userProfile.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error || !views || views.length === 0) return;

        setRecentViewCount(views.length);

        // For premium users, fetch the most recent viewer's name
        if (isPaid && views[0]) {
          const { data: viewerProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', views[0].viewer_profile_id)
            .maybeSingle();

          setViewerName(viewerProfile?.display_name || 'Someone');
        } else {
          setViewerName('Someone');
        }

        setVisible(true);
        setTimeout(() => setVisible(false), 8000);
      } catch {
        // Silently fail
      }
    };

    // Check after a short delay so it doesn't fire immediately on mount
    const timer = setTimeout(checkRecentViews, 5000);
    return () => clearTimeout(timer);
  }, [userProfile?.id, isPaid]);

  if (!userProfile || recentViewCount === 0) return null;

  const message = isPaid
    ? `${viewerName} viewed your profile`
    : `${recentViewCount} ${recentViewCount === 1 ? 'person' : 'people'} viewed your profile recently`;

  const subtitle = isPaid
    ? 'Tap to see who checked you out'
    : 'Upgrade to see who\'s interested';

  const destination = isPaid ? '/who-likes-you' : createPageUrl('PricingPlans');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, x: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="fixed bottom-28 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-pink-500/5" />
            
            <button
              onClick={() => setVisible(false)}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full"
            >
              <X size={14} />
            </button>

            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shrink-0">
                <Eye size={20} className="text-primary-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>

            {!isPaid && (
              <Link to={destination}>
                <Button size="sm" className="w-full mt-3 gap-1.5">
                  <Crown size={14} />
                  See Who's Looking
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
