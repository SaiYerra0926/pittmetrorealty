import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initGoogleMapsPropertyLocation: () => void;
  }
}

interface PropertyLocationMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  className?: string;
  height?: string;
}

const PropertyLocationMap: React.FC<PropertyLocationMapProps> = ({
  latitude,
  longitude,
  address,
  city,
  state,
  zipCode,
  className = '',
  height = 'h-64'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Google Maps API
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.Map) {
      setIsMapLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          setIsMapLoaded(true);
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google || !window.google.maps) {
          setIsLoading(false);
        }
      }, 5000);
      
      return () => clearInterval(checkInterval);
    }

    // Load Google Maps API
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Map will not load.');
      setIsLoading(false);
      return;
    }
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMapsPropertyLocation`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API.');
      setIsMapLoaded(false);
      setIsLoading(false);
    };

    window.initGoogleMapsPropertyLocation = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        setIsMapLoaded(true);
        setIsLoading(false);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (window.initGoogleMapsPropertyLocation) {
        delete window.initGoogleMapsPropertyLocation;
      }
    };
  }, []);

  // Initialize and update map when coordinates are available
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    // Check for valid coordinates
    const lat = latitude;
    const lng = longitude;
    const hasCoordinates = lat && lng && !isNaN(lat) && !isNaN(lng) &&
                           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

    if (hasCoordinates) {
      // Use exact coordinates
      console.log('📍 Using exact coordinates:', { lat, lng });
      initializeMap(lat, lng);
      return;
    }

    // Try to geocode address if coordinates not available
    // Build address string from available fields
    const addressParts: string[] = [];
    if (address) addressParts.push(address.trim());
    if (city) addressParts.push(city.trim());
    if (state) addressParts.push(state.trim());
    if (zipCode) addressParts.push(zipCode.trim());
    
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ').trim() : '';
    
    if (fullAddress) {
      console.log('🔄 Geocoding address:', fullAddress);
      
      // Wait for Google Maps Geocoder to be available
      if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
        // Wait a bit for Google Maps to fully load
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.Geocoder) {
            clearInterval(checkInterval);
            performGeocoding(fullAddress);
          }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 5000);
        return;
      }
      
      performGeocoding(fullAddress);
    } else {
      console.warn('⚠️ No coordinates or address available for map');
    }

    function performGeocoding(addressToGeocode: string) {
      if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
        console.warn('Google Maps Geocoder not available');
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      
      console.log('🗺️ Geocoding address:', addressToGeocode);
      
      geocoder.geocode({ address: addressToGeocode }, (results: any[], status: string) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location;
          const geocodedLat = typeof location.lat === 'function' ? location.lat() : location.lat;
          const geocodedLng = typeof location.lng === 'function' ? location.lng() : location.lng;
          
          // Check result type - prefer street_address or premise over locality
          const resultType = results[0].types || [];
          const isExactAddress = resultType.includes('street_address') || 
                                resultType.includes('premise') || 
                                resultType.includes('subpremise');
          
          console.log('✅ Geocoded successfully:', { 
            lat: geocodedLat, 
            lng: geocodedLng,
            isExact: isExactAddress,
            types: resultType
          });
          
          if (!isNaN(geocodedLat) && !isNaN(geocodedLng)) {
            initializeMap(geocodedLat, geocodedLng);
          } else {
            console.warn('Invalid geocoded coordinates');
            initializeMap(40.4432, -79.9428); // Fallback to Pittsburgh
          }
        } else {
          console.warn('Geocoding failed:', status);
          // Fallback to Pittsburgh if geocoding fails
          initializeMap(40.4432, -79.9428);
        }
      });
    }

    function initializeMap(lat: number, lng: number) {
      if (!mapRef.current || !window.google) return;

      // Initialize map if not already created
      if (!mapInstanceRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        });

        mapInstanceRef.current = map;
      } else {
        // Update existing map center
        mapInstanceRef.current.setCenter({ lat, lng });
        mapInstanceRef.current.setZoom(15);
      }

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      // Create new marker
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: address || 'Property Location',
        animation: window.google.maps.Animation.DROP,
      });

      // Create info window with address
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; color: #2563eb; font-size: 14px; margin: 0 0 4px 0;">
              ${address || 'Property Location'}
            </h3>
            ${city && state ? `<p style="font-size: 12px; color: #666; margin: 0;">${city}, ${state} ${zipCode || ''}</p>` : ''}
          </div>
        `
      });

      // Open info window
      infoWindow.open(mapInstanceRef.current, marker);

      markerRef.current = marker;
    }
  }, [isMapLoaded, latitude, longitude, address, city, state, zipCode]);

  // Show loading state while map is loading
  if (!isMapLoaded || isLoading) {
    return (
      <div className={`${height} bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center border border-dashed border-slate-300 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <MapPin className="h-6 w-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  // Check if we have any location data
  const hasCoordinates = latitude && longitude && !isNaN(latitude) && !isNaN(longitude);
  const hasAddress = address && address.trim() !== '';
  const hasLocationData = hasCoordinates || hasAddress;

  // Show placeholder only if we have absolutely no location data
  if (!hasLocationData) {
    return (
      <div className={`${height} bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center border border-dashed border-slate-300 ${className}`}>
        <div className="text-center">
          <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Map View</p>
          <p className="text-xs text-slate-400 mt-1">Location information not available</p>
        </div>
      </div>
    );
  }

  // Show map (it will be initialized by useEffect)
  return (
    <div className={`rounded-lg overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      <div ref={mapRef} className={`w-full ${height}`} />
    </div>
  );
};

export default PropertyLocationMap;

