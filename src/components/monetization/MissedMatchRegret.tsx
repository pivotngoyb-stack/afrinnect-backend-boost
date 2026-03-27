import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

interface Props {
  show: boolean;
  onClose: () => void;
  matchScore?: number;
}

export default function MissedMatchRegret({ show, onClose, matchScore = 95 }: Props) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm relative"
        >
          <div className="bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
            {/* Blurred profile teaser */}
            <div className="relative h-56 bg-gradient-to-br from-pink-400 via-purple-400 to-amber-400">
              <div className="absolute inset-0 backdrop-blur-3xl bg-foreground/20 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-20 h-20 rounded-full bg-card/20 backdrop-blur-xl flex items-center justify-center mb-3"
                >
                  <Heart size={36} className="text-white" fill="white" />
                </motion.div>
                <div className="bg-card/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                  <span className="text-white font-bold text-lg flex items-center gap-1.5">
                    <Sparkles size={16} />
                    {matchScore}% Match
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 text-center">
              <h3 className="text-xl font-bold text-foreground mb-1">
                You just missed a {matchScore}% match! 💔
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This person matched almost perfectly with your preferences. 
                With Premium, you'd never miss connections like this.
              </p>

              <div className="bg-muted/50 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shared interests</span>
                  <span className="font-semibold text-foreground">5 in common</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Compatibility</span>
                  <span className="font-semibold text-primary">{matchScore}%</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-semibold text-foreground">Nearby</span>
                </div>
              </div>

              <Link to={createPageUrl('PricingPlans')}>
                <Button className="w-full py-5 text-base shadow-lg gap-2">
                  <Crown size={18} />
                  Unlock Unlimited Likes
                </Button>
              </Link>

              <button
                onClick={onClose}
                className="mt-3 text-sm text-muted-foreground hover:text-foreground"
              >
                I'm okay missing matches
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
