// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { filterRecords, getCurrentUser, invokeFunction, logout, uploadFile } from '@/lib/supabase-helpers';
import { useMutation } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Camera, Loader2, Check, Heart,
  Globe, Users, Shield, Sparkles, MapPin, Crown, Gift
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import Logo from '@/components/shared/Logo';
import AfricanPattern from '@/components/shared/AfricanPattern';
import SafetyEducationModal from '@/components/safety/SafetyEducationModal';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';
import { useLanguage } from '@/components/i18n/LanguageContext';
import CelebrationModal from '@/components/shared/CelebrationModal';
import FoundingMemberWelcome from '@/components/founding/FoundingMemberWelcome';
import { toast } from '@/hooks/use-toast';

import { AFRICAN_COUNTRIES, ALLOWED_RESIDENCE_COUNTRIES, ALL_HERITAGE_COUNTRIES } from '@/constants/countries';

const ALL_COUNTRIES = ALL_HERITAGE_COUNTRIES;

const INTERESTS = [
  'Travel', 'Music', 'Cooking', 'Dancing', 'Art', 'Sports', 'Reading',
  'Movies', 'Fashion', 'Technology', 'Business', 'Fitness', 'Photography', 'Food'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { trackEvent } = useConversionTracker();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [showSafetyEducation, setShowSafetyEducation] = useState(false);
  const [showFoundingWelcome, setShowFoundingWelcome] = useState(false);
  const [createdProfile, setCreatedProfile] = useState(null);
  const [onboardingSearchParams] = useSearchParams();
  const [formData, setFormData] = useState(() => {
    const refCode = onboardingSearchParams.get('ref');
    const founderCode = onboardingSearchParams.get('founder') || onboardingSearchParams.get('code');
    const ambassadorCode = onboardingSearchParams.get('a') || onboardingSearchParams.get('ambassador') || onboardingSearchParams.get('r');
    
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
    }
    if (founderCode) {
      localStorage.setItem('founder_invite_code', founderCode);
    }
    if (ambassadorCode) {
      localStorage.setItem('ambassador_code', ambassadorCode);
    }

    // Load from localStorage if available
    const saved = localStorage.getItem('onboarding_data');
    const savedRef = localStorage.getItem('referral_code');
    const savedFounderCode = localStorage.getItem('founder_invite_code');
    const savedAmbassadorCode = localStorage.getItem('ambassador_code');
    
    return saved ? { ...JSON.parse(saved), referred_by: savedRef, founder_invite_code: savedFounderCode, ambassador_code: savedAmbassadorCode } : {
      display_name: '',
      referred_by: savedRef || '',
      founder_invite_code: savedFounderCode || '',
      ambassador_code: savedAmbassadorCode || '',
      birth_date: '',
      gender: '',
      looking_for: [],
      photos: [],
      country_of_origin: '',
      current_country: '',
      current_city: '',
      relationship_goal: '',
      interests: [],
      location: { lat: null, lng: null }
    };
  });
  const [isUploading, setIsUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Social proof removed — no fabricated signup data

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('onboarding_data', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Check if user already has profile
        const profiles = await filterRecords('user_profiles', { user_id: currentUser.id });
        if (profiles.length > 0) {
          navigate(createPageUrl('Home'));
        }
        } catch (e) {
        // Not logged in - redirect to login
        console.log('User not authenticated');
        navigate('/login');
      }
    };
    checkUser();
  }, [navigate]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGender = (gender) => {
    setFormData(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(gender)
        ? prev.looking_for.filter(g => g !== gender)
        : [...prev.looking_for, gender]
    }));
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : prev.interests.length < 5 ? [...prev.interests, interest] : prev.interests
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({ title: t('errors.photoSize'), variant: 'destructive' });
      return;
    }

    // Analyze quality (non-blocking suggestion)
    try {
      const { analyzeImageQuality } = await import('@/components/shared/ImageCompressor');
      const report = await analyzeImageQuality(file);
      if (report.isLowQuality && report.suggestions.length > 0) {
        toast({
          title: '📸 ' + report.suggestions[0],
          description: 'Clear photos get more matches',
          duration: 4000,
        });
      }
    } catch {}

    // Compress and upload directly (no cropper in onboarding for speed)
    setIsUploading(true);
    try {
      const { compressImage } = await import('@/components/shared/ImageCompressor');
      const compressed = await compressImage(file, 1080, 0.85);
      const { file_url } = await uploadFile(compressed);
      updateField('photos', [...formData.photos, file_url]);
      if (!formData.primary_photo) {
        updateField('primary_photo', file_url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: t('errors.uploadFailed'), variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const createProfileMutation = useMutation({
  mutationFn: async () => {
      // Get device fingerprint
      const deviceId = navigator.userAgent + '_' + new Date().getTime();
      
      // Check phone number uniqueness if provided
      const phoneNumber = formData.phone_number;
      if (phoneNumber) {
        const phoneCheck = await filterRecords('user_profiles', { phone_number: phoneNumber });
        if (phoneCheck.length >= 2) {
          throw new Error(t('errors.phoneRegistered'));
        }
      }

      const response = await invokeFunction('createProfile', {
        ...formData,
        device_id: deviceId,
        device_name: navigator.userAgent.substring(0, 50)
      });

      if (response?.error) throw new Error(response.error);
      const profile = response?.profile;
      if (!profile) throw new Error('Profile creation returned no data. Please try again.');

      // Clear saved progress on success
      localStorage.removeItem('onboarding_data');

      // Request push notification permission immediately
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (notifError) {
        console.error('Push notification setup failed:', notifError);
      }

      return profile;
    },
    onSuccess: (profile) => {
      setCreatedProfile(profile);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        // If founding member, show special welcome first
        if (profile?.is_founding_member) {
          setShowFoundingWelcome(true);
        } else {
          setShowSafetyEducation(true);
        }
      }, 3000);
    },
    onError: (error) => {
      // Parse and display user-friendly error messages
      let friendlyMessage = "Something went wrong. Please try again.";
      const msg = error.message || '';
      
      if (msg.includes('already exists') || msg.includes('already have')) {
        friendlyMessage = "You already have an account. Redirecting you to login...";
        setTimeout(() => navigate(createPageUrl('Home')), 2000);
      } else if (msg.includes('Phone number')) {
        friendlyMessage = "This phone number is already registered. Please use a different number.";
      } else if (msg.includes('18 years')) {
        friendlyMessage = "You must be at least 18 years old to join.";
      } else if (msg.includes('rejected')) {
        friendlyMessage = "Your profile information couldn't be verified. Please check your details and try again.";
      } else if (msg.includes('Birth date')) {
        friendlyMessage = "Please enter your date of birth to continue.";
      } else if (msg.includes('Unauthorized')) {
        friendlyMessage = "Your session has expired. Please log in again.";
        setTimeout(() => { navigate('/login'); }, 2000);
      } else if (msg && msg !== 'null' && msg !== 'undefined') {
        friendlyMessage = msg;
      }
      
      toast({ title: friendlyMessage });
    }
      });

  const getLocation = async () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            const addr = data.address || {};
            const country = addr.country;
            const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '';
            const state = addr.state || addr.province || '';
            
            const normalizedCountry = country === 'United States of America' ? 'United States' : country;
            
            setFormData(prev => ({
              ...prev,
              location: { lat, lng },
              current_country: normalizedCountry || 'United States',
              current_city: city,
              current_state: state
            }));
          } catch (e) {
            console.error('Reverse geocoding failed, allowing manual entry:', e);
            // Allow manual selection instead of blocking
            setFormData(prev => ({
              ...prev,
              location: { lat, lng },
            }));
            toast({ title: 'Could not auto-detect your city. Please select your location manually below.' });
          }
          setGettingLocation(false);
        },
        (error) => {
          // Location denied — allow manual entry instead of blocking
          console.log('Location permission denied, allowing manual entry');
          toast({ title: 'Location access denied. Please select your country and city manually below.' });
          setGettingLocation(false);
        }
      );
    } else {
      toast({ title: 'Please select your country and city manually below.' });
      setGettingLocation(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: 
        const nameValid = formData.display_name && formData.display_name.trim().length >= 2;
        const ageValid = formData.birth_date && calculateAge(formData.birth_date) >= 18;
        const genderValid = formData.gender && formData.looking_for.length > 0;
        const ageConfirmed = formData.age_confirmed === true;
        return nameValid && ageValid && genderValid && ageConfirmed;
      case 2: 
        // Location: require heritage + country + city + goal. Geo coords optional (manual fallback).
        const locationValid = formData.country_of_origin && formData.current_country && formData.current_city;
        const goalValid = formData.relationship_goal;
        return locationValid && goalValid;
      case 3: 
        return formData.photos.length >= 2 && formData.interests.length >= 3;
      default: return false;
    }
  };

  const progress = ((step) / 3) * 100;

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center relative"
    >
      <Logo size="large" />
      <h1 className="text-3xl font-bold text-foreground mt-8 mb-2">
        Your Journey Starts Here
      </h1>
      <p className="text-muted-foreground text-lg mb-2">
        {t('onboarding.welcome.subtitle')}
      </p>
      
      <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
        <Shield size={14} className="text-primary" />
        <span className="text-sm text-primary font-medium">Verified & safe community</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-card rounded-xl shadow-sm">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
            <Globe size={20} className="text-purple-600" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{t('onboarding.welcome.global')}</p>
        </div>
        <div className="text-center p-3 bg-card rounded-xl shadow-sm">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
            <Users size={20} className="text-amber-600" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{t('onboarding.welcome.cultural')}</p>
        </div>
        <div className="text-center p-3 bg-card rounded-xl shadow-sm">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
            <Shield size={20} className="text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{t('onboarding.welcome.safe')}</p>
        </div>
      </div>
      
      <div className="flex justify-center gap-6 mb-6 text-sm">
        <div className="text-center">
          <p className="font-bold text-purple-600">1 min</p>
          <p className="text-muted-foreground text-xs">to complete</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-purple-600">100%</p>
          <p className="text-muted-foreground text-xs">free to join</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-purple-600">🇺🇸 🇨🇦</p>
          <p className="text-muted-foreground text-xs">USA & Canada</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t('onboarding.welcome.terms')}</p>

      {formData.founder_invite_code && (
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 rounded-full"><Crown size={20} className="text-amber-700" /></div>
            <div className="text-left">
              <p className="font-bold text-amber-800">Founding Member Code Applied!</p>
              <p className="text-xs text-amber-600 mt-1">6 months of Premium free!</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>,

    // Step 1: COMBINED - Basic Info + Gender + Looking For
    <motion.div
      key="basics-combined"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">About You</h2>
        <p className="text-muted-foreground text-sm">Let's get the basics</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">{t('onboarding.basic.firstName')}</Label>
          <Input
            value={formData.display_name}
            onChange={(e) => updateField('display_name', e.target.value)}
            placeholder="Your first name"
            className="mt-1 h-11 border-2 focus:border-purple-500"
            autoFocus
          />
        </div>

        <div>
          <Label className="text-sm font-medium">{t('onboarding.basic.birthday')}</Label>
          <Input
            type="date"
            value={formData.birth_date}
            onChange={(e) => updateField('birth_date', e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            className="mt-1 h-11 border-2 focus:border-purple-500"
          />
          {formData.birth_date && calculateAge(formData.birth_date) < 18 && (
            <p className="mt-2 text-sm text-destructive font-medium">
              Afrinnect is only available for users 18 and older.
            </p>
          )}
        </div>

        {/* Age confirmation checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="age-confirm"
            checked={formData.age_confirmed || false}
            onChange={(e) => updateField('age_confirmed', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-purple-600"
          />
          <label htmlFor="age-confirm" className="text-sm text-muted-foreground leading-tight">
            I confirm that I am 18 years or older and agree to the{' '}
            <a href="/terms" className="text-primary underline">Terms of Service</a>{' & '}
            <a href="/privacy" className="text-primary underline">Privacy Policy</a>.
          </label>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">{t('onboarding.gender.iAm')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {['man', 'woman'].map(gender => (
              <button
                key={gender}
                onClick={() => updateField('gender', gender)}
                className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                  formData.gender === gender ? 'border-purple-600 bg-purple-50' : 'border-border'
                }`}
              >
                <span className="text-xl">{gender === 'man' ? '👨' : '👩'}</span>
                <span className={`font-medium ${formData.gender === gender ? 'text-purple-600' : 'text-foreground'}`}>
                  {gender === 'man' ? 'Man' : 'Woman'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">{t('onboarding.gender.lookingFor')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {['man', 'woman'].map(gender => (
              <button
                key={gender}
                onClick={() => toggleGender(gender)}
                className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                  formData.looking_for.includes(gender) ? 'border-purple-600 bg-purple-50' : 'border-border'
                }`}
              >
                <span className="text-xl">{gender === 'man' ? '👨' : '👩'}</span>
                <span className={`font-medium ${formData.looking_for.includes(gender) ? 'text-purple-600' : 'text-foreground'}`}>
                  {gender === 'man' ? 'Men' : 'Women'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>,

    // Step 2: COMBINED - Location + Heritage + Goal
    <motion.div
      key="location-combined"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Your Background</h2>
        <p className="text-muted-foreground text-sm">Help us find your perfect match</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Heritage Country</Label>
        <Select value={formData.country_of_origin} onValueChange={(v) => updateField('country_of_origin', v)}>
          <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select country" /></SelectTrigger>
          <SelectContent>
            {AFRICAN_COUNTRIES.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location: auto-detect or manual */}
      <div className={`p-4 rounded-xl border-2 ${formData.current_country ? 'border-green-500 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
        {formData.location.lat && formData.current_city ? (
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-sm text-green-800">{formData.current_city}, {formData.current_country}</p>
              <button onClick={() => { updateField('location', {}); updateField('current_country', ''); updateField('current_city', ''); updateField('current_state', ''); }} className="text-xs text-green-600 underline mt-0.5">Change</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-amber-600" />
                <p className="font-semibold text-sm text-amber-800">Set your location</p>
              </div>
              <Button onClick={getLocation} disabled={gettingLocation} size="sm" className="bg-amber-600 hover:bg-amber-700">
                {gettingLocation ? <Loader2 size={16} className="animate-spin" /> : 'Auto-detect'}
              </Button>
            </div>
            
            {/* Manual fallback */}
            <div className="space-y-2 pt-2 border-t border-amber-200">
              <p className="text-xs text-amber-700">Or select manually:</p>
              <Select value={formData.current_country} onValueChange={(v) => updateField('current_country', v)}>
                <SelectTrigger className="h-10 bg-card"><SelectValue placeholder="Country of residence" /></SelectTrigger>
                <SelectContent>
                  {ALLOWED_RESIDENCE_COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={formData.current_city || ''}
                onChange={(e) => updateField('current_city', e.target.value)}
                placeholder="City (e.g. Houston, Toronto)"
                className="h-10 bg-card"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">What are you looking for?</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'dating', emoji: '💕', label: 'Dating' },
            { value: 'serious_relationship', emoji: '❤️', label: 'Relationship' },
            { value: 'marriage', emoji: '💍', label: 'Marriage' },
            { value: 'friendship_community', emoji: '🤝', label: 'Friendship' }
          ].map(goal => (
            <button
              key={goal.value}
              onClick={() => updateField('relationship_goal', goal.value)}
              className={`p-3 rounded-xl border-2 transition text-left ${
                formData.relationship_goal === goal.value ? 'border-purple-600 bg-purple-50' : 'border-border'
              }`}
            >
              <span className="text-xl mr-2">{goal.emoji}</span>
              <span className={`font-medium text-sm ${formData.relationship_goal === goal.value ? 'text-purple-600' : 'text-foreground'}`}>
                {goal.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 3: COMBINED - Photos + Interests (Final Step)
    <motion.div
      key="photos-interests"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5"
    >
      <div className="text-center">
        <span className="text-3xl">🎉</span>
        <h2 className="text-2xl font-bold text-foreground mt-2">Almost Done!</h2>
        <p className="text-muted-foreground text-sm">Add photos & interests</p>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Photos ({formData.photos.length}/2 min)</Label>
          {formData.photos.length >= 2 && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12} />Ready!</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {formData.photos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  const newPhotos = formData.photos.filter((_, i) => i !== idx);
                  updateField('photos', newPhotos);
                  if (idx === 0 && newPhotos.length > 0) updateField('primary_photo', newPhotos[0]);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <span className="text-white text-xs">✕</span>
              </button>
            </div>
          ))}
          {formData.photos.length < 4 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
              {isUploading ? <Loader2 size={24} className="text-purple-600 animate-spin" /> : <Camera size={24} className="text-muted-foreground" />}
            </label>
          )}
        </div>
      </div>

      {/* Interests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Interests ({formData.interests.length}/3 min)</Label>
          {formData.interests.length >= 3 && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12} />Great!</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => (
            <Badge
              key={interest}
              variant={formData.interests.includes(interest) ? "default" : "outline"}
              className={`cursor-pointer py-1.5 px-3 transition ${
                formData.interests.includes(interest) ? 'bg-purple-600 text-white' : 'hover:bg-purple-50'
              }`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      {formData.photos.length >= 2 && formData.interests.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-purple-50 to-amber-50 rounded-xl border border-purple-200 text-center"
        >
          <p className="text-purple-800 font-medium">🎊 You're all set! Tap below to start</p>
        </motion.div>
      )}
    </motion.div>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-purple-50/30 to-amber-50/20 relative">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      {/* Progress Bar - Enhanced with motivation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg">
        {step > 0 && (
          <div className="relative">
            <Progress value={progress} className="h-2 rounded-none" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600">
              {Math.round(progress)}%
            </div>
          </div>
        )}
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => {
              if (step === 0) {
                if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                  navigate(createPageUrl('Landing'));
                }
              } else {
                setStep(step - 1);
              }
            }} 
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition"
          >
            <ArrowLeft size={24} className="text-muted-foreground" />
          </button>
          <div className="text-center">
            <span className="text-sm font-medium text-foreground">
              {step === 0 ? 'Get Started' : `Step ${step} of 3`}
            </span>
            {step > 0 && step <= 3 && (
              <p className="text-xs text-purple-600 font-medium">
                {step === 1 && "Great start! 🎉"}
                {step === 2 && "Almost there! 🚀"}
                {step === 3 && "Final step! 🎯"}
              </p>
            )}
          </div>
          <button 
            onClick={() => {
              if (confirm('Exit onboarding? Your progress will be saved.')) {
                navigate(createPageUrl('Landing'));
              }
            }}
            className="text-sm text-muted-foreground hover:text-red-600 transition px-2 py-1"
          >
            Exit
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-6 pb-32 pt-24">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Enhanced */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          {/* Social proof ticker removed — no fabricated data */}
          
          <Button
            onClick={() => {
              if (step === 3) {
                createProfileMutation.mutate();
              } else {
                setStep(step + 1);
              }
            }}
            disabled={!canProceed() || createProfileMutation.isPending}
            className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
          >
            {createProfileMutation.isPending ? (
              <Loader2 size={24} className="animate-spin" />
            ) : step === 3 ? (
              <>
                <Sparkles size={20} className="mr-2" />
                {t('onboarding.navigation.startMatching')}
              </>
            ) : (
              <>
                {t('common.continue')}
                <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </Button>
          
          {/* Trust signals */}
          {step === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              🔒 Your data is encrypted • Takes ~2 minutes
            </p>
          )}
        </div>
      </div>

      {/* Profile Complete Celebration */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="Welcome to Afrinnect!"
        message="Your profile is ready. Let's find your perfect match!"
        emoji="🎉"
      />

      {/* Founding Member Welcome Modal */}
      <FoundingMemberWelcome
        isOpen={showFoundingWelcome}
        onClose={() => {
          setShowFoundingWelcome(false);
          setShowSafetyEducation(true);
        }}
        profile={createdProfile}
      />

      {/* Safety Education Modal */}
      <SafetyEducationModal
        open={showSafetyEducation}
        onClose={() => {
          setShowSafetyEducation(false);
          navigate('/home');
        }}
        onComplete={() => {
          setShowSafetyEducation(false);
          navigate('/home');
        }}
      />
    </div>
  );
}