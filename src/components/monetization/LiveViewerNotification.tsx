import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Crown, Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';

interface LiveViewerNotificationProps {
  userProfileId: string;
  isPremium?: boolean;
  className?: string;
}

export default function LiveViewerNotification({ 
  userProfileId,
  isPremium = false,
  className = "" 
}: LiveViewerNotificationProps) {
  const [viewer, setViewer] = useState<{ name: string; photo?: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!userProfileId) return;

    // Subscribe to realtime profile_views for this user
    const channel = supabase
      .channel(`profile-views-${userProfileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_views',
          filter: `viewed_profile_id=eq.${userProfileId}`,
        },
        async (payload) => {
          const viewerProfileId = payload.new?.viewer_profile_id;
          if (!viewerProfileId) return;

          // Fetch viewer's basic info
          const { data: viewerProfile } = await supabase
            .from('user_profiles')
            .select('display_name, primary_photo')
            .eq('id', viewerProfileId)
            .single();

          if (viewerProfile) {
            setViewer({
              name: viewerProfile.full_name || 'Someone',
              photo: viewerProfile.profile_photo || undefined,
            });
            setIsVisible(true);

            // Auto-dismiss after 10s
            setTimeout(() => setIsVisible(false), 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfileId]);

  const handleDismiss = () => setIsVisible(false);

  return (
    <AnimatePresence>
      {isVisible && viewer && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 ${className}`}
        >
          <div className="bg-background rounded-2xl shadow-2xl border overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1.5 flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-card rounded-full"
              />
              <span className="text-white text-xs font-semibold uppercase tracking-wide">
                Profile View
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-purple-200 ${!isPremium ? 'relative' : ''}`}>
                    {isPremium ? (
                      <img
                        src={viewer.photo || '/default-avatar.png'}
                        alt={viewer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300 blur-lg" />
                        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                          <Lock size={20} className="text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                    <Eye size={12} className="text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-bold">
                    {isPremium ? viewer.name : 'Someone'} viewed your profile
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isPremium ? 'Check out their profile!' : 'Upgrade to see who'}
                  </p>

                  {!isPremium && (
                    <Link to={createPageUrl('PricingPlans')}>
                      <Button size="sm" className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        <Crown size={14} className="mr-1" />
                        Reveal Viewer
                      </Button>
                    </Link>
                  )}
                </div>

                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
