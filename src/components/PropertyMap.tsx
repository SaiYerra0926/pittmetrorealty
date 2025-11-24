import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Phone, Mail, Home, DollarSign, Bed, Bath, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertiesAPI } from '@/lib/api/properties';

declare global {
  interface Window {
    google: any;
    initGoogleMapPropertyMap: () => void;
  }
}

interface Property {
  id: string | number;
  title?: string;
  name?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  squareFeet?: number;
  sqft?: number;
  photos?: Array<{ url: string; name?: string }>;
  image?: string;
  images?: string[];
  features?: string[];
  listingType?: 'rent' | 'sell' | 'buy';
  status?: string;
  coordinates?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  geocoded?: boolean; // Track if coordinates were geocoded from address
}

const PropertyMap = () => {
  const [selectedProperty, setSelectedProperty] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const propertiesApi = new PropertiesAPI();

  // Helper function to get image source
  const getImageSrc = (property: Property): string => {
    if (property.photos && property.photos.length > 0) {
      const photo = property.photos[0];
      if (photo.url) {
        if (photo.url.startsWith('data:image') || photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
          return photo.url;
        }
        return `data:image/jpeg;base64,${photo.url}`;
      }
    }
    if (property.image) {
      if (property.image.startsWith('data:image') || property.image.startsWith('http://') || property.image.startsWith('https://')) {
        return property.image;
      }
      return `data:image/jpeg;base64,${property.image}`;
    }
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    return 'https://via.placeholder.com/800x600?text=No+Image';
  };

  // Professional geocoding function with retry logic and better address formatting
  const geocodeAddress = async (
    address: string, 
    city?: string, 
    state?: string, 
    zipCode?: string,
    retryCount: number = 0
  ): Promise<{ lat: number; lng: number } | null> => {
    if (!address || address.trim() === '') {
      return null;
    }

    try {
      // Build full address with proper formatting for better geocoding accuracy
      const addressParts: string[] = [];
      
      // Clean and format address
      if (address) {
        const cleanAddress = address.trim()
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/,\s*,/g, ',') // Remove duplicate commas
          .trim();
        if (cleanAddress) addressParts.push(cleanAddress);
      }
      
      // Add city
      if (city) {
        const cleanCity = city.trim();
        if (cleanCity) addressParts.push(cleanCity);
      }
      
      // Add state (ensure it's uppercase for better matching)
      if (state) {
        const cleanState = state.trim().toUpperCase();
        if (cleanState) addressParts.push(cleanState);
      }
      
      // Add ZIP code
      if (zipCode) {
        const cleanZip = zipCode.trim();
        if (cleanZip) addressParts.push(cleanZip);
      }
      
      // Add "USA" for better geocoding accuracy in US
      if (state && (state.toUpperCase() === 'PA' || state.toUpperCase() === 'PENNSYLVANIA')) {
        addressParts.push('USA');
      }
      
      const fullAddress = addressParts.join(', ');
      
      if (fullAddress.trim() === '') {
        return null;
      }

      console.log(`🗺️ Geocoding address: "${fullAddress}"`);

      // Use Nominatim API with proper rate limiting and better query format
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&addressdetails=1&countrycodes=us`,
        {
          headers: {
            'User-Agent': 'PittMetroRealty/1.0 (Property Mapping Service)',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': window.location.origin
          }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.warn('⚠️ Geocoding API returned 403 (rate limited). Will retry with simplified address.');
          // Continue to retry logic below
        } else {
          throw new Error(`Geocoding API returned status ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Validate coordinates
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          console.log(`✅ Geocoded "${fullAddress}" to: ${lat}, ${lng}`);
          return { lat, lng };
        } else {
          console.warn(`⚠️ Invalid coordinates returned for "${fullAddress}": ${lat}, ${lng}`);
        }
      } else {
        console.warn(`⚠️ No geocoding results for "${fullAddress}"`);
      }

      // Retry with simplified address if first attempt fails
      if (retryCount === 0) {
        if (city && state) {
          // Try with just city, state, and ZIP
          console.log(`🔄 Retrying geocoding with simplified address: ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`);
          await new Promise(resolve => setTimeout(resolve, 1100)); // Wait before retry
          const simplifiedAddress = [city, state, zipCode].filter(Boolean).join(', ');
          if (simplifiedAddress) {
            return await geocodeAddress(simplifiedAddress, '', '', '', 1);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      // Retry once on network errors
      if (retryCount === 0 && error instanceof TypeError) {
        console.log('🔄 Retrying geocoding after network error...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return await geocodeAddress(address, city, state, zipCode, 1);
      }
      return null;
    }
  };

  // Fetch properties from API with geocoding
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        console.log('🗺️ Starting to fetch properties for map...');
        
        // Try fetching without status filter first (get all active/inactive)
        // Then also try with explicit status filters
        const [allResponse, rentResponse, sellResponse, buyResponse] = await Promise.all([
          propertiesApi.getProperties().catch((err) => {
            console.warn('Failed to fetch all properties:', err);
            return { listings: [] };
          }),
          propertiesApi.getProperties({ status: 'active', listingType: 'rent' }).catch((err) => {
            console.warn('Failed to fetch rent properties:', err);
            return { listings: [] };
          }),
          propertiesApi.getProperties({ status: 'active', listingType: 'sell' }).catch((err) => {
            console.warn('Failed to fetch sell properties:', err);
            return { listings: [] };
          }),
          propertiesApi.getProperties({ status: 'active', listingType: 'buy' }).catch((err) => {
            console.warn('Failed to fetch buy properties:', err);
            return { listings: [] };
          })
        ]);
        
        // Combine all listings, removing duplicates by ID
        const allListingsMap = new Map();
        
        // Add from allResponse
        (allResponse.listings || []).forEach((listing: any) => {
          if (listing.id && (listing.status === 'active' || listing.status === 'Active')) {
            allListingsMap.set(listing.id, listing);
          }
        });
        
        // Add from specific type responses
        [...(rentResponse.listings || []), ...(sellResponse.listings || []), ...(buyResponse.listings || [])].forEach((listing: any) => {
          if (listing.id) {
            allListingsMap.set(listing.id, listing);
          }
        });
        
        const allListings = Array.from(allListingsMap.values());
        
        console.log(`📍 Found ${allListings.length} total unique active properties`);
        console.log(`   - All response: ${allResponse.listings?.length || 0}`);
        console.log(`   - Rent: ${rentResponse.listings?.length || 0}`);
        console.log(`   - Sell: ${sellResponse.listings?.length || 0}`);
        console.log(`   - Buy: ${buyResponse.listings?.length || 0}`);
        
        if (allListings.length === 0) {
          console.warn('⚠️ No properties found! Check if:');
          console.warn('   1. Properties exist in database with status="active"');
          console.warn('   2. API server is running and accessible');
          console.warn('   3. Database connection is working');
          setProperties([]);
          setIsLoading(false);
          return;
        }
        
        // Process and geocode properties with better error handling
        // Process in batches to avoid overwhelming geocoding API
        const processedProperties: (Property | null)[] = [];
        
        for (let i = 0; i < allListings.length; i++) {
          const prop = allListings[i];
          
          // Check for existing coordinates first - try multiple field names
          let coordinates = null;
          
          // Try coordinates object first
          if (prop.coordinates && typeof prop.coordinates === 'object') {
            const lat = parseFloat(prop.coordinates.lat || prop.coordinates.latitude);
            const lng = parseFloat(prop.coordinates.lng || prop.coordinates.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates = { lat, lng };
            }
          }
          // Try latitude/longitude fields directly
          else if (prop.latitude && prop.longitude) {
            const lat = parseFloat(prop.latitude);
            const lng = parseFloat(prop.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates = { lat, lng };
            }
          }
          // Try snake_case fields
          else if (prop.lat && prop.lon) {
            const lat = parseFloat(prop.lat);
            const lng = parseFloat(prop.lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates = { lat, lng };
            }
          }
          
          // Validate existing coordinates
          if (coordinates && (isNaN(coordinates.lat) || isNaN(coordinates.lng) || 
              coordinates.lat < -90 || coordinates.lat > 90 || 
              coordinates.lng < -180 || coordinates.lng > 180)) {
            console.warn(`Invalid coordinates for property ${prop.id}:`, coordinates);
            coordinates = null;
          }
          
          // If no valid coordinates, geocode the address
          if (!coordinates && prop.address && prop.city && prop.state) {
            // Add delay to respect rate limits (1 request per second)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1100));
            }
            
            console.log(`🗺️ Geocoding address for property ${prop.id}: ${prop.address}, ${prop.city}, ${prop.state} ${prop.zipCode || prop.zip_code || ''}`);
            coordinates = await geocodeAddress(
              prop.address || '', 
              prop.city || '', 
              prop.state || '', 
              prop.zipCode || prop.zip_code || ''
            );
            
            if (coordinates) {
              console.log(`✅ Geocoded property ${prop.id} to:`, coordinates);
              
              // TODO: Save coordinates back to database for future use
              // This would require an API endpoint to update coordinates
              // For now, coordinates are only used for map display
            } else {
              console.warn(`❌ Failed to geocode property ${prop.id}: ${prop.address}, ${prop.city}, ${prop.state}`);
            }
          }
          
          // If still no coordinates, check if we have a valid address
          if (!coordinates) {
            if (prop.address && prop.city && prop.state) {
              // We have an address but geocoding failed - use Pittsburgh center as fallback
              // but add a small random offset so multiple properties don't overlap
              const randomOffset = (Math.random() - 0.5) * 0.01; // ~0.5km random offset
              console.warn(`⚠️ Property ${prop.id} geocoding failed. Using Pittsburgh center with offset as fallback.`);
              coordinates = { 
                lat: 40.4432 + randomOffset, 
                lng: -79.9428 + randomOffset 
              };
            } else {
              console.warn(`⚠️ Property ${prop.id} has incomplete address (address: ${prop.address}, city: ${prop.city}, state: ${prop.state}). Skipping.`);
              processedProperties.push(null);
              continue;
            }
          }
          
          processedProperties.push({
            id: prop.id,
            title: prop.title,
            name: prop.title,
            address: prop.address || '',
            city: prop.city,
            state: prop.state,
            zipCode: prop.zipCode || prop.zip_code,
            price: prop.price || 0,
            bedrooms: prop.bedrooms,
            beds: prop.bedrooms,
            bathrooms: prop.bathrooms,
            baths: prop.bathrooms,
            squareFeet: prop.squareFeet || prop.square_feet,
            sqft: prop.squareFeet || prop.square_feet,
            photos: prop.photos || [],
            image: prop.photos && prop.photos.length > 0 ? prop.photos[0].url : undefined,
            features: prop.features || [],
            listingType: prop.listingType || prop.listing_type || 'rent',
            status: prop.status || 'active',
            coordinates,
            geocoded: !prop.coordinates && !prop.latitude && !prop.longitude
          });
        }
        
        // Filter out null properties
        const validProperties = processedProperties.filter((p): p is Property => p !== null);
        
        console.log(`✅ Processed ${validProperties.length} properties with valid coordinates`);
        console.log(`   Properties with coordinates:`, validProperties.map(p => ({ id: p.id, title: p.title, coords: p.coordinates })));
        
        setProperties(validProperties);
      } catch (error) {
        console.error('❌ Error fetching properties:', error);
        console.error('Error details:', error instanceof Error ? error.stack : error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [refreshKey]);
  
  // Refresh function
  const handleRefresh = () => {
    console.log('🔄 Refreshing properties...');
    setRefreshKey(prev => prev + 1);
  };

  const getDirections = (property: Property) => {
    if (property.coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${property.coordinates.lat},${property.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  // Load Google Maps API
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.Map) {
      setIsMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          setIsMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API failed to load within timeout period');
          setIsMapLoaded(false);
        }
      }, 10000);
      
      return () => clearInterval(checkInterval);
    }

    // Load Google Maps API
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key not found. Map will not load. Please set VITE_GOOGLE_MAPS_API_KEY in your .env.local file.');
      setIsMapLoaded(false);
      return;
    }
    
    // Load Maps JavaScript API (required for map display) and Places API (for autocomplete)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapPropertyMap`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API. Please check:');
      console.error('1. API key is correct in .env.local');
      console.error('2. Maps JavaScript API is enabled in Google Cloud Console');
      console.error('3. Places API is enabled in Google Cloud Console');
      console.error('4. API key restrictions allow your domain');
      setIsMapLoaded(false);
    };

    // Set up unique callback for PropertyMap
    window.initGoogleMapPropertyMap = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        setIsMapLoaded(true);
        console.log('✅ Google Maps API loaded successfully for PropertyMap');
      } else {
        console.error('Google Maps API loaded but Map class not available');
        setIsMapLoaded(false);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (window.initGoogleMapPropertyMap) {
        delete window.initGoogleMapPropertyMap;
      }
    };
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.google || mapInstanceRef.current) return;

    // Verify Google Maps API is fully loaded
    if (!window.google.maps || !window.google.maps.Map) {
      console.error('❌ Google Maps API loaded but Map class is not available.');
      console.error('Please ensure Maps JavaScript API is enabled in Google Cloud Console:');
      console.error('1. Go to https://console.cloud.google.com/apis/library');
      console.error('2. Search for "Maps JavaScript API"');
      console.error('3. Click "Enable"');
      return;
    }

    try {
      // Create map - will be centered on properties when they load
      // For now, use Pittsburgh as initial center, but it will be updated when properties load
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.4432, lng: -79.9428 },
        zoom: 11, // Start with wider view, will be adjusted when properties load
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      mapInstanceRef.current = map;
      console.log('✅ Google Maps initialized successfully (will center on properties when loaded)');
    } catch (error: any) {
      console.error('❌ Error initializing Google Maps:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        googleMapsAvailable: !!window.google?.maps,
        mapClassAvailable: !!window.google?.maps?.Map
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
        markersRef.current = [];
        infoWindowsRef.current = [];
      }
    };
  }, [isMapLoaded]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) {
      console.warn('⚠️ Map instance not available yet - will retry when map is ready');
      return;
    }

    if (properties.length === 0) {
      console.log('No properties to display - keeping map at default center');
      return;
    }

    console.log(`🗺️ Updating map markers for ${properties.length} properties`);

    // Clear existing markers and info windows
    markersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        console.warn('Error removing marker:', e);
      }
    });
    infoWindowsRef.current.forEach(infoWindow => {
      try {
        infoWindow.close();
      } catch (e) {
        console.warn('Error closing info window:', e);
      }
    });
    markersRef.current = [];
    infoWindowsRef.current = [];

    if (properties.length === 0) {
      console.log('No properties to display on map');
      return;
    }

    // Add new markers
    let markersAdded = 0;
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;

    properties.forEach((property, index) => {
      if (property.coordinates && property.coordinates.lat && property.coordinates.lng) {
        try {
          const lat = property.coordinates.lat;
          const lng = property.coordinates.lng;
          
          // Validate coordinates before creating marker
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`Invalid coordinates for property ${property.id}:`, { lat, lng });
            return;
          }

          // Additional validation: ensure coordinates are not exactly 0,0 (which is in the ocean)
          if (lat === 0 && lng === 0) {
            console.warn(`Coordinates are 0,0 for property ${property.id} - likely invalid`);
            return;
          }

          // Ensure coordinates are not the default Pittsburgh center (unless property is actually there)
          const pittsburghLat = 40.4432;
          const pittsburghLng = -79.9428;
          const distanceFromPittsburgh = Math.sqrt(
            Math.pow(lat - pittsburghLat, 2) + Math.pow(lng - pittsburghLng, 2)
          );
          
          // If coordinates are very close to Pittsburgh center (within 0.001 degrees), 
          // it might be a fallback coordinate - log a warning but still use it
          if (distanceFromPittsburgh < 0.001 && property.geocoded) {
            console.warn(`Property ${property.id} coordinates are very close to Pittsburgh center - may be fallback`);
          }

          const position = { lat, lng };
          bounds.extend(position);
          hasValidBounds = true;
          
          console.log(`📍 Adding marker for property ${property.id} at:`, position);

          // Create custom marker icon
          const markerIcon = {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: index === selectedProperty ? '#2563eb' : '#ffffff',
            fillOpacity: 1,
            strokeColor: '#2563eb',
            strokeWeight: 2,
          };

          // Create marker
          const marker = new window.google.maps.Marker({
            position: position,
            map: mapInstanceRef.current,
            icon: markerIcon,
            title: property.name || property.title || 'Property',
            label: {
              text: `${index + 1}`,
              color: index === selectedProperty ? '#ffffff' : '#2563eb',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });

          // Create info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="font-weight: bold; color: #2563eb; font-size: 14px; margin: 0 0 4px 0;">
                  ${(property.name || property.title || 'Property').replace(/'/g, "&#39;")}
                </h3>
                <p style="font-size: 18px; font-weight: bold; color: #2563eb; margin: 4px 0;">
                  $${(property.price || 0).toLocaleString()}
                </p>
                <p style="font-size: 12px; color: #666; margin: 4px 0;">
                  ${property.beds || property.bedrooms || 0}B ${property.baths || property.bathrooms || 0}BA • ${(property.sqft || property.squareFeet || 0).toLocaleString()} sq ft
                </p>
              </div>
            `
          });

          // Add click listener
          marker.addListener('click', () => {
            // Close all other info windows
            infoWindowsRef.current.forEach(iw => iw.close());
            // Open this info window
            infoWindow.open(mapInstanceRef.current, marker);
            setSelectedProperty(index);
          });

          markersRef.current.push(marker);
          infoWindowsRef.current.push(infoWindow);
          markersAdded++;
        } catch (error) {
          console.error(`Error adding marker for property ${property.id}:`, error);
        }
      } else {
        console.warn(`Property ${property.id} missing coordinates:`, property.coordinates);
      }
    });

    console.log(`✅ Added ${markersAdded} markers to map`);
    console.log(`   Valid bounds: ${hasValidBounds}`);
    console.log(`   Properties with coordinates:`, properties.filter(p => p.coordinates).map(p => ({
      id: p.id,
      address: p.address,
      coords: p.coordinates
    })));

    // Fit map to show all markers
    if (markersAdded > 0 && hasValidBounds) {
      try {
        // Ensure bounds are valid before fitting
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Check if bounds are valid (not empty)
        if (ne && sw && ne.lat() !== sw.lat() && ne.lng() !== sw.lng()) {
          // Fit bounds with padding
          mapInstanceRef.current.fitBounds(bounds, { 
            padding: 80,
            top: 80,
            right: 80,
            bottom: 80,
            left: 80
          });
          console.log('✅ Map bounds adjusted to show all markers');
          
          // Ensure minimum zoom level for better visibility
          const currentZoom = mapInstanceRef.current.getZoom();
          if (currentZoom && currentZoom > 15) {
            mapInstanceRef.current.setZoom(15);
          }
        } else if (markersAdded === 1) {
          // If only one marker, center on it with a good zoom level
          const singleProperty = properties.find(p => p.coordinates);
          if (singleProperty && singleProperty.coordinates) {
            mapInstanceRef.current.setCenter({
              lat: singleProperty.coordinates.lat,
              lng: singleProperty.coordinates.lng
            });
            mapInstanceRef.current.setZoom(15);
            console.log('✅ Map centered on single property');
          }
        } else {
          // Calculate center from all valid coordinates
          const validCoords = properties
            .filter(p => p.coordinates && p.coordinates.lat && p.coordinates.lng)
            .map(p => p.coordinates!);
          
          if (validCoords.length > 0) {
            const avgLat = validCoords.reduce((sum, c) => sum + c.lat, 0) / validCoords.length;
            const avgLng = validCoords.reduce((sum, c) => sum + c.lng, 0) / validCoords.length;
            
            mapInstanceRef.current.setCenter({ lat: avgLat, lng: avgLng });
            mapInstanceRef.current.setZoom(12);
            console.log('✅ Map centered on average of property locations');
          }
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
        // Fallback: center on first property or Pittsburgh
        const firstProperty = properties.find(p => p.coordinates);
        if (firstProperty && firstProperty.coordinates) {
          mapInstanceRef.current.setCenter({
            lat: firstProperty.coordinates.lat,
            lng: firstProperty.coordinates.lng
          });
          mapInstanceRef.current.setZoom(13);
        } else {
          mapInstanceRef.current.setCenter({ lat: 40.4432, lng: -79.9428 });
          mapInstanceRef.current.setZoom(13);
        }
      }
    } else {
      console.warn('⚠️ No markers added, centering on Pittsburgh');
      mapInstanceRef.current.setCenter({ lat: 40.4432, lng: -79.9428 });
      mapInstanceRef.current.setZoom(13);
    }
  }, [properties, selectedProperty]);

  // Update marker styles and center map when selected property changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || markersRef.current.length === 0) return;

    markersRef.current.forEach((marker, index) => {
      if (index === selectedProperty && properties[index]) {
        const property = properties[index];
        if (property.coordinates) {
          // Update marker icon for selected property
          marker.setIcon({
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#1e40af',
            strokeWeight: 3,
          });
          marker.setLabel({
            text: `${index + 1}`,
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold'
          });
          
          // Center map on selected property
          mapInstanceRef.current.setCenter({
            lat: property.coordinates.lat,
            lng: property.coordinates.lng
          });
          mapInstanceRef.current.setZoom(15);
          
          // Open info window for selected property
          if (infoWindowsRef.current[index]) {
            infoWindowsRef.current.forEach(iw => iw.close());
            infoWindowsRef.current[index].open(mapInstanceRef.current, marker);
          }
        }
      } else {
        // Reset marker icon for non-selected properties
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#ffffff',
          fillOpacity: 1,
          strokeColor: '#2563eb',
          strokeWeight: 2,
        });
        marker.setLabel({
          text: `${index + 1}`,
          color: '#2563eb',
          fontSize: '12px',
          fontWeight: 'bold'
        });
      }
    });
  }, [selectedProperty, properties]);

  return (
    <section className="relative bg-gradient-to-br from-blue-50/30 via-slate-50/50 to-indigo-50/20 py-6 sm:py-8 md:py-10">
      <div className="container mx-auto px-3 sm:px-4 md:px-5 lg:px-6 max-w-6xl w-full">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 pt-20 sm:pt-22">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 sm:mb-4 md:mb-5 animate-fade-in-up px-2">
            Pittsburgh Real Estate Map
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up-delay px-4">
            Explore our featured properties across Pittsburgh, PA with interactive maps. Click on any property marker to see basic details.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in-up-delay">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Loading properties and geocoding addresses...</span>
              </div>
            )}
            {!isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Map
              </Button>
            )}
          </div>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4 animate-fade-in-up-delay px-2">
            <Badge variant="outline" className="px-4 py-2">Pittsburgh, PA</Badge>
            <Badge variant="outline" className="px-4 py-2">Pittsburgh</Badge>
            <Badge variant="outline" className="px-4 py-2">Imperial</Badge>
            <Badge variant="outline" className="px-4 py-2">Coraopolis</Badge>
            <Badge variant="outline" className="px-4 py-2">Canonsburg</Badge>
            <Badge variant="outline" className="px-4 py-2">Oakdale</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto pb-6 sm:pb-8 md:pb-10 w-full items-stretch">
          {/* Map Section */}
          <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card className="shadow-professional hover:shadow-professional-hover section-transition animate-fade-in-up">
              <CardHeader className="p-3 sm:p-4 md:p-5">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  Property Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-[350px] sm:h-[400px] md:h-[450px] rounded-lg overflow-hidden">
                  {/* Google Maps Container */}
                  {!isMapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                      <div className="text-center p-6 max-w-md">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Loading Google Maps...</p>
                        <p className="text-xs text-gray-500">
                          If this message persists, please check:
                        </p>
                        <ul className="text-xs text-gray-500 mt-2 text-left list-disc list-inside space-y-1">
                          <li>Maps JavaScript API is enabled in Google Cloud Console</li>
                          <li>API key is correct in .env.local</li>
                          <li>API key restrictions allow your domain</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {isMapLoaded && !mapInstanceRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Initializing map...</p>
                      </div>
                    </div>
                  )}
                  <div ref={mapRef} className="w-full h-full rounded-lg"></div>
                  
                  {/* Simple Map Controls */}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Pittsburgh, PA</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Listed
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Powered by Google Maps
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property List */}
            <Card className="shadow-professional hover:shadow-professional-hover section-transition animate-fade-in-up">
              <CardHeader className="p-3 sm:p-4 md:p-5">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                  <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  All Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-5">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading properties...</p>
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No properties available</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[280px] sm:max-h-[320px] md:max-h-[360px] overflow-y-auto">
                    {properties.map((property, index) => (
                      <div
                        key={property.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedProperty === index 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedProperty(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-primary">{property.name || property.title || 'Property'}</h4>
                            <p className="text-xs text-muted-foreground">{property.address}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">${(property.price || 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{property.beds || property.bedrooms || 0}B {property.baths || property.bathrooms || 0}BA</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property Details */}
          <div className="space-y-4 sm:space-y-5">
            <Card className="shadow-professional hover:shadow-professional-hover section-transition animate-fade-in-up">
              <CardHeader className="p-3 sm:p-4 md:p-5">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                  <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-5">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading property details...</p>
                  </div>
                ) : properties[selectedProperty] ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={getImageSrc(properties[selectedProperty])} 
                        alt={properties[selectedProperty].name || properties[selectedProperty].title || 'Property'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2 sm:mb-3">
                        {properties[selectedProperty].name || properties[selectedProperty].title || 'Property'}
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">
                        {properties[selectedProperty].address}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-4 sm:mb-5">
                        <Badge variant={properties[selectedProperty].status === "For Sale" ? "default" : "secondary"} className="text-xs sm:text-sm">
                          {properties[selectedProperty].listingType === 'rent' ? 'For Rent' : properties[selectedProperty].listingType === 'sell' ? 'For Sale' : properties[selectedProperty].status || 'Active'}
                        </Badge>
                      </div>
                      
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-4 sm:mb-5">
                        ${((properties[selectedProperty]?.price) || 0).toLocaleString()}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="text-center">
                          <Bed className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <div className="text-sm font-semibold">{properties[selectedProperty].beds || properties[selectedProperty].bedrooms || 0}</div>
                          <div className="text-xs text-muted-foreground">Beds</div>
                        </div>
                        <div className="text-center">
                          <Bath className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <div className="text-sm font-semibold">{properties[selectedProperty].baths || properties[selectedProperty].bathrooms || 0}</div>
                          <div className="text-xs text-muted-foreground">Baths</div>
                        </div>
                        <div className="text-center">
                          <DollarSign className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <div className="text-sm font-semibold">{((properties[selectedProperty]?.sqft || properties[selectedProperty]?.squareFeet) || 0).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Sq Ft</div>
                        </div>
                      </div>
                      
                      {properties[selectedProperty].features && properties[selectedProperty].features.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <h4 className="font-semibold text-sm">Features:</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {properties[selectedProperty].features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                <span className="text-xs text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {properties[selectedProperty].coordinates && (
                          <Button 
                            onClick={() => getDirections(properties[selectedProperty])}
                            className="w-full"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                          </Button>
                        )}
                        <Button variant="outline" className="w-full">
                          <Phone className="h-4 w-4 mr-2" />
                          Contact Agent
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No property selected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Overview */}
            <Card className="shadow-professional hover:shadow-professional-hover section-transition animate-fade-in-up">
              <CardContent className="p-3 sm:p-4 md:p-5">
                <h4 className="font-semibold text-primary mb-3 sm:mb-4 text-lg sm:text-xl">Market Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Properties Listed</span>
                    <span className="text-sm font-semibold">{properties.length}</span>
                  </div>
                  {properties.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Price</span>
                        <span className="text-sm font-semibold">
                          ${Math.round(properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Price Range</span>
                        <span className="text-sm font-semibold">
                          ${Math.min(...properties.map(p => p.price || 0)).toLocaleString()} - ${Math.max(...properties.map(p => p.price || 0)).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyMap;
