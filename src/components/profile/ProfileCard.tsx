// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { createRecord, filterRecords, getCurrentUser } from '@/lib/supabase-helpers';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Briefcase, GraduationCap, Heart, ChevronLeft, ChevronRight, Languages, Book, Sparkles, Mic, Loader2, Crown } from 'lucide-react';
import { KenteDivider } from '../shared/AfricanPattern';
import { Badge } from "@/components/ui/badge";
import VerificationBadge from '../shared/VerificationBadge';
import CountryFlag from '../shared/CountryFlag';
import ProfileBadges from './ProfileBadges';
import ProfileTierDecoration from './ProfileTierDecoration';
import { useLanguage } from '@/components/i18n/LanguageContext';
import MatchExplanation from '../matching/MatchExplanation';

const ProfileCard = React.memo(function ProfileCard({ profile, myLocation, onLike, onPass, onSuperLike, showActions = true, expanded = false, isLiking = false, isPassing = false, isSuperLiking = false, matchScore, matchReasons, matchBreakdown }: any) {
  const { t } = useLanguage();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);
  const borderColor = useTransform(x, [-150, 0, 150], ['#ef4444', 'rgba(0,0,0,0)', '#22c55e']);

  const handleDragEnd = React.useCallback((event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold && onLike) onLike();
    else if (info.offset.x < -threshold && onPass) onPass();
  }, [onLike, onPass]);

  const [showDetails, setShowDetails] = useState(expanded);
  const [viewLogged, setViewLogged] = useState(false);

  useEffect(() => {
    if (viewLogged || !profile?.id) return;
    const timer = setTimeout(async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        const profiles = await filterRecords('user_profiles', { user_id: user.id });
        if (profiles.length > 0 && profiles[0].id !== profile.id) {
          await createRecord('profile_views', {
            viewer_profile_id: profiles[0].id,
            viewed_profile_id: profile.id,
            view_date: new Date().toISOString(),
            view_source: 'discovery'
          });
          setViewLogged(true);
        }
      } catch (e) {}
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile?.id, viewLogged]);

  const photos = profile?.photos?.length > 0 ? profile.photos : [profile?.primary_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'];

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

  return (
    <ProfileTierDecoration tier={profile?.subscription_tier}>
      <motion.div
        className="relative w-full max-w-[90vw] sm:max-w-md mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ x, rotate, maxHeight: 'calc(100dvh - 120px)', borderColor, borderWidth: expanded ? 0 : 2 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        drag={!expanded && showActions ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
      >
        {!expanded && showActions && (
          <>
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-8 z-50 pointer-events-none transform -rotate-12">
              <div className="border-4 border-green-500 rounded-xl px-4 py-2 bg-black/20 backdrop-blur-sm">
                <span className="text-4xl font-extrabold text-green-500 tracking-widest">{t('admin.common.like').toUpperCase()}</span>
              </div>
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-8 z-50 pointer-events-none transform rotate-12">
              <div className="border-4 border-destructive rounded-xl px-4 py-2 bg-black/20 backdrop-blur-sm">
                <span className="text-4xl font-extrabold text-destructive tracking-widest">{t('admin.common.pass').toUpperCase()}</span>
              </div>
            </motion.div>
          </>
        )}

        <div className="relative aspect-[4/5] overflow-hidden cursor-pointer group" style={{ maxHeight: 'calc(100dvh - 220px)' }} onClick={() => setShowDetails(!showDetails)}>
          <AnimatePresence mode="wait">
            <motion.div key={currentPhotoIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full">
              <img src={photos[currentPhotoIndex]} alt={profile?.display_name} className="w-full h-full object-cover object-[50%_35%]" />
            </motion.div>
          </AnimatePresence>

          {photos.length > 1 && (
            <>
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4 z-10">
                {photos.map((_: any, idx: number) => (
                  <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(idx); }} className={`h-1 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/40 w-4'}`} />
                ))}
              </div>
              <div className="absolute left-0 top-0 w-1/3 h-full z-10" onClick={prevPhoto} />
              <div className="absolute right-0 top-0 w-1/3 h-full z-10" onClick={nextPhoto} />
              <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:flex hidden items-center justify-center bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50 transition opacity-0 group-hover:opacity-100">
                <ChevronLeft className="text-white" size={24} />
              </button>
              <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:flex hidden items-center justify-center bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50 transition opacity-0 group-hover:opacity-100">
                <ChevronRight className="text-white" size={24} />
              </button>
            </>
          )}

          {/* Kente accent stripe */}
          <div className="absolute bottom-0 left-0 right-0 h-1 gradient-kente opacity-60 z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{profile?.display_name}</h2>
              {age && <span className="text-xl font-light">{age}</span>}
              <VerificationBadge verification={profile?.verification_status} />
            </div>
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <MapPin size={14} />
              <span>{profile?.current_city}{distance !== null && ` • ${distance} mi`}</span>
            </div>
            {profile?.relationship_goal && (
              <Badge className="mt-2 bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                {relationshipLabels[profile.relationship_goal]}
              </Badge>
            )}
            {profile?.prompts?.[0] && (
              <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">{profile.prompts[0].question}</p>
                <p className="text-sm text-white font-medium line-clamp-2">{profile.prompts[0].answer}</p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-6 space-y-4">
                <KenteDivider className="mb-2" />
                {(matchScore || profile?.matchScore) && (
                  <MatchExplanation score={matchScore || profile?.matchScore || 0} reasons={matchReasons || profile?.matchReasons || []} breakdown={matchBreakdown || profile?.matchBreakdown || {}} confidence="good" />
                )}
                {profile?.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h3>
                    <p className="text-foreground">{profile.bio}</p>
                  </div>
                )}
                {profile?.voice_intro_url && (
                  <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3 border border-primary/10">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Mic size={20} /></div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold mb-1">{t('editProfile.voiceIntro')}</p>
                      <audio controls src={profile.voice_intro_url} className="w-full h-8" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {profile?.profession && (<div className="flex items-center gap-2 text-muted-foreground"><Briefcase size={16} className="text-primary" /><span className="text-sm">{profile.profession}</span></div>)}
                  {profile?.education && (<div className="flex items-center gap-2 text-muted-foreground"><GraduationCap size={16} className="text-primary" /><span className="text-sm capitalize">{profile.education?.replace('_', ' ')}</span></div>)}
                  {profile?.religion && (<div className="flex items-center gap-2 text-muted-foreground"><Book size={16} className="text-primary" /><span className="text-sm">{religionLabels[profile.religion]}</span></div>)}
                  {profile?.languages?.length > 0 && (<div className="flex items-center gap-2 text-muted-foreground"><Languages size={16} className="text-primary" /><span className="text-sm">{profile.languages.slice(0, 2).join(', ')}</span></div>)}
                </div>
                {profile?.cultural_values?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('editProfile.culturalValues')}</h3>
                    <div className="flex flex-wrap gap-2">{profile.cultural_values.map((value: string, idx: number) => (<Badge key={idx} variant="outline" className="border-accent/30 text-accent bg-accent/10">{value}</Badge>))}</div>
                  </div>
                )}
                {profile?.interests?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('profile.interests')}</h3>
                    <div className="flex flex-wrap gap-2">{profile.interests.map((interest: string, idx: number) => (<Badge key={idx} variant="secondary">{interest}</Badge>))}</div>
                  </div>
                )}
                {profile?.prompts?.length > 0 && (
                  <div className="space-y-3">
                    {profile.prompts.map((prompt: any, idx: number) => (
                      <div key={idx} className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4">
                        <p className="text-sm font-medium text-primary mb-1">{prompt.question}</p>
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
          <div className="flex items-center justify-center gap-5 p-4 bg-gradient-to-t from-muted/50">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => { if (navigator.vibrate) navigator.vibrate(30); onPass(); }} disabled={isPassing || isLiking || isSuperLiking} className="w-14 h-14 rounded-full bg-card shadow-xl flex items-center justify-center border-2 border-border active:bg-muted transition-all touch-manipulation disabled:opacity-50">
              {isPassing ? <Loader2 size={26} className="animate-spin text-muted-foreground" /> : <span className="text-2xl text-muted-foreground">✕</span>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => { if (navigator.vibrate) navigator.vibrate([30, 30, 30]); onSuperLike(); }} disabled={isPassing || isLiking || isSuperLiking} className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-xl flex items-center justify-center transition-all touch-manipulation disabled:opacity-50">
              {isSuperLiking ? <Loader2 size={20} className="animate-spin text-white" /> : <Sparkles className="text-white" size={20} />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => { if (navigator.vibrate) navigator.vibrate(50); onLike(); }} disabled={isPassing || isLiking || isSuperLiking} className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-xl flex items-center justify-center transition-all touch-manipulation disabled:opacity-50">
              {isLiking ? <Loader2 size={26} className="animate-spin text-white" /> : <Heart className="text-white fill-white" size={26} />}
            </motion.button>
          </div>
        )}
      </motion.div>
    </ProfileTierDecoration>
  );
});

export default ProfileCard;
