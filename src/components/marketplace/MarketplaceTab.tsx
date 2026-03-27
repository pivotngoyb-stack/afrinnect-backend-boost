import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, Search, MapPin, Star, Heart, Phone, Globe, ExternalLink, 
  Filter, ChevronRight, Loader2, Navigation, Clock, DollarSign, BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'restaurant', label: '🍽️ Restaurants', emoji: '🍽️' },
  { value: 'salon', label: '💇 Hair & Beauty', emoji: '💇' },
  { value: 'grocery', label: '🛒 African Grocery', emoji: '🛒' },
  { value: 'fashion', label: '👗 Fashion & Attire', emoji: '👗' },
  { value: 'services', label: '🔧 Services', emoji: '🔧' },
  { value: 'health', label: '🏥 Health & Wellness', emoji: '🏥' },
  { value: 'education', label: '📚 Education', emoji: '📚' },
  { value: 'entertainment', label: '🎵 Entertainment', emoji: '🎵' },
  { value: 'travel', label: '✈️ Travel & Tours', emoji: '✈️' },
  { value: 'finance', label: '💰 Money Transfer', emoji: '💰' },
  { value: 'realestate', label: '🏠 Real Estate', emoji: '🏠' },
  { value: 'legal', label: '⚖️ Legal & Immigration', emoji: '⚖️' },
  { value: 'tech', label: '💻 Tech Services', emoji: '💻' },
  { value: 'other', label: '📦 Other', emoji: '📦' },
];

function getCategoryInfo(cat: string) {
  return CATEGORIES.find(c => c.value === cat) || { value: cat, label: cat, emoji: '📦' };
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

interface MarketplaceTabProps {
  currentUser: any;
}

export default function MarketplaceTab({ currentUser }: MarketplaceTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [nearMeRadius, setNearMeRadius] = useState(40); // km
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['marketplace-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_businesses')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['business-favorites', currentUser?.auth_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_favorites')
        .select('business_id')
        .eq('user_id', currentUser!.auth_id);
      if (error) throw error;
      return (data || []).map(f => f.business_id);
    },
    enabled: !!currentUser?.auth_id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['business-reviews', selectedBusiness?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_reviews')
        .select('*')
        .eq('business_id', selectedBusiness!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedBusiness?.id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (businessId: string) => {
      const isFav = favorites.includes(businessId);
      if (isFav) {
        await supabase.from('business_favorites').delete()
          .eq('user_id', currentUser.auth_id).eq('business_id', businessId);
      } else {
        await supabase.from('business_favorites').insert({
          user_id: currentUser.auth_id, business_id: businessId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-favorites'] });
      toast({ title: 'Updated favorites' });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('business_reviews').insert({
        user_id: currentUser.auth_id,
        user_profile_id: currentUser.id,
        business_id: selectedBusiness.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-reviews'] });
      toast({ title: 'Review submitted!' });
      setShowReviewDialog(false);
      setReviewComment('');
      setReviewRating(5);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleNearMeToggle = (enabled: boolean) => {
    setNearMeEnabled(enabled);
    if (enabled && !userLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          toast({ title: 'Location unavailable', description: 'Please enable location services', variant: 'destructive' });
          setNearMeEnabled(false);
        }
      );
    }
  };

  const filteredBusinesses = useMemo(() => {
    let filtered = businesses.filter(b => {
      const matchesSearch = !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
      const matchesFavorites = !favoritesOnly || favorites.includes(b.id);
      return matchesSearch && matchesCategory && matchesFavorites;
    });

    if (nearMeEnabled && userLocation) {
      filtered = filtered
        .filter(b => b.latitude && b.longitude)
        .map(b => ({
          ...b,
          distance: getDistanceKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
        }))
        .filter(b => b.distance <= nearMeRadius)
        .sort((a, b) => a.distance - b.distance);
    }

    return filtered;
  }, [businesses, searchQuery, categoryFilter, nearMeEnabled, userLocation, nearMeRadius, favoritesOnly, favorites]);

  const featuredBusinesses = filteredBusinesses.filter(b => b.is_featured);
  const regularBusinesses = filteredBusinesses.filter(b => !b.is_featured);

  const renderBusinessCard = (business: any) => {
    const catInfo = getCategoryInfo(business.category);
    const isFav = favorites.includes(business.id);

    return (
      <Card 
        key={business.id}
        className="hover:shadow-md transition-all border-border cursor-pointer active:scale-[0.98]"
        onClick={() => setSelectedBusiness(business)}
      >
        <CardContent className="p-4">
          <div className="flex gap-3">
            {business.image_url ? (
              <img src={business.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {catInfo.emoji}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate flex items-center gap-1">
                    {business.name}
                    {business.is_verified && <BadgeCheck size={14} className="text-primary shrink-0" />}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{catInfo.label.replace(/^.+\s/, '')}</Badge>
                    {business.price_range && (
                      <span className="text-[10px] text-muted-foreground">{business.price_range}</span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                  onClick={(e) => { e.stopPropagation(); toggleFavoriteMutation.mutate(business.id); }}
                >
                  <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} />
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                {business.average_rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {Number(business.average_rating).toFixed(1)}
                    <span className="text-muted-foreground/60">({business.total_reviews})</span>
                  </span>
                )}
                {(business.city || business.country) && (
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin size={11} />
                    {[business.city, business.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {business.distance !== undefined && (
                  <span className="flex items-center gap-0.5 text-primary font-medium">
                    <Navigation size={11} />
                    {formatDistance(business.distance)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {business.is_featured && (
            <Badge className="mt-2 bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">
              ⭐ Featured Business
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search businesses, cities, tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 rounded-full text-xs h-8"
            onClick={() => setCategoryFilter('all')}
          >
            All
          </Button>
          {CATEGORIES.map(cat => (
            <Button
              key={cat.value}
              variant={categoryFilter === cat.value ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 rounded-full text-xs h-8"
              onClick={() => setCategoryFilter(cat.value)}
            >
              {cat.emoji} {cat.label.replace(/^.+\s/, '')}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="near-me" checked={nearMeEnabled} onCheckedChange={handleNearMeToggle} />
            <Label htmlFor="near-me" className="text-xs font-medium flex items-center gap-1">
              <Navigation size={12} /> Near Me
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="favorites-only" checked={favoritesOnly} onCheckedChange={setFavoritesOnly} />
            <Label htmlFor="favorites-only" className="text-xs font-medium flex items-center gap-1">
              <Heart size={12} /> Saved
            </Label>
          </div>
          {nearMeEnabled && (
            <Select value={String(nearMeRadius)} onValueChange={v => setNearMeRadius(Number(v))}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="40">40 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No businesses found"
          description={searchQuery ? `No results for "${searchQuery}"` : favoritesOnly ? "You haven't saved any businesses yet" : "No businesses available in this area yet"}
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <div className="space-y-3">
          {featuredBusinesses.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Featured</h3>
              {featuredBusinesses.map(b => renderBusinessCard(b))}
            </>
          )}
          {regularBusinesses.length > 0 && (
            <>
              {featuredBusinesses.length > 0 && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">All Businesses</h3>
              )}
              {regularBusinesses.map(b => renderBusinessCard(b))}
            </>
          )}
        </div>
      )}

      {/* Business Detail Dialog */}
      <Dialog open={!!selectedBusiness} onOpenChange={(open) => !open && setSelectedBusiness(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedBusiness && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedBusiness.name}
                  {selectedBusiness.is_verified && <BadgeCheck size={18} className="text-primary" />}
                </DialogTitle>
              </DialogHeader>

              {selectedBusiness.image_url && (
                <img src={selectedBusiness.image_url} alt="" className="w-full h-48 object-cover rounded-lg" />
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{getCategoryInfo(selectedBusiness.category).label}</Badge>
                  {selectedBusiness.price_range && <Badge variant="outline">{selectedBusiness.price_range}</Badge>}
                  {selectedBusiness.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
                </div>

                {selectedBusiness.description && (
                  <p className="text-sm text-muted-foreground">{selectedBusiness.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  {selectedBusiness.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={14} className="shrink-0" />
                      <span>{selectedBusiness.address}, {selectedBusiness.city}, {selectedBusiness.country}</span>
                    </div>
                  )}
                  {selectedBusiness.phone && (
                    <a href={`tel:${selectedBusiness.phone}`} className="flex items-center gap-2 text-primary">
                      <Phone size={14} />{selectedBusiness.phone}
                    </a>
                  )}
                  {selectedBusiness.email && (
                    <a href={`mailto:${selectedBusiness.email}`} className="flex items-center gap-2 text-primary">
                      <Globe size={14} />{selectedBusiness.email}
                    </a>
                  )}
                  {selectedBusiness.website && (
                    <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary">
                      <ExternalLink size={14} />Visit Website
                    </a>
                  )}
                </div>

                {selectedBusiness.tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {selectedBusiness.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => {
                    toggleFavoriteMutation.mutate(selectedBusiness.id);
                  }}>
                    <Heart size={14} className={`mr-1 ${favorites.includes(selectedBusiness.id) ? 'fill-current' : ''}`} />
                    {favorites.includes(selectedBusiness.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowReviewDialog(true)}>
                    <Star size={14} className="mr-1" /> Review
                  </Button>
                  {selectedBusiness.phone && (
                    <Button variant="outline" asChild>
                      <a href={`tel:${selectedBusiness.phone}`}><Phone size={14} /></a>
                    </Button>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Star size={14} className="text-amber-400" />
                    Reviews ({reviews.length})
                    {selectedBusiness.average_rating > 0 && (
                      <span className="text-muted-foreground font-normal ml-1">
                        Avg: {Number(selectedBusiness.average_rating).toFixed(1)}
                      </span>
                    )}
                  </h4>
                  {reviews.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {reviews.map(r => (
                        <div key={r.id} className="bg-muted/50 rounded-lg p-2.5">
                          <div className="flex items-center gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={10} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                            ))}
                            <span className="text-[10px] text-muted-foreground ml-1">
                              {new Date(r.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Rating</Label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} className="p-1">
                    <Star size={24} className={n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review-comment" className="text-sm">Comment (optional)</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => submitReviewMutation.mutate()}
              disabled={submitReviewMutation.isPending}
            >
              {submitReviewMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
