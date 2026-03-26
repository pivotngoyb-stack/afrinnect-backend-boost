import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BlockedUsers() {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState(null);
  const [userToUnblock, setUserToUnblock] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data } = await supabase
        .from('user_profiles')
        .select('id, user_id, blocked_users')
        .eq('user_id', user.id)
        .single();
      if (data) setMyProfile(data);
    };
    fetchProfile();
  }, [navigate]);

  const { data: blockedProfiles = [], isLoading } = useQuery({
    queryKey: ['blocked-users', myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.blocked_users?.length) return [];
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, primary_photo')
        .in('id', myProfile.blocked_users);
      return data || [];
    },
    enabled: !!myProfile
  });

  const unblockMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke('block-user', {
        body: { action: 'unblock', target_profile_id: profileId }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: async () => {
      toast.success('User unblocked');
      // Refetch profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, user_id, blocked_users')
          .eq('user_id', user.id)
          .single();
        if (data) setMyProfile(data);
      }
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to unblock user'),
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft size={22} />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Blocked Users</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : blockedProfiles.length === 0 ? (
          <Card className="text-center py-12 border-border">
            <CardContent>
              <UserX size={48} className="mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No blocked users</h3>
              <p className="text-muted-foreground">You haven't blocked anyone yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {blockedProfiles.map(profile => (
              <Card key={profile.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.primary_photo} />
                        <AvatarFallback className="bg-primary/10 text-primary">{profile.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{profile.display_name}</p>
                        <p className="text-sm text-muted-foreground">Blocked</p>
                      </div>
                    </div>
                    <Button onClick={() => setUserToUnblock(profile)} variant="outline" size="sm">
                      Unblock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!userToUnblock} onOpenChange={(open) => !open && setUserToUnblock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {userToUnblock?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to see your profile and contact you again. You can block them again anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                unblockMutation.mutate(userToUnblock.id);
                setUserToUnblock(null);
              }}
              disabled={unblockMutation.isPending}
            >
              {unblockMutation.isPending ? <><Loader2 size={16} className="animate-spin mr-2" />Unblocking...</> : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
