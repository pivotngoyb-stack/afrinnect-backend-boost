// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Crown, MessageCircle, Infinity, Send, Heart, Sparkles, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MessageLimitPaywall({ onClose, matchName }: { onClose: () => void; matchName?: string }) {
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
              <MessageCircle size={40} className="text-primary-foreground" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Daily Message Limit Reached
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {matchName 
                ? `Upgrade to keep chatting with ${matchName} and all your matches.` 
                : 'Upgrade to send unlimited messages to your matches.'}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-3">
                <Infinity size={14} className="text-primary" />
                <span className="text-foreground">Unlimited messages</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-3">
                <Send size={14} className="text-primary" />
                <span className="text-foreground">Read receipts</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-3">
                <Heart size={14} className="text-primary" />
                <span className="text-foreground">More daily likes</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-3">
                <Crown size={14} className="text-accent" />
                <span className="text-foreground">Premium badge</span>
              </div>
            </div>

            <Link to={createPageUrl('PricingPlans')}>
              <Button className="w-full py-6 text-lg shadow-lg mb-3">
                <Sparkles size={20} className="mr-2" />
                Upgrade Now
              </Button>
            </Link>

            <p className="text-xs text-muted-foreground mb-3">
              Your limit resets tomorrow at midnight UTC
            </p>

            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground text-sm">
              Maybe later
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
