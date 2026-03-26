import React, { useState, useMemo } from 'react';
import { Sparkles, Camera, FileText, Heart, Shield, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfileSuggestions({ userProfile, onRefresh }) {
  const [dismissedTypes, setDismissedTypes] = useState([]);

  // Generate suggestions locally from profile data - no API calls needed
  const suggestions = useMemo(() => {
    if (!userProfile) return [];
    const items = [];

    const photoCount = userProfile.photos?.length || 0;
    if (photoCount < 3) {
      items.push({ type: 'photo', title: 'Add more photos', description: 'Profiles with 3+ photos get 2x more matches.', impact: 'high', link: 'EditProfile' });
    }
    if (!userProfile.bio) {
      items.push({ type: 'bio', title: 'Write a bio', description: 'A short bio helps others connect with you.', impact: 'high', link: 'EditProfile' });
    }
    if (!userProfile.interests?.length) {
      items.push({ type: 'interests', title: 'Add interests', description: 'Shared interests boost your compatibility scores.', impact: 'medium', link: 'EditProfile' });
    }
    if (!userProfile.verification_status?.photo_verified) {
      items.push({ type: 'verification', title: 'Verify your photo', description: 'Verified profiles get 30% more likes.', impact: 'medium', link: 'VerifyPhoto' });
    }

    return items;
  }, [userProfile]);

  const visible = suggestions.filter(s => !dismissedTypes.includes(s.type));

  if (visible.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold text-green-800">Your profile looks great!</h3>
          <p className="text-sm text-green-600 mt-1">No major improvements needed right now.</p>
        </div>
      </Card>
    );
  }

  const iconMap = { photo: Camera, bio: FileText, interests: Heart, verification: Shield, activity: Activity };
  const impactColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-foreground">Profile Tips</h3>
      </div>
      {visible.map(s => {
        const Icon = iconMap[s.type] || Sparkles;
        return (
          <Card key={s.type} className="p-3">
            <div className="flex gap-3 items-start">
              <div className={`p-2 rounded-lg shrink-0 ${s.impact === 'high' ? 'bg-red-100' : 'bg-amber-100'}`}>
                <Icon className={`w-4 h-4 ${s.impact === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{s.title}</h4>
                  <button onClick={() => setDismissedTypes(prev => [...prev, s.type])} className="text-xs text-muted-foreground">×</button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                {s.link && (
                  <Link to={createPageUrl(s.link)}>
                    <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">Take action</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
