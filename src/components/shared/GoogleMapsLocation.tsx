// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from 'lucide-react';

export default function GoogleMapsLocation({ 
  onLocationSelect, 
  initialLocation = null,
  height = '300px',
  showSearch = true,
  apiKey = ''
}) {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = async () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          initializeMap();
        }
      }, 100);
      return;
    }

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(initializeMap, 100);
      script.onerror = () => { setError('Failed to load Google Maps'); setLoading(false); };
      document.head.appendChild(script);
    } catch (err) {
      console.error('Failed to load Google Maps:', err);
      setError('Failed to initialize Google Maps');
      setLoading(false);
    }
  };

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) {
      setError('Google Maps not available');
      setLoading(false);
      return;
    }

    try {
      const defaultCenter = initialLocation || { lat: 6.5244, lng: 3.3792 };

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
      });

      const markerInstance = new window.google.maps.Marker({
        map: mapInstance, position: defaultCenter, draggable: true
      });

      const reverseGeocode = async (lat, lng) => {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const response = await geocoder.geocode({ location: { lat, lng } });
          return response.results?.[0]?.formatted_address || null;
        } catch (e) { return null; }
      };

      mapInstance.addListener('click', async (e) => {
        const lat = e.latLng.lat(); const lng = e.latLng.lng();
        markerInstance.setPosition({ lat, lng });
        const address = await reverseGeocode(lat, lng);
        onLocationSelect?.({ lat, lng, address });
      });

      markerInstance.addListener('dragend', async (e) => {
        const lat = e.latLng.lat(); const lng = e.latLng.lng();
        const address = await reverseGeocode(lat, lng);
        onLocationSelect?.({ lat, lng, address });
      });

      if (showSearch && searchInputRef.current) {
        const searchBoxInstance = new window.google.maps.places.SearchBox(searchInputRef.current);
        mapInstance.addListener('bounds_changed', () => searchBoxInstance.setBounds(mapInstance.getBounds()));
        searchBoxInstance.addListener('places_changed', () => {
          const places = searchBoxInstance.getPlaces();
          if (!places?.length) return;
          const place = places[0];
          if (!place.geometry?.location) return;
          const location = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), address: place.formatted_address };
          mapInstance.setCenter(location); mapInstance.setZoom(15);
          markerInstance.setPosition(location); onLocationSelect?.(location);
        });
      }

      setMap(mapInstance); setMarker(markerInstance); setLoading(false);
    } catch (err) {
      setError('Error initializing map'); setLoading(false);
    }
  }, [initialLocation, showSearch, onLocationSelect]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (map && marker) { map.setCenter(location); marker.setPosition(location); onLocationSelect?.(location); }
        setLoading(false);
      },
      () => { setLoading(false); }
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {showSearch && (
        <div className="mb-3 flex gap-2">
          <input ref={searchInputRef} type="text" placeholder="Search for a place..." className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background" />
          <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          </Button>
        </div>
      )}
      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg border border-border bg-muted" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const geocodeAddress = async (address) => {
    if (!window.google?.maps) throw new Error('Google Maps not loaded');
    setLoading(true);
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        setLoading(false);
        if (status === 'OK' && results[0]) {
          resolve({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng(), formatted_address: results[0].formatted_address });
        } else { reject(new Error(`Geocoding failed: ${status}`)); }
      });
    });
  };
  return { geocodeAddress, loading };
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
