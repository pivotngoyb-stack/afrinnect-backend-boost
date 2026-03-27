import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface NewMatchToastProps {
  matchedProfile?: any;
  show: boolean;
  onDismiss: () => void;
}

export default function NewMatchToast({ matchedProfile, show, onDismiss }: NewMatchToastProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed bottom-24 left-4 right-4 z-[90] bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-4 shadow-2xl"
        >
          <button onClick={onDismiss} className="absolute top-2 right-2 text-white/70 hover:text-white">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-12 h-12 bg-card/20 rounded-full flex items-center justify-center">
              <Heart size={24} className="text-white" fill="white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-white font-bold text-base">{t('engagement.newMatchToast.title')}</p>
              <p className="text-white/80 text-xs">
                {matchedProfile?.display_name
                  ? t('engagement.newMatchToast.likedBack').replace('{name}', matchedProfile.display_name)
                  : t('engagement.newMatchToast.someoneLikedBack')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => { navigate('/matches'); onDismiss(); }}
              className="flex-1 bg-card text-pink-600 hover:bg-card/90 text-xs font-semibold">
              <MessageCircle size={14} className="mr-1" />
              {t('engagement.newMatchToast.sayHi')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
