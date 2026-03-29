// @ts-nocheck
import React from 'react';
import { format, isToday, isYesterday, formatDistanceToNowStrict } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import VerificationBadge from '../shared/VerificationBadge';

const ConversationItem = React.forwardRef(function ConversationItem({ match, profile, lastMessage, unreadCount = 0, onClick }, ref) {
  const formatMessageDate = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '--';
      if (isToday(d)) return format(d, 'HH:mm');
      if (isYesterday(d)) return 'Yesterday';
      return format(d, 'MMM d');
    } catch {
      return '--';
    }
  };

  const truncateMessage = (text, maxLength = 40, isPremium = true) => {
    if (!text) return 'Say hello! 👋';
    if (!isPremium && text.length > 15) {
      const words = text.split(' ');
      if (words.length > 3) return words.slice(0, 3).join(' ') + ' •••';
    }
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Online status logic
  const lastActiveDate = profile?.last_active ? new Date(profile.last_active) : null;
  const isOnline = !!lastActiveDate && (Date.now() - lastActiveDate.getTime()) < 10 * 60 * 1000;
  const lastActiveText = lastActiveDate && !isOnline
    ? formatDistanceToNowStrict(lastActiveDate, { addSuffix: false })
    : null;

  const photo = profile?.primary_photo || profile?.photos?.[0] || '/placeholder.svg';

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-muted active:bg-muted transition-colors ${
        unreadCount > 0 ? 'bg-primary/5' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <img 
          src={photo}
          alt={profile?.display_name}
          className="w-16 h-16 rounded-full object-cover"
        />
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className={`font-semibold truncate text-foreground`}>
              {profile?.display_name}
            </h3>
            <VerificationBadge verification={profile?.verification_status} size="small" />
            {isOnline && (
              <span className="text-[10px] font-medium text-green-500">Online</span>
            )}
            {!isOnline && lastActiveText && (
              <span className="text-[10px] text-muted-foreground">{lastActiveText} ago</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatMessageDate(lastMessage?.created_at || lastMessage?.created_date || match?.matched_at)}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            {truncateMessage(lastMessage?.content)}
          </p>
          {unreadCount > 0 && (
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConversationItem;
