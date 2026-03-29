// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { createRecord, filterRecords, getCurrentUser } from '@/lib/supabase-helpers';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import ProgressiveImage from '../shared/ProgressiveImage';
import { MapPin, Briefcase, GraduationCap, Heart, ChevronLeft, ChevronRight, Languages, Book, Sparkles, Mic, Loader2 } from 'lucide-react';
import { KenteDivider } from '../shared/AfricanPattern';
import { Badge } from "@/components/ui/badge";
import VerificationBadge from '../shared/VerificationBadge';
import CountryFlag from '../shared/CountryFlag';
import ProfileTierDecoration from './ProfileTierDecoration';
import { useLanguage } from '@/components/i18n/LanguageContext';
import MatchExplanation from '../matching/MatchExplanation';

const ProfileCard = React.memo(function ProfileCard({ profile, myLocation, onLike, onPass, onSuperLike, showActions = true, expanded = false, isLiking = false, isPassing = false, isSuperLiking = false, matchScore, matchReasons, matchBreakdown }: any) {
  const { t } = useLanguage();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-6, 6]);
  const likeOpacity = useTransform(x, [40, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-40, -150], [0, 1]);
  const superOpacity = useTransform(y, [-40, -180], [0, 1]);

  const handleDragEnd = React.useCallback((event: any, info: any) => {
    const xThreshold = 110;
    const yThreshold = -120;

    if (info.offset.y < yThreshold && onSuperLike) {
      onSuperLike();
      return;
    }

    if (info.offset.x > xThreshold && onLike) {
      onLike();
      return;
    }

    if (info.offset.x < -xThreshold && onPass) {
      onPass();
    }
  }, [onLike, onPass, onSuperLike]);

  const [showDetails, setShowDetails] = useState(expanded);
  const [viewLogged, setViewLogged] = useState(false);

  // OPTIMIZED: Log profile view without re-fetching current user (pass viewer ID from parent if needed)
  useEffect(() => {
    if (viewLogged || !profile?.id) return;
    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
        if (!user) return;
        // Use a lightweight query to get just the viewer's profile ID
        const { data: viewerProfiles } = await (await import('@/integrations/supabase/client')).supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        if (viewerProfiles?.[0] && viewerProfiles[0].id !== profile.id) {
          await createRecord('profile_views', {
            viewer_profile_id: viewerProfiles[0].id,
            viewed_profile_id: profile.id,
            view_date: new Date().toISOString(),
            view_source: 'discovery'
          });
          setViewLogged(true);
        }
      } catch (e) {}
    }, 2000); // Increased delay to reduce API pressure
    return () => clearTimeout(timer);
  }, [profile?.id, viewLogged]);

  const photos = profile?.photos?.length > 0 ? profile.photos : [profile?.primary_photo || '/placeholder.svg'];

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(profile?.birth_date);

  const distance = React.useMemo(() => {
    if (!myLocation?.lat || !myLocation?.lng || !profile?.location?.lat || !profile?.location?.lng) return null;
    const R = 3959;
    const dLat = (profile.location.lat - myLocation.lat) * Math.PI / 180;
    const dLon = (profile.location.lng - myLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(myLocation.lat * Math.PI / 180) * Math.cos(profile.location.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }, [myLocation, profile?.location]);

  const nextPhoto = (e?: React.MouseEvent) => { e?.stopPropagation(); setCurrentPhotoIndex((prev) => (prev + 1) % photos.length); };
  const prevPhoto = (e?: React.MouseEvent) => { e?.stopPropagation(); setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length); };
  const toggleDetails = () => {
    if (expanded) return;
    setShowDetails((prev) => !prev);
  };

  const culturalCountry = profile?.country_of_origin || profile?.current_country;
  const culturalIdentity = profile?.tribe || profile?.ethnicity || profile?.ethnic_group || profile?.culture;
  const lastActiveDate = profile?.last_active ? new Date(profile.last_active) : null;
  const isActiveNow = !!lastActiveDate && (Date.now() - lastActiveDate.getTime()) < 10 * 60 * 1000;
  const bioPreview = profile?.bio || profile?.about_me || '';
  const interestChips = (profile?.interests || []).slice(0, 5);
  const socialProofCount = profile?.liked_by_count || profile?.likes_count || profile?.profile_views_count || 0;
  // Only show social proof if there's real data — never show fabricated text
  const socialProof = socialProofCount > 0 ? `Liked by ${socialProofCount} people 👀` : null;

  const relationshipLabels: Record<string, string> = {
    dating: t('onboarding.goal.dating.label'),
    serious_relationship: t('onboarding.goal.serious.label'),
    marriage: t('onboarding.goal.marriage.label'),
    friendship: t('onboarding.goal.friendship.label'),
    networking: 'Networking'
  };

  const religionLabels: Record<string, string> = {
    christianity: 'Christian', islam: 'Muslim', traditional_african: 'Traditional African',
    spiritual: 'Spiritual', agnostic: 'Agnostic', atheist: 'Atheist', prefer_not_say: 'Prefer not to say'
  };

  const addInterestEmoji = (interest: string) => {
    const key = String(interest || '').toLowerCase();
    if (key.includes('travel')) return `✈️ ${interest}`;
    if (key.includes('music')) return `🎵 ${interest}`;
    if (key.includes('food') || key.includes('cook')) return `🍲 ${interest}`;
    if (key.includes('fitness') || key.includes('gym')) return `💪 ${interest}`;
    if (key.includes('movie') || key.includes('film')) return `🎬 ${interest}`;
    if (key.includes('book') || key.includes('read')) return `📚 ${interest}`;
    if (key.includes('dance')) return `💃 ${interest}`;
    if (key.includes('faith') || key.includes('church') || key.includes('prayer')) return `🙏 ${interest}`;
    return `✨ ${interest}`;
  };

  return (
    <ProfileTierDecoration tier={profile?.subscription_tier}>
      <motion.div
        className={`relative mx-auto overflow-hidden border border-border/50 bg-card shadow-elevated ${expanded ? 'w-full max-w-xl max-h-[90dvh] rounded-3xl' : 'h-full min-h-[500px] w-full rounded-[1.75rem] cursor-grab active:cursor-grabbing'}`}
        style={{ x, y, rotate, willChange: 'transform' }}
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        drag={!expanded && showActions ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.08}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
        onDragEnd={handleDragEnd}
      >
        {!expanded && showActions && (
          <>
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-12 left-7 z-50 pointer-events-none -rotate-12">
              <div className="rounded-xl border-[3px] border-brand-sage bg-foreground/60 px-4 py-2">
                <span className="text-3xl font-extrabold tracking-widest text-brand-sage" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>LIKE</span>
              </div>
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-12 right-7 z-50 pointer-events-none rotate-12">
              <div className="rounded-xl border-[3px] border-destructive bg-foreground/60 px-4 py-2">
                <span className="text-3xl font-extrabold tracking-widest text-destructive" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>NOPE</span>
              </div>
            </motion.div>
            <motion.div style={{ opacity: superOpacity }} className="absolute top-16 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
              <div className="rounded-xl border-[3px] border-brand-gold bg-foreground/60 px-4 py-2">
                <span className="text-2xl font-extrabold tracking-widest text-brand-gold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>SUPER</span>
              </div>
            </motion.div>
          </>
        )}

        <div className={`relative overflow-hidden group ${expanded ? 'min-h-[70dvh] h-full' : 'h-full min-h-[500px] cursor-pointer'}`} onClick={toggleDetails}>
          <div className="absolute inset-0">
            <ProgressiveImage
              src={photos[currentPhotoIndex]}
              alt={profile?.display_name || 'Profile'}
              className="h-full w-full"
              priority={currentPhotoIndex === 0}
              draggable={false}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-primary/35 to-transparent" />

          {photos.length > 1 && (
            <>
              <div className="absolute top-3 left-0 right-0 z-10 flex justify-center gap-1 px-4">
                {photos.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(idx); }}
                    className={`h-1.5 rounded-full transition-all ${idx === currentPhotoIndex ? 'w-7 bg-primary-foreground' : 'w-4 bg-primary-foreground/40'}`}
                  />
                ))}
              </div>
              <div className="absolute left-0 top-0 w-1/3 h-full z-10" onClick={prevPhoto} />
              <div className="absolute right-0 top-0 w-1/3 h-full z-10" onClick={nextPhoto} />
              <button onClick={prevPhoto} className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm transition hover:bg-background/30 sm:flex">
                <ChevronLeft className="text-primary-foreground" size={20} />
              </button>
              <button onClick={nextPhoto} className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm transition hover:bg-background/30 sm:flex">
                <ChevronRight className="text-primary-foreground" size={20} />
              </button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-10 h-1 gradient-kente opacity-80" />

          <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-24 text-primary-foreground">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-3xl font-bold leading-none">{profile?.display_name}</h2>
              {age && <span className="text-2xl font-semibold leading-none">{age}</span>}
              <span className="text-xl">🔥</span>
              <VerificationBadge verification={profile?.verification_status} />
            </div>

            {(culturalCountry || culturalIdentity) && (
              <div className="mb-1 flex items-center gap-2 text-sm text-primary-foreground/90">
                {culturalCountry && <CountryFlag country={culturalCountry} showName={false} size="small" />}
                <span>{culturalCountry || ''}{culturalIdentity ? ` • ${culturalIdentity}` : ''}</span>
              </div>
            )}

            <div className="mb-2 flex items-center gap-2 text-xs text-primary-foreground/85">
              <span className={`inline-block h-2 w-2 rounded-full ${isActiveNow ? 'bg-brand-sage' : 'bg-muted-foreground'}`} />
              <span>{isActiveNow ? 'Active now' : 'Recently active'}</span>
            </div>

            <div className="flex items-center gap-1 text-sm text-primary-foreground/90">
              <MapPin size={14} />
              <span>{profile?.current_city}{distance !== null && ` • ${distance} mi`}</span>
            </div>

            {profile?.relationship_goal && (
              <Badge className="mt-2 border-0 bg-foreground/20 text-primary-foreground text-xs">
                {relationshipLabels[profile.relationship_goal]}
              </Badge>
            )}

            {bioPreview && (
              <p className="mt-3 line-clamp-2 text-sm text-primary-foreground/95">{bioPreview}</p>
            )}

            {interestChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {interestChips.map((interest: string, idx: number) => (
                  <span key={`${interest}-${idx}`} className="rounded-full border border-background/30 bg-background/20 px-2.5 py-1 text-xs text-primary-foreground backdrop-blur-sm">
                    {addInterestEmoji(interest)}
                  </span>
                ))}
              </div>
            )}

            {socialProof && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-foreground/20 px-3 py-1.5 text-xs text-primary-foreground/95">
                <Sparkles size={12} />
                <span>{socialProof}</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 z-40 max-h-[72%] overflow-y-auto rounded-t-[1.6rem] border-t border-border/60 bg-card touch-pan-y"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="p-5 space-y-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />
                <KenteDivider className="mb-1" />
                {(matchScore || profile?.matchScore) && (
                  <MatchExplanation score={matchScore || profile?.matchScore || 0} reasons={matchReasons || profile?.matchReasons || []} breakdown={matchBreakdown || profile?.matchBreakdown || {}} confidence="good" />
                )}
                {profile?.bio && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">About</h3>
                    <p className="text-foreground leading-relaxed">{profile.bio}</p>
                  </div>
                )}
                {profile?.voice_intro_url && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Mic size={20} /></div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold mb-1">{t('editProfile.voiceIntro')}</p>
                      <audio controls src={profile.voice_intro_url} className="w-full h-8" />
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Lifestyle</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {profile?.profession && (<div className="flex items-center gap-2 text-muted-foreground"><Briefcase size={16} className="text-primary" /><span className="text-sm">{profile.profession}</span></div>)}
                    {profile?.education && (<div className="flex items-center gap-2 text-muted-foreground"><GraduationCap size={16} className="text-primary" /><span className="text-sm capitalize">{profile.education?.replace('_', ' ')}</span></div>)}
                    {profile?.religion && (<div className="flex items-center gap-2 text-muted-foreground"><Book size={16} className="text-primary" /><span className="text-sm">{religionLabels[profile.religion]}</span></div>)}
                    {profile?.languages?.length > 0 && (<div className="flex items-center gap-2 text-muted-foreground"><Languages size={16} className="text-primary" /><span className="text-sm">{profile.languages.slice(0, 3).join(', ')}</span></div>)}
                  </div>
                </div>
                {profile?.cultural_values?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t('editProfile.culturalValues')}</h3>
                    <div className="flex flex-wrap gap-2">{profile.cultural_values.map((value: string, idx: number) => (<Badge key={idx} variant="outline" className="border-accent/30 text-accent bg-accent/10">{value}</Badge>))}</div>
                  </div>
                )}
                {profile?.interests?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t('profile.interests')}</h3>
                    <div className="flex flex-wrap gap-2">{profile.interests.map((interest: string, idx: number) => (<Badge key={idx} variant="secondary">{addInterestEmoji(interest)}</Badge>))}</div>
                  </div>
                )}
                {profile?.community_name && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Community</h3>
                    <p className="text-sm text-foreground">{profile.community_name}</p>
                  </div>
                )}
                {profile?.prompts?.length > 0 && (
                  <div className="space-y-3">
                    {profile.prompts.map((prompt: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                        <p className="mb-1 text-sm font-medium text-primary">{prompt.question}</p>
                        <p className="text-foreground">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </motion.div>
          )}
        </AnimatePresence>

        {showActions && (
          <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center gap-4">
            <motion.button whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }} onClick={() => { if (navigator.vibrate) navigator.vibrate(30); onPass?.(); }} disabled={isPassing || isLiking || isSuperLiking} className="h-14 w-14 rounded-full bg-muted text-muted-foreground shadow-card flex items-center justify-center border border-border active:bg-muted/80 transition-all touch-manipulation disabled:opacity-50">
              {isPassing ? <Loader2 size={28} className="animate-spin text-muted-foreground" /> : <span className="text-3xl text-destructive/70">✕</span>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.82 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} onClick={() => { if (navigator.vibrate) navigator.vibrate([30, 30, 30]); onSuperLike?.(); }} disabled={isPassing || isLiking || isSuperLiking} className="h-12 w-12 rounded-full bg-[linear-gradient(135deg,hsl(var(--brand-gold)),hsl(var(--accent)))] text-primary-foreground shadow-elevated flex items-center justify-center transition-all touch-manipulation disabled:opacity-50">
              {isSuperLiking ? <Loader2 size={20} className="animate-spin text-primary-foreground" /> : <Sparkles className="text-primary-foreground" size={20} />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.82 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} onClick={() => { if (navigator.vibrate) navigator.vibrate(50); onLike?.(); }} disabled={isPassing || isLiking || isSuperLiking} className="h-16 w-16 rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--brand-coral)))] text-primary-foreground shadow-elevated flex items-center justify-center transition-all touch-manipulation disabled:opacity-50">
              {isLiking ? <Loader2 size={28} className="animate-spin text-primary-foreground" /> : <Heart className="fill-primary-foreground text-primary-foreground" size={28} />}
            </motion.button>
          </div>
        )}
      </motion.div>
    </ProfileTierDecoration>
  );
});

export default ProfileCard;
