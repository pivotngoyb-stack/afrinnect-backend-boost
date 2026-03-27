// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileMini from '@/components/profile/ProfileMini';
import ProfileCard from '@/components/profile/ProfileCard';

interface GridViewProps {
  profiles: any[];
  myProfile: any;
  selectedProfile: any;
  setSelectedProfile: (p: any) => void;
  handleLike: (p: any) => void;
  handleSuperLike: (p: any) => void;
}

const GridView = React.forwardRef<HTMLDivElement, GridViewProps>(function GridView({
  profiles, myProfile, selectedProfile, setSelectedProfile,
  handleLike, handleSuperLike,
}, ref) {
  return (
    <>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {profiles.map(profile => (
            <ProfileMini
              key={profile.id}
              profile={profile}
              myLocation={myProfile?.location}
              onClick={() => setSelectedProfile(profile)}
            />
          ))}
          {profiles.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-muted-foreground">No profiles found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ProfileCard
                profile={selectedProfile}
                myLocation={myProfile?.location}
                onLike={() => { handleLike(selectedProfile); setSelectedProfile(null); }}
                onPass={() => setSelectedProfile(null)}
                onSuperLike={() => { handleSuperLike(selectedProfile); setSelectedProfile(null); }}
                expanded
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
