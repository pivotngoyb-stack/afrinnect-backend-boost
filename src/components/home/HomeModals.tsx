import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import LikesLimitPaywall from '@/components/paywall/LikesLimitPaywall';
import TutorialTooltip from '@/components/shared/TutorialTooltip';
import MessageWithLikeModal from '@/components/home/MessageWithLikeModal';
import MatchMilestones from '@/components/monetization/MatchMilestones';
import FeedbackModal from '@/components/matching/FeedbackModal';
import { UpgradePromptBanner } from '@/components/monetization/UpgradePrompts';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface HomeModalsProps {
  showLimitPaywall: boolean;
  setShowLimitPaywall: (v: boolean) => void;
  showTutorial: boolean;
  tutorialSteps: any[];
  completeTutorial: () => void;
  showMatchCelebration: boolean;
  setShowMatchCelebration: (v: boolean) => void;
  showMessageModal: boolean;
  setShowMessageModal: (v: boolean) => void;
  pendingLikeProfile: any;
  setPendingLikeProfile: (p: any) => void;
  handleLikeWithMessage: (msg: string) => void;
  matchCount: number;
  myProfile: any;
  showFeedbackModal: boolean;
  setShowFeedbackModal: (v: boolean) => void;
  feedbackProfile: any;
  setFeedbackProfile: (p: any) => void;
  upgradePrompt: any;
  dismissPrompt: () => void;
}

export default function HomeModals(props: HomeModalsProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <>
      <UpgradePromptBanner prompt={props.upgradePrompt} onDismiss={props.dismissPrompt} />

      <AnimatePresence>
        {props.showLimitPaywall && (
          <LikesLimitPaywall onClose={() => props.setShowLimitPaywall(false)} />
        )}
      </AnimatePresence>

      {props.showTutorial && (
        <TutorialTooltip steps={props.tutorialSteps} onComplete={props.completeTutorial} />
      )}

      <AnimatePresence>
        {props.showMatchCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              className="text-center gradient-hero rounded-3xl p-8 mx-4 shadow-elevated"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-8xl mb-4"
              >
                💕
              </motion.div>
              <h2 className="text-4xl font-bold text-primary-foreground mb-2">{t('admin.home.itsAMatch')}</h2>
              <p className="text-primary-foreground/80 mb-4">You both liked each other!</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => { props.setShowMatchCelebration(false); navigate(createPageUrl('Matches')); }}
                  className="bg-card text-primary hover:bg-card/90"
                >
                  Send a Message
                </Button>
                <Button
                  onClick={() => props.setShowMatchCelebration(false)}
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  Keep Swiping
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MessageWithLikeModal
        profile={props.pendingLikeProfile}
        open={props.showMessageModal}
        onSend={props.handleLikeWithMessage}
        onClose={() => { props.setShowMessageModal(false); props.setPendingLikeProfile(null); }}
      />

      <MatchMilestones userProfile={props.myProfile} newMatchCount={props.matchCount} />

      <FeedbackModal
        open={props.showFeedbackModal}
        onClose={() => { props.setShowFeedbackModal(false); props.setFeedbackProfile(null); }}
        profile={props.feedbackProfile}
        actionType="pass"
        myProfileId={props.myProfile?.id}
        onSubmit={(reasons) => console.log('Feedback submitted:', reasons)}
      />
    </>
  );
}
