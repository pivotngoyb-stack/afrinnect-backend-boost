// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Crown, Heart, Check, Star, Users, MessageCircle,
  CircleHelp as HelpCircle, RotateCcw, ShieldCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import AfricanPattern from '@/components/shared/AfricanPattern';
import SocialProofPaywall from '@/components/monetization/SocialProofPaywall';
import { toast } from 'sonner';

const PRICING_TIERS = {
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Enhanced community & connection features',
    icon: Heart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    prices: {
      monthly: { amount: 14.99, period: 'month', total: 14.99 },
      quarterly: { amount: 11.66, period: 'month', total: 34.99, save: '22%' },
      yearly: { amount: 9.99, period: 'month', total: 119.99, save: '33%' }
    },
    features: [
      { text: '50 Likes per day', tip: 'Generous daily like limit' },
      { text: 'See Who Liked You', tip: 'View your admirers instantly' },
      { text: '100 Messages per day', tip: 'Plenty of messages to connect' },
      { text: 'Advanced Filters', tip: 'Filter by heritage, language, and more' },
      { text: 'Read Receipts', tip: 'Know when your messages are read' },
      { text: '5 Rewinds per day', tip: 'Undo accidental passes' },
      { text: '1 Profile Boost/month', tip: 'Be the top profile for 30 mins' }
    ]
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    description: 'For serious community members',
    icon: Star,
    popular: true,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    buttonColor: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    prices: {
      monthly: { amount: 24.99, period: 'month', total: 24.99 },
      quarterly: { amount: 19.99, period: 'month', total: 59.99, save: '20%' },
      yearly: { amount: 14.99, period: 'month', total: 179.99, save: '40%' }
    },
    features: [
      { text: 'Unlimited Likes', tip: 'Connect with as many people as you want' },
      { text: 'Unlimited Messaging', tip: 'Chat without any restrictions' },
      { text: 'Unlimited Rewinds', tip: 'Never miss a potential connection' },
      { text: 'See Who Liked You', tip: 'View your admirers instantly' },
      { text: 'Virtual Gifts', tip: 'Send digital gifts to stand out' },
      { text: 'Elite Verified Badge', tip: 'Show you are real and serious' },
      { text: 'Priority Discovery', tip: 'Get seen by more people first' },
      { text: 'Unlimited Profile Boosts', tip: 'Boost your profile anytime' },
      { text: 'Incognito Mode', tip: 'Browse profiles privately' },
      { text: 'VIP Events Access', tip: 'Join exclusive community events' }
    ]
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    description: 'The ultimate Afrinnect experience',
    icon: Crown,
    color: 'text-slate-900',
    bgColor: 'bg-slate-50',
    buttonColor: 'bg-slate-900 hover:bg-foreground',
    prices: {
      monthly: { amount: 49.99, period: 'month', total: 49.99 },
      quarterly: { amount: 39.99, period: 'month', total: 119.99, save: '20%', label: '3 Months' },
      yearly: { amount: 29.99, period: 'month', total: 359.99, save: '40%' }
    },
    features: [
      { text: 'Everything in Elite', tip: '' },
      { text: 'Virtual Speed Dating', tip: 'Join exclusive live video events' },
      { text: 'VIP Verified Badge', tip: 'Exclusive gold status symbol' },
      { text: 'Concierge Support', tip: 'Direct line to our team 24/7' },
      { text: 'Exclusive VIP Events', tip: 'VIP-only community events' },
      { text: 'Featured Profile Placement', tip: 'Always shown first in discovery' },
      { text: 'Profile Insights & Analytics', tip: 'See who viewed you and detailed stats' },
      { text: '5 Virtual Gifts/month', tip: 'Free monthly gift allowance' },
      { text: 'Priority DMs', tip: 'Your messages appear first' }
    ]
  }
};

export default function PricingPlans() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('user_profiles')
            .select('id, subscription_tier')
            .eq('user_id', user.id)
            .single();
          if (data) setMyProfile(data);
        }
      } catch (e) {
        console.error("Init error", e);
      }
    };
    init();
  }, []);

  const handleSubscribe = (tierKey: string) => {
    if (!myProfile) {
      navigate('/login?next=/pricingplans');
      return;
    }
    if (myProfile?.subscription_tier === tierKey) {
      toast.info('You are already on this plan.');
      return;
    }
    toast.info('Subscriptions launching very soon! Join the waitlist to get early access pricing.');
  };

  const handleRestorePurchases = () => {
    toast.info('Checking for previous purchases...');
    // Native restore purchases will be handled by Capacitor/StoreKit
    setTimeout(() => {
      toast.success('No previous purchases found. If you believe this is an error, please contact support.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <AfricanPattern className="text-primary" opacity={0.03} />
      
      {/* Header */}
      <header className="bg-background/80 border-b border-border sticky top-0 z-40 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </Button>
          <div className="font-semibold text-foreground">Upgrade Plan</div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 md:py-16 pb-32">
        
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            Unlock Your Full Potential
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get deeper community connections, enhanced discovery, and premium features.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-card p-1.5 rounded-full border border-border shadow-sm inline-flex relative">
            {['monthly', 'quarterly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingCycle === cycle 
                    ? 'text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {billingCycle === cycle && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {cycle}
                  {cycle === 'yearly' && (
                    <span className="ml-1.5 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full uppercase font-bold">
                      Save 40%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          {Object.entries(PRICING_TIERS).map(([key, tier]) => {
            const price = tier.prices[billingCycle];
            const isPopular = tier.popular;
            if (!price) return null;

            return (
              <div 
                key={key}
                className={`relative bg-card rounded-2xl transition-all duration-300 flex flex-col
                  ${isPopular 
                    ? 'shadow-2xl border-2 border-primary scale-[1.02] z-10' 
                    : 'shadow-lg border border-border hover:shadow-xl'
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="p-6 pb-0 flex-1">
                  <div className={`w-11 h-11 rounded-xl ${tier.bgColor} flex items-center justify-center mb-4`}>
                    <tier.icon className={`w-5 h-5 ${tier.color}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                  <p className="text-muted-foreground text-sm mb-5">{tier.description}</p>
                  
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-bold text-foreground">${price.amount}</span>
                    <span className="text-muted-foreground ml-1">/mo</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className={`mt-0.5 p-0.5 rounded-full ${tier.bgColor}`}>
                          <Check className={`w-3 h-3 ${tier.color}`} strokeWidth={3} />
                        </div>
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger className="text-sm text-foreground/80 text-left flex items-center gap-1">
                              {feature.text}
                              {feature.tip && <HelpCircle size={11} className="text-muted-foreground/50" />}
                            </TooltipTrigger>
                            {feature.tip && (
                              <TooltipContent><p>{feature.tip}</p></TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0 mt-auto">
                  <Button 
                    onClick={() => handleSubscribe(key)}
                    disabled={myProfile?.subscription_tier === key}
                    className={`w-full py-5 text-base font-semibold rounded-xl shadow-lg transition-all active:scale-95 ${tier.buttonColor}`}
                  >
                    {myProfile?.subscription_tier === key ? 'Current Plan' : `Get ${tier.name}`}
                  </Button>

                  {/* Billing details with auto-renewal disclosure */}
                  <div className="text-center mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {billingCycle === 'monthly' 
                        ? `$${price.total}/month`
                        : billingCycle === 'quarterly'
                          ? `Billed every 3 months at $${price.total}`
                          : `Billed annually at $${price.total}/year`
                      }
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      Auto-renews. Cancel anytime.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Restore Purchases & Legal */}
        <div className="mt-10 text-center space-y-4">
          <Button
            variant="ghost"
            onClick={handleRestorePurchases}
            className="text-sm text-muted-foreground gap-2"
          >
            <RotateCcw size={16} />
            Restore Purchases
          </Button>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Payment will be charged to your App Store account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage and cancel your subscriptions in your App Store account settings.
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <Link to="/terms" className="text-primary underline">Terms of Use</Link>
              <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-12 max-w-md mx-auto">
          <SocialProofPaywall />
        </div>

        {/* Feature Comparison Table */}
        <div id="comparison" className="mt-12 max-w-4xl mx-auto bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-center text-foreground">Compare Features</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground pl-6">Features</th>
                  <th className="p-3 text-center text-sm font-bold text-purple-600">Premium</th>
                  <th className="p-3 text-center text-sm font-bold text-amber-600">Elite</th>
                  <th className="p-3 text-center text-sm font-bold text-foreground">VIP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: 'Daily Likes', premium: '50/day', elite: 'Unlimited', vip: 'Unlimited' },
                  { name: 'See Who Likes You', premium: true, elite: true, vip: true },
                  { name: 'Daily Messages', premium: '100/day', elite: 'Unlimited', vip: 'Unlimited' },
                  { name: 'Advanced Filters', premium: true, elite: true, vip: true },
                  { name: 'Read Receipts', premium: true, elite: true, vip: true },
                  { name: 'Rewind Last Action', premium: '5/day', elite: 'Unlimited', vip: 'Unlimited' },
                  { name: 'Profile Boosts', premium: '1/mo', elite: 'Unlimited', vip: 'Unlimited' },
                  { name: 'Virtual Gifts', premium: false, elite: true, vip: true },
                  { name: 'Priority Discovery', premium: false, elite: true, vip: true },
                  { name: 'Incognito Mode', premium: false, elite: true, vip: true },
                  { name: 'Verified Badge', premium: false, elite: 'Elite', vip: 'VIP' },
                  { name: 'Virtual Speed Dating', premium: false, elite: false, vip: true },
                  { name: 'Featured Placement', premium: false, elite: false, vip: true },
                  { name: 'Profile Insights', premium: false, elite: false, vip: true },
                  { name: 'Concierge Support', premium: false, elite: false, vip: true },
                  { name: 'Exclusive Events', premium: false, elite: false, vip: true },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-sm font-medium text-foreground pl-6">{row.name}</td>
                    <td className="p-3 text-center">
                      {row.premium === true ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : row.premium ? <span className="text-sm font-medium text-purple-600">{row.premium}</span> : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="p-3 text-center">
                      {row.elite === true ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : row.elite ? <span className="text-sm font-medium text-amber-600">{row.elite}</span> : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="p-3 text-center">
                      {row.vip === true ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : row.vip ? <span className="text-sm font-medium text-foreground">{row.vip}</span> : <span className="text-muted-foreground/40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
