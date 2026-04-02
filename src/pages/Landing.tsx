// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { filterRecords, isAuthenticated } from '@/lib/supabase-helpers';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Heart, Shield, Globe, Sparkles, Users, CheckCircle, Crown, ArrowRight, Star, MessageCircle, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from '@/components/shared/Logo';
import heroImage from '@/assets/landing-hero.png';
import AfricanPattern from '@/components/shared/AfricanPattern';
import { useLanguage } from '@/components/i18n/LanguageContext';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';
import SEOHead from '@/components/seo/SEOHead';

export default function Landing() {
  const { t } = useLanguage();
  const { trackEvent } = useConversionTracker();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [founderTrialDays, setFounderTrialDays] = useState(183);
  const [founderEnabled, setFounderEnabled] = useState(true);

  useEffect(() => {
    trackEvent(CONVERSION_EVENTS.LANDING_VIEW);
    isAuthenticated().then(setIsLoggedIn).catch(() => {});
    
    // Fetch founder program settings (public read allowed via service role in edge function)
    // system_settings is now admin-only, so use a fallback
    filterRecords('system_settings', { key: 'founder_program' })
      .then(records => {
        const config = records?.[0]?.value;
        if (config) {
          setFounderTrialDays(config.trial_days || 183);
          setFounderEnabled(config.founders_mode_enabled !== false);
        }
      })
      .catch(() => {
        // Non-admin users can't read system_settings — use defaults
      });
    
    return () => {};
  }, []);


  const features = [
    {
      icon: Heart,
      title: t('landing.features.cultural.title'),
      description: t('landing.features.cultural.desc')
    },
    {
      icon: Shield,
      title: t('landing.features.safety.title'),
      description: t('landing.features.safety.desc')
    },
    {
      icon: Globe,
      title: t('landing.features.global.title'),
      description: t('landing.features.global.desc')
    },
    {
      icon: Sparkles,
      title: t('landing.features.smart.title'),
      description: t('landing.features.smart.desc')
    }
  ];

  const stats = [
    { number: "🇺🇸 🇨🇦", label: "USA & Canada" },
    { number: "24/7", label: t('landing.stats.members') },
    { number: t('common.free'), label: t('landing.getStarted') },
    { number: "100%", label: "Culture-Focused" }
  ];

  // Real success stories will be loaded from the database when available
  // For now, show the product value proposition without fabricated testimonials

  const [searchParams] = useSearchParams();

  const handleGetStarted = async () => {
    trackEvent(CONVERSION_EVENTS.SIGNUP_START);
    const ref = searchParams.get('ref');
    navigate(ref ? `/login?next=${encodeURIComponent(createPageUrl('Onboarding') + `?ref=${ref}`)}` : '/login');
  };

  const handleLogin = async () => {
    trackEvent(CONVERSION_EVENTS.SIGNUP_START);
    const ref = searchParams.get('ref');
    navigate(ref ? `/login?next=${encodeURIComponent(createPageUrl('Home') + `?ref=${ref}`)}` : '/login');
  };

  return (
    <>
      <SEOHead
        title="Afrinnect - The African Diaspora Community Platform"
        description="Connect with the African diaspora through community groups, cultural events, heritage-based networking, and meaningful relationships. Join thousands across USA & Canada."
        keywords="african diaspora community, african community platform, diaspora networking, african culture, african events, african heritage connections"
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-amber-900 relative overflow-hidden">
        <AfricanPattern className="text-white" opacity={0.08} />

      {/* Navigation */}
      <nav className="relative z-10 bg-card/10 backdrop-blur-lg border-b border-card/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="relative group cursor-pointer">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter transform -skew-x-6 transition-all duration-300 group-hover:skew-x-0">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-600 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]" style={{ WebkitTextStroke: '1px white' }}>
                AFRINNECT
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            {isLoggedIn ? (
              <Link to={createPageUrl('Home')}>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-card/20 font-semibold"
                >
                  {t('landingExtra.goToApp')}
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={handleLogin}
                variant="ghost" 
                className="text-white hover:bg-card/20"
              >
                {t('landing.login')}
              </Button>
            )}
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            {/* Community Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-card/10 backdrop-blur-lg border border-card/20 px-4 py-2 rounded-full mb-6"
            >
              <Shield size={14} className="text-green-400" />
              <span className="text-white/90 text-sm font-medium">{t('landing.features.safety.title')}</span>
            </motion.div>

            {/* Logo */}
            <div className="mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/539bcd82a_EA8B1C93-B120-4D4F-A79F-9725395A9A37.png"
                alt="Afrinnect"
                className="h-20 md:h-28 w-auto"
              />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {t('landing.title')}<br />
              <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                {t('landing.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-4 max-w-xl">
              {t('landing.subtitle')}
            </p>
            
            {/* Geographic notice */}
            <div className="inline-flex items-center gap-2 bg-card/10 border border-card/20 rounded-lg px-4 py-2 mb-4">
              <span className="text-xl">🇺🇸 🇨🇦</span>
              <span className="text-white/90 text-sm">{t('landingExtra.usaCanada')}</span>
            </div>
            
            {/* Urgency Message */}
            {founderEnabled && (
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 mb-6">
              <p className="text-amber-200 text-sm font-medium">
                🎉 <strong>{t('landingExtra.founderBonus')}</strong> {t('landingExtra.founderBonusDesc').replace('{duration}', founderTrialDays >= 60 ? `${Math.round(founderTrialDays / 30)} months` : `${founderTrialDays} days`)}
              </p>
            </div>
            )}
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {isLoggedIn ? (
                <Link to={createPageUrl('Home')}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-6 text-lg rounded-full shadow-2xl"
                  >
                    {t('landingExtra.welcomeBackGoToApp')}
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                   <Button 
                    onClick={handleGetStarted}
                    size="lg" 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-7 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all"
                  >
                     {t('landingExtra.joinCommunity')}
                     <ArrowRight size={20} className="ml-2" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>{t('landingExtra.freeToJoin')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>{t('landingExtra.noCreditCard')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span>{t('landingExtra.twoMinSetup')}</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Photo Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main large image */}
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-card/20">
              <img 
                src={heroImage}
                alt="African community"
                className="w-full h-[500px] md:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-lg font-semibold">{t('landingExtra.connectCulture')}</p>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
        >
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-card/10 backdrop-blur-lg border-card/20">
              <CardContent className="p-5 text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/70 text-xs md:text-sm">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-card py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              {t('landing.whyChoose')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('landing.whySubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
                      <feature.icon size={32} className="text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Value Section */}
      <section className="relative z-10 bg-gradient-to-br from-purple-50 to-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Built for the African Diaspora
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A platform that celebrates your heritage and helps you find meaningful connections through shared culture.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Globe, title: "Heritage-Based Matching", desc: "Connect through shared cultural backgrounds, languages, and traditions" },
              { icon: Shield, title: "Verified & Safe", desc: "Photo verification, AI moderation, and 24/7 safety monitoring" },
              { icon: Users, title: "Real Community", desc: "Join events, communities, and conversations with people who share your roots" }
            ].map((item, idx) => (
              <Card key={idx} className="text-center p-6">
                <CardContent className="pt-4">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
                    <item.icon size={28} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 rounded-full shadow-xl"
            >
              {t('landingExtra.testimonials.joinFree')}
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 bg-card py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              {t('landing.howItWorks')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('landingExtra.howItWorksSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                step: "1", 
                title: t('landing.steps.step1.title'), 
                desc: t('landing.steps.step1.desc'),
                icon: Users,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/e32885cab_o1ocuxst.png"
              },
              { 
                step: "2", 
                title: t('landing.steps.step2.title'), 
                desc: t('landing.steps.step2.desc'),
                icon: Sparkles,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/65fc6c0a5_medium-shot-beautiful-african-woman-posing.jpg"
              },
              { 
                step: "3", 
                title: t('landing.steps.step3.title'), 
                desc: t('landing.steps.step3.desc'),
                icon: MessageCircle,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/61126ff23_premium_photo-1661281273104-150484122d32.jpg"
              },
              { 
                step: "4", 
                title: t('landing.steps.step4.title'), 
                desc: t('landing.steps.step4.desc'),
                icon: Heart,
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/e32885cab_o1ocuxst.png"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img 
                        src={idx === 0 ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/fb4e02dea_ChatGPTImageFeb4202612_35_48PM.png" : item.image} 
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {item.step}
                      </div>
                    </div>
                    <div className="p-6 pt-10">
                      <div className="w-10 h-10 mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                        <item.icon size={20} className="text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Preview */}
      <section className="relative z-10 bg-card py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2 rounded-full mb-6">
            <Crown size={20} />
            <span className="font-semibold">{t('landing.premium.subtitle')}</span>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-6">
            {t('landing.premium.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              t('monetization.premiumFeatures.unlimitedLikes'),
              t('monetization.premiumFeatures.seeWhoLikes'),
              t('monetization.premiumFeatures.advancedFilters'),
              t('monetization.premiumFeatures.readReceipts'),
              t('monetization.premiumFeatures.rewindSwipe'),
              t('monetization.premiumFeatures.profileBoosts')
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2 text-foreground">
                <CheckCircle size={20} className="text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          </div>
          </section>

      {/* Final CTA Section - Strong Close */}
      <section className="relative z-10 bg-gradient-to-r from-purple-900 to-amber-900 py-20">
        <AfricanPattern className="text-white" opacity={0.05} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Emotional Hook */}
            <p className="text-amber-300 text-lg mb-4 font-medium">
              {t('landingExtra.ctaEmotional')}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('landingExtra.ctaTitle')}
            </h2>
            <p className="text-xl text-white/90 mb-4 max-w-2xl mx-auto">
              {t('landingExtra.ctaDesc')}
            </p>
            
            {/* Scarcity/Urgency */}
            <div className="inline-flex items-center gap-2 bg-card/10 backdrop-blur-lg px-6 py-3 rounded-full mb-8">
              <Shield size={14} className="text-green-400" />
              <span className="text-white/90 text-sm">{t('landing.features.safety.title')}</span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-card text-purple-900 hover:bg-muted px-12 py-7 text-xl rounded-full shadow-2xl transform hover:scale-105 transition-all font-bold"
              >
                {t('landingExtra.joinAfrinnect')}
                <ArrowRight size={24} className="ml-2" />
              </Button>
              <div className="flex items-center gap-4 text-white/70 text-sm mt-2">
                <span>{t('landingExtra.free')}</span>
                <span>{t('landingExtra.twoMinSignup')}</span>
                <span>{t('landingExtra.cancelAnytime')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA - High Converting */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 md:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        {isLoggedIn ? (
          <Link to={createPageUrl('Home')} className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-6 text-base font-bold">
              {t('landingExtra.openAfrinnect')}
            </Button>
          </Link>
        ) : (
          <div className="space-y-2">
            <Button 
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-600 text-white rounded-full py-6 text-base font-bold shadow-lg"
            >
              {t('landingExtra.testimonials.joinFree')}
              <ArrowRight size={18} className="ml-2" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('landingExtra.free')} • {t('landingExtra.twoMinSignup')}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-background text-white py-12 pb-32 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Logo size="default" />
          <p className="text-muted-foreground mt-4">
            {t('landing.footer.tagline')}
          </p>
          <div className="flex justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <Link to={createPageUrl('Privacy')} className="hover:text-white" id="privacy-policy">{t('landingExtra.footerPrivacy')}</Link>
            <Link to={createPageUrl('Terms')} className="hover:text-white">{t('landingExtra.footerTerms')}</Link>
            <Link to={createPageUrl('CommunityGuidelines')} className="hover:text-white">{t('landing.footer.guidelines')}</Link>
          </div>
          {/* Contact & Copyright */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              {t('landingExtra.footerContact')} <a href="mailto:Support@afrinnect.com" className="text-amber-400 hover:text-amber-300">Support@afrinnect.com</a>
            </p>
            <p className="text-sm text-muted-foreground">© 2025 Afrinnect. {t('landingExtra.footerRights')}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {t('landingExtra.footerTrademark')}
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}