// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ProfileCardSkeleton() {
  return (
    <Card className="max-w-sm mx-auto overflow-hidden">
      <div className="aspect-[3/4] bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

export function EventCardSkeleton() {
  return (
    <Card>
      <div className="h-48 bg-muted animate-pulse" />
      <CardHeader>
        <div className="h-5 bg-muted rounded animate-pulse w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
      </CardContent>
    </Card>
  );
}

export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-4 bg-background rounded-lg border animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[0, 1, 0, 1, 0].map((align, idx) => (
        <div key={idx} className={`flex ${align ? 'justify-end' : 'justify-start'}`}>
          <div className={`h-12 ${align ? 'bg-primary/20' : 'bg-muted'} rounded-2xl animate-pulse w-48`} />
        </div>
      ))}
    </div>
  );
}
