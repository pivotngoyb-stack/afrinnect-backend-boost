import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Search, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import CountryFlag from '@/components/shared/CountryFlag';

export default function Explore() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-explore'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch global profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['explore-profiles', currentUser?.id],
    queryFn: async () => {
      // Calculate the max birth_date for 18+ (must be born on or before this date)
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      const maxBirthDate = eighteenYearsAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name, primary_photo, country_of_origin, current_city, bio, birth_date')
        .eq('is_active', true)
        .eq('is_banned', false)
        .neq('user_id', currentUser?.id || '')
        .lte('birth_date', maxBirthDate)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // Get unique countries
  const countries = [...new Set(profiles.map(p => p.country_of_origin).filter(Boolean))].sort();

  // Filter profiles
  const filtered = profiles.filter(p => {
    if (selectedCountry && p.country_of_origin !== selectedCountry) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.display_name?.toLowerCase().includes(q) ||
        p.country_of_origin?.toLowerCase().includes(q) ||
        p.current_city?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group by country
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach(p => {
    const country = p.country_of_origin || 'Unknown';
    if (!grouped[country]) grouped[country] = [];
    grouped[country].push(p);
  });
  const sortedCountries = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-primary" />
              <h1 className="text-lg font-bold text-foreground">Explore Globally</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, country, or city..."
              className="pl-9"
            />
          </div>

          {/* Country filter chips */}
          {countries.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <Button
                variant={selectedCountry === null ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 text-xs h-8"
                onClick={() => setSelectedCountry(null)}
              >
                All ({profiles.length})
              </Button>
              {countries.map(c => (
                <Button
                  key={c}
                  variant={selectedCountry === c ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0 text-xs h-8 gap-1"
                  onClick={() => setSelectedCountry(selectedCountry === c ? null : c)}
                >
                  <CountryFlag country={c} showName={false} size="small" />
                  {c} ({grouped[c]?.length || profiles.filter(p => p.country_of_origin === c).length})
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={48} className="text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              {search || selectedCountry ? 'No matching profiles found' : 'Profiles are loading...'}
            </p>
            <p className="text-muted-foreground mb-4">
              {search || selectedCountry 
                ? 'Try adjusting your search or filters to find more people'
                : 'New members join every day — check back soon!'}
            </p>
            {(search || selectedCountry) && (
              <Button variant="outline" onClick={() => { setSearch(''); setSelectedCountry(null); }}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCountries.map(country => (
              <div key={country}>
                <div className="flex items-center gap-2 mb-3">
                  <CountryFlag country={country} showName={false} size="small" />
                  <h2 className="font-semibold text-foreground">{country}</h2>
                  <span className="text-xs text-muted-foreground">({grouped[country].length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {grouped[country].map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => navigate(`/profile?id=${profile.id}`)}
                      className="bg-card border border-border rounded-xl p-3 text-left hover:shadow-md transition-shadow active:scale-[0.98]"
                    >
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage src={profile.primary_photo} alt={profile.display_name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {profile.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm text-foreground text-center truncate">
                        {profile.display_name || 'User'}
                      </p>
                      {profile.current_city && (
                        <p className="text-xs text-muted-foreground text-center truncate">{profile.current_city}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
