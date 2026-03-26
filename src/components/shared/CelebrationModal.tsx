import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

export default function CelebrationModal({ isOpen, onClose, title, message, emoji, action }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl p-8 mx-4 shadow-2xl max-w-md text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-7xl mb-4"
            >
              {emoji}
            </motion.div>
            <h2 className="text-3xl font-bold text-foreground mb-3">{title}</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            {action && (
              <Button onClick={action.onClick} className={action.className || "bg-primary hover:bg-primary/90 w-full py-6"}>
                {action.label}
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" className="mt-3">Close</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
