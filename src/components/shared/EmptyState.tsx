import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          {Icon && (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Icon size={40} className="text-primary" />
            </div>
          )}
          <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
          {actionLabel && onAction && (
            <Button onClick={onAction} className="bg-primary hover:bg-primary/90">
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
