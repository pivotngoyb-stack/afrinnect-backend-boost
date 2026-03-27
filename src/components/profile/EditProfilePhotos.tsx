// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function EditProfilePhotos({
  photos = [],
  primaryPhoto,
  uploading,
  onPhotoUpload,
  onRemovePhoto,
  onSetPrimary,
  onReorder
}: {
  photos?: string[];
  primaryPhoto?: string;
  uploading?: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (idx: number) => void;
  onSetPrimary: (photo: string) => void;
  onReorder?: () => void;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-card/80 backdrop-blur">
      <div className="bg-gradient-to-r from-primary to-accent p-6">
        <div className="flex items-center gap-3 text-primary-foreground">
          <div className="p-3 bg-card/20 rounded-xl backdrop-blur">
            <Camera size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Your Photos</h2>
            <p className="text-sm opacity-80">Add up to 6 photos (4:5 ratio recommended)</p>
            <p className="text-xs opacity-60 mt-1">💡 Keep important details in the top half of the photo</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {photos.map((photo, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-lg"
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/40 md:bg-foreground/50 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onSetPrimary(photo)} className="rounded-full h-8 px-3 text-xs">
                    <Sparkles size={12} className="mr-1" /> Main
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onRemovePhoto(idx)} className="rounded-full h-8 w-8 p-0">
                    <X size={14} />
                  </Button>
                </div>
                {photo === primaryPhoto && (
                  <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground border-0 shadow-lg z-10">
                    <Sparkles size={10} className="mr-1" /> Main
                  </Badge>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {photos.length < 6 && (
            <motion.label
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-[3/4] rounded-2xl border-3 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" disabled={uploading} />
              {uploading ? (
                <Loader2 className="animate-spin text-primary" size={32} />
              ) : (
                <>
                  <div className="p-4 bg-primary/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Camera size={28} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">Add Photo</span>
                </>
              )}
            </motion.label>
          )}
        </div>
        
        {photos.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-4">
            ✨ Add at least 3 photos to stand out and get more matches
          </p>
        )}
        
        {photos.length > 1 && onReorder && (
          <div className="text-center mt-4">
            <Button variant="outline" onClick={onReorder}>Reorder Photos</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
