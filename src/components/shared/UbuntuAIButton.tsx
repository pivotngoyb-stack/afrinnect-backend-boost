import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

export default function UbuntuAIButton() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
    >
      <Link to="/supportchat">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-br from-primary to-amber-600 hover:from-primary/90 hover:to-amber-700"
          title="Chat with Ubuntu AI"
        >
          <Sparkles size={24} className="text-white" />
        </Button>
      </Link>
    </motion.div>
  );
}
