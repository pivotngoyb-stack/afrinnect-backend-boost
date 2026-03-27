// @ts-nocheck
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileCompletionBar from '@/components/engagement/ProfileCompletionBar';
import DailyReturnBanner from '@/components/engagement/DailyReturnBanner';
import LiveActivityFeed from '@/components/engagement/LiveActivityFeed';
import PeopleLikeYouTeaser from '@/components/engagement/PeopleLikeYouTeaser';
import ProfileViewsNudge from '@/components/engagement/ProfileViewsNudge';
import ActivitySummaryBanner from '@/components/monetization/ActivitySummaryBanner';

interface ActivityDrawerProps {
  userProfile: any;
}

export default function ActivityDrawer({ userProfile }: ActivityDrawerProps) {
  if (!userProfile) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border flex-shrink-0 relative">
          <Activity size={16} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-lg">Your Activity</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <ActivitySummaryBanner userProfile={userProfile} />
          <ProfileCompletionBar userProfile={userProfile} />
          <DailyReturnBanner userProfile={userProfile} />
          <PeopleLikeYouTeaser userProfile={userProfile} />
          <ProfileViewsNudge userProfile={userProfile} />
          <LiveActivityFeed userProfile={userProfile} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
