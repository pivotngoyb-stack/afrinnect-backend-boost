import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function TrialExpiryBanner({ userProfile }) {
  const { t } = useLanguage();
  const isPremium = userProfile?.is_premium;
  const premiumUntil = userProfile?.premium_until;
  const expiresAt = premiumUntil ? new Date(premiumUntil) : null;
  const now = new Date();
  const hoursLeft = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)) : 999;

  if (!isPremium || !premiumUntil) return null;
  if (hoursLeft > 24) return null;

  if (hoursLeft <= 0) {
    return (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mt-4">
        <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300">
          <Crown className="h-5 w-5 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{t('monetization.trialExpiry.ended')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('monetization.trialExpiry.upgradeToKeep')}</p>
            </div>
            <Link to={createPageUrl('PricingPlans')}>
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 ml-4"><Sparkles size={16} className="mr-2" /> {t('monetization.trialExpiry.upgrade')}</Button>
            </Link>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mt-4">
      <Alert className="bg-gradient-to-r from-primary/5 to-pink-500/5 border-primary/30">
        <Clock className="h-5 w-5 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{t('monetization.trialExpiry.endsIn').replace('{hours}', String(hoursLeft))}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('monetization.trialExpiry.dontLose')}</p>
          </div>
          <Link to={createPageUrl('PricingPlans')}>
            <Button className="bg-gradient-to-r from-primary to-pink-600 ml-4"><Crown size={16} className="mr-2" /> {t('monetization.trialExpiry.upgradeNow')}</Button>
          </Link>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
