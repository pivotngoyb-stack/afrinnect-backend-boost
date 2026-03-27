// @ts-nocheck
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Plus, X, Camera, ImagePlus, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import StoryRing from '@/components/stories/StoryRing';
import StoryViewer from '@/components/stories/StoryViewer';

export default function Stories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadingStory, setUploadingStory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Get current user profile
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile-stories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name, primary_photo')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  // Fetch all stories with profiles
  const { data: storyGroups = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['stories', myProfile?.id],
    queryFn: async () => {
      // 1. Get active stories
      const now = new Date().toISOString();
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_expired', false)
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!stories || stories.length === 0) return [];

      // 2. Get unique profile IDs and batch-fetch profiles
      const profileIds = [...new Set(stories.map(s => s.user_profile_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, primary_photo')
        .in('id', profileIds);

      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      // 3. Group by user
      const grouped = {};
      stories.forEach(story => {
        const profile = profileMap[story.user_profile_id];
        if (!profile) return;
        if (!grouped[story.user_profile_id]) {
          grouped[story.user_profile_id] = {
            id: story.user_profile_id,
            profile,
            stories: [],
          };
        }
        grouped[story.user_profile_id].stories.push({
          ...story,
          user_profile: profile,
        });
      });

      // 4. Sort: own story first, then unviewed, then recent
      let arr = Object.values(grouped);
      arr.sort((a, b) => {
        if (a.id === myProfile?.id) return -1;
        if (b.id === myProfile?.id) return 1;
        const aViewed = a.stories.every(s => s.views?.includes(myProfile?.id));
        const bViewed = b.stories.every(s => s.views?.includes(myProfile?.id));
        if (aViewed !== bViewed) return aViewed ? 1 : -1;
        return new Date(b.stories[0]?.created_at) - new Date(a.stories[0]?.created_at);
      });

      return arr;
    },
    enabled: !!myProfile?.id,
  });

  // Upload story
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !myProfile) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `stories/${myProfile.user_id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from('stories').insert({
        user_profile_id: myProfile.id,
        media_url: urlData.publicUrl,
        media_type: file.type.startsWith('video/') ? 'video' : 'photo',
        caption: caption || null,
        expires_at: expiresAt,
        is_expired: false,
        views: [],
      });

      if (insertError) throw insertError;

      toast.success('Story posted!');
      setCaption('');
      setUploadingStory(false);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to post story. Please try again.');
    }
    setIsUploading(false);
  };

  // Viewer navigation
  const openStoryViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(0);
    setViewerOpen(true);
  };

  const handleNext = () => {
    const currentGroup = storyGroups[activeGroupIndex];
    if (!currentGroup) return;
    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else if (activeGroupIndex < storyGroups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setActiveStoryIndex(0);
    } else {
      setViewerOpen(false);
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else if (activeGroupIndex > 0) {
      const prevGroup = storyGroups[activeGroupIndex - 1];
      setActiveGroupIndex(prev => prev - 1);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleClose = () => {
    setViewerOpen(false);
    queryClient.invalidateQueries({ queryKey: ['stories'] });
  };

  const currentStories = storyGroups[activeGroupIndex]?.stories || [];
  const myGroup = storyGroups.find(g => g.id === myProfile?.id);
  const otherGroups = storyGroups.filter(g => g.id !== myProfile?.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <ArrowLeft size={22} />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Stories</h1>
          </div>
          <Button
            onClick={() => setUploadingStory(true)}
            variant="ghost"
            size="icon"
          >
            <Camera size={22} />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6">
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
                <div className="w-14 h-2 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle size={48} className="text-destructive/50 mb-4" />
            <p className="text-foreground font-medium mb-1">Unable to load stories.</p>
            <p className="text-muted-foreground mb-4">Please try again.</p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Story Rings - Horizontal scroll */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {/* My Story */}
              {myProfile && (
                <StoryRing
                  profile={myProfile}
                  hasStory={!!myGroup}
                  isViewed={false}
                  storyCount={myGroup?.stories.length || 0}
                  isOwnProfile
                  onClick={() => {
                    if (myGroup) {
                      const idx = storyGroups.findIndex(g => g.id === myProfile.id);
                      openStoryViewer(idx);
                    } else {
                      setUploadingStory(true);
                    }
                  }}
                />
              )}

              {/* Other users */}
              {otherGroups.map((group) => {
                const isViewed = group.stories.every(s => s.views?.includes(myProfile?.id));
                const idx = storyGroups.findIndex(g => g.id === group.id);
                return (
                  <StoryRing
                    key={group.id}
                    profile={group.profile}
                    hasStory
                    isViewed={isViewed}
                    storyCount={group.stories.length}
                    onClick={() => openStoryViewer(idx)}
                  />
                );
              })}
            </div>

            {/* Empty state */}
            {storyGroups.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/80 to-primary rounded-full flex items-center justify-center">
                  <Camera className="text-primary-foreground" size={40} />
                </div>
                <h2 className="text-foreground text-xl font-semibold mb-2">No stories yet.</h2>
                <p className="text-muted-foreground mb-6">Be the first to share.</p>
                <Button
                  onClick={() => setUploadingStory(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus size={18} className="mr-2" />
                  Add Your Story
                </Button>
              </div>
            )}

            {/* Grid preview */}
            {storyGroups.length > 0 && (
              <div className="mt-6">
                <h3 className="text-muted-foreground text-sm font-medium mb-3">Recent</h3>
                <div className="grid grid-cols-3 gap-2">
                  {storyGroups.slice(0, 9).map((group, idx) => (
                    <motion.button
                      key={group.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openStoryViewer(idx)}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-muted"
                    >
                      {group.stories[0]?.media_type === 'video' ? (
                        <video
                          src={group.stories[0]?.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={group.stories[0]?.media_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                        <img
                          src={group.profile?.primary_photo}
                          alt=""
                          className="w-7 h-7 rounded-full border-2 border-card object-cover"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <span className="text-white text-xs font-medium truncate">
                          {group.id === myProfile?.id ? 'Your story' : group.profile?.display_name?.split(' ')[0]}
                        </span>
                      </div>
                      {group.stories.length > 1 && (
                        <div className="absolute top-2 right-2 bg-foreground/50 px-2 py-0.5 rounded-full text-white text-xs">
                          {group.stories.length}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground z-50 flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => setUploadingStory(false)}
                className="w-10 h-10 flex items-center justify-center"
                disabled={isUploading}
              >
                <X size={24} className="text-white" />
              </button>
              <span className="text-white font-semibold">Add to Story</span>
              <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <label htmlFor="story-file" className="w-full cursor-pointer">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-dashed border-border rounded-3xl p-16 text-center"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
                      <p className="text-white">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/80 to-primary rounded-full flex items-center justify-center">
                        <ImagePlus size={36} className="text-primary-foreground" />
                      </div>
                      <p className="text-white text-lg font-medium mb-1">Tap to select</p>
                      <p className="text-muted-foreground text-sm">Photo or video</p>
                    </>
                  )}
                </motion.div>
              </label>
              <input
                id="story-file"
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
                disabled={isUploading}
              />

              <div className="w-full mt-6">
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  disabled={isUploading}
                  className="bg-background border-border text-white placeholder:text-muted-foreground rounded-full"
                />
              </div>
            </div>

            <div className="p-6 text-center">
              <p className="text-muted-foreground text-xs">Stories disappear after 24 hours</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewerOpen && currentStories.length > 0 && (
          <StoryViewer
            stories={currentStories}
            currentIndex={activeStoryIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClose}
            myProfileId={myProfile?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
