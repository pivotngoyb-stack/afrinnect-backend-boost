// @ts-nocheck
import React from 'react';
import { MapPin, Heart } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import VerificationBadge from '../shared/VerificationBadge';
import CountryFlag from '../shared/CountryFlag';

const ProfileMini = React.memo(function ProfileMini({ profile, myLocation, onClick }: any) {
  const distance = React.useMemo(() => {
    if (!myLocation?.lat || !myLocation?.lng || !profile?.location?.lat || !profile?.location?.lng) return null;
    const R = 3959;
    const dLat = (profile.location.lat - myLocation.lat) * Math.PI / 180;
    const dLon = (profile.location.lng - myLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(myLocation.lat * Math.PI / 180) * Math.cos(profile.location.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }, [myLocation, profile?.location]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(profile?.birth_date);
  const photo = profile?.primary_photo || profile?.photos?.[0] || '/placeholder.svg';

  const relationshipLabels: Record<string, string> = {
    dating: 'Dating', serious_relationship: 'Serious', marriage: 'Marriage', friendship: 'Friends', networking: 'Network'
  };

  return (
    <div onClick={onClick} className="relative bg-card rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group">
      <div className="relative aspect-[3/4]">
        <img src={photo} alt={profile?.display_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <VerificationBadge verification={profile?.verification_status} size="small" />
        </div>
        {profile?.is_active && (
          <div className="absolute top-3 left-3 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate">{profile?.display_name}</h3>
            {age && <span className="font-light">{age}</span>}
          </div>
          <div className="flex flex-col gap-0.5 mb-2">
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <CountryFlag country={profile?.country_of_origin} size="small" showName={false} />
              <span className="truncate">{profile?.current_city}</span>
            </div>
            {distance !== null && (
              <div className="flex items-center gap-1 text-white/70 text-[10px]">
                <MapPin size={10} />
                <span>{distance} mi away</span>
              </div>
            )}
          </div>
          {profile?.relationship_goal && (
            <Badge className="bg-primary/70 text-primary-foreground text-xs border-0">
              <Heart size={10} className="mr-1" />
              {relationshipLabels[profile.relationship_goal]}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProfileMini;
