// @ts-nocheck
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

interface Props {
  show: boolean;
  onClose: () => void;
}

/**
 * MissedMatchRegret — upgrade prompt shown when daily like limit is hit.
 * No fabricated match scores, shared interests, or distance claims.
 */
export default function MissedMatchRegret({ show, onClose }: Props) {
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
            <div className="relative h-40 bg-gradient-to-br from-pink-400 via-purple-400 to-amber-400">
              <div className="absolute inset-0 backdrop-blur-3xl bg-foreground/20 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-full bg-card/20 backdrop-blur-xl flex items-center justify-center"
                >
                  <Heart size={32} className="text-white" fill="white" />
                </motion.div>
              </div>
            </div>

            <div className="p-5 text-center">
              <h3 className="text-xl font-bold text-foreground mb-1">
                You've used all your daily likes
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                Upgrade to Premium for more likes and never miss a potential connection.
              </p>

              <Link to={createPageUrl('PricingPlans')}>
                <Button className="w-full py-5 text-base shadow-lg gap-2">
                  <Crown size={18} />
                  See Premium Plans
                </Button>
              </Link>

              <button
                onClick={onClose}
                className="mt-3 text-sm text-muted-foreground hover:text-foreground"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
