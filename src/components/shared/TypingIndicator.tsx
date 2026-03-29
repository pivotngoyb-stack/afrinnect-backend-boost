import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  name?: string;
}

const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  function TypingIndicator({ name }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2 px-4 py-2 bg-background rounded-2xl shadow max-w-xs"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{ y: ['0%', '-50%', '0%'] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{name} is typing...</span>
      </motion.div>
    );
  }
);

export default TypingIndicator;
