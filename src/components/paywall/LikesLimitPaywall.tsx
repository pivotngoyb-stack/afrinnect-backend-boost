// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Crown, Heart, Sparkles, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LikesLimitPaywall({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md relative"
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-background rounded-full shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <Card className="overflow-hidden border-0 shadow-2xl">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
              <Heart size={40} className="text-primary-foreground" fill="currentColor" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Daily Like Limit Reached
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Upgrade for more likes and unlock premium features to connect with more people.
            </p>

            <div className="space-y-3 mb-6">
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-primary" />
                    <span className="font-bold text-foreground">Premium</span>
                  </div>
                  <span className="text-sm text-muted-foreground">$14.99/mo</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-left text-muted-foreground">
                  <span>• 50 likes/day</span>
                  <span>• 100 messages/day</span>
                  <span>• See who likes you</span>
                  <span>• 5 rewinds/day</span>
                </div>
              </div>

              <div className="bg-accent/10 rounded-xl p-4 border-2 border-accent relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  MOST POPULAR
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-accent" />
                    <span className="font-bold text-foreground">Elite</span>
                  </div>
                  <span className="text-sm text-muted-foreground">$24.99/mo</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-left text-muted-foreground">
                  <span>• <strong>Unlimited</strong> likes</span>
                  <span>• <strong>Unlimited</strong> messages</span>
                  <span>• <strong>Unlimited</strong> rewinds</span>
                  <span>• Priority ranking</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Your like limit resets tomorrow at midnight UTC
            </p>

            <Link to={createPageUrl('PricingPlans')}>
              <Button className="w-full py-6 text-lg shadow-lg mb-3">
                <Crown size={22} className="mr-2" />
                Upgrade Now
              </Button>
            </Link>

            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
              I'll wait until tomorrow
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
