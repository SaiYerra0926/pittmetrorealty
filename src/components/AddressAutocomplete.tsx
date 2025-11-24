import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    google: any;
    initGoogleMapsAutocomplete: () => void;
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  }) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  types?: string[]; // e.g., ['address'], ['geocode'], ['establishment']
  componentRestrictions?: { country?: string | string[] };
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter address",
  id = "address-autocomplete",
  label,
  className = "",
  error,
  disabled = false,
  types = ['address'],
  componentRestrictions = { country: 'us' }
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps Places API
  useEffect(() => {
    // Check if Google Maps API is already loaded with Places library
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded (by any component)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement;
    if (existingScript) {
      // Wait for it to load - check for both places and Map (in case another component loaded it)
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          // If places library is available, we're good
          if (window.google.maps.places) {
            setIsLoaded(true);
            clearInterval(checkInterval);
          } else {
            // Check if the existing script includes places library
            const scriptSrc = existingScript.src || '';
            if (scriptSrc.includes('libraries=places')) {
              // Places should be loading, just wait a bit more
            } else {
              // Script exists but doesn't have places - we need to wait and see
              // or load a new script with places
            }
          }
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
        }
      }, 5000);
      
      return () => clearInterval(checkInterval);
    }

    // No existing script, load it ourselves
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete will not work. Please set VITE_GOOGLE_MAPS_API_KEY in your .env.local file.');
      return;
    }
    
    // Use a unique callback name to avoid conflicts with other components
    const callbackName = `initGoogleMapsAutocomplete_${Date.now()}`;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    // Handle script loading errors
    script.onerror = () => {
      console.error('Failed to load Google Maps API. Please check your API key and ensure the Places API is enabled.');
      setIsLoaded(false);
    };

    // Set up callback
    (window as any)[callbackName] = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        console.log('✅ Google Maps Places API loaded successfully for autocomplete');
      }
      // Clean up callback after use
      setTimeout(() => {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
      }, 1000);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Clean up callback
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
    };
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) return;

    try {
      // Create autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'name',
          'place_id'
        ],
        types: types,
        componentRestrictions: componentRestrictions
      });

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        console.log('🔍 Place changed event fired:', place);

        if (!place.geometry || !place.geometry.location) {
          console.warn('⚠️ No geometry found for selected place');
          // Still try to extract address components even without geometry
          if (place.formatted_address) {
            onChange(place.formatted_address);
          }
          return;
        }

        // Parse address components more thoroughly
        const addressComponents: any = {};
        place.address_components?.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number')) {
            addressComponents.streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            addressComponents.route = component.long_name;
          }
          if (types.includes('locality')) {
            addressComponents.city = component.long_name;
          }
          // Also check for sublocality if locality is not found
          if (!addressComponents.city && types.includes('sublocality')) {
            addressComponents.city = component.long_name;
          }
          // Check for sublocality_level_1 as fallback
          if (!addressComponents.city && types.includes('sublocality_level_1')) {
            addressComponents.city = component.long_name;
          }
          // Check for neighborhood as another fallback
          if (!addressComponents.city && types.includes('neighborhood')) {
            addressComponents.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            addressComponents.state = component.short_name || component.long_name;
          }
          if (types.includes('postal_code')) {
            addressComponents.zipCode = component.long_name;
          }
        });
        
        // If we still don't have city, try to extract from formatted_address
        if (!addressComponents.city && place.formatted_address) {
          // Try to extract city from formatted address (format: "Address, City, State ZIP")
          const parts = place.formatted_address.split(',');
          if (parts.length >= 2) {
            addressComponents.city = parts[1]?.trim().split(' ')[0] || '';
          }
        }

        // Build full street address
        const streetAddress = [
          addressComponents.streetNumber,
          addressComponents.route
        ].filter(Boolean).join(' ').trim();
        
        // If no street address components, use the formatted address
        const finalAddress = streetAddress || place.formatted_address || place.name || '';

        // Get coordinates
        const lat = typeof place.geometry.location.lat === 'function' 
          ? place.geometry.location.lat() 
          : place.geometry.location.lat;
        const lng = typeof place.geometry.location.lng === 'function' 
          ? place.geometry.location.lng() 
          : place.geometry.location.lng;

        console.log('✅ Extracted data:', {
          address: finalAddress,
          city: addressComponents.city,
          state: addressComponents.state,
          zipCode: addressComponents.zipCode,
          coordinates: { lat, lng }
        });

        // Update input value with the street address (not full formatted address)
        onChange(finalAddress);

        // Call onPlaceSelect callback with parsed data
        if (onPlaceSelect) {
          onPlaceSelect({
            address: finalAddress,
            city: addressComponents.city || '',
            state: addressComponents.state || '',
            zipCode: addressComponents.zipCode || '',
            latitude: lat,
            longitude: lng,
            formattedAddress: place.formatted_address || finalAddress
          });
          
          console.log('📍 Address selected and callback called:', {
            address: finalAddress,
            city: addressComponents.city,
            state: addressComponents.state,
            zipCode: addressComponents.zipCode,
            coordinates: { lat, lng }
          });
        }
      });

      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [isLoaded, onChange, onPlaceSelect, types, componentRestrictions]);

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={error ? `border-red-500 ${className}` : className}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {!isLoaded && !disabled && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
          Loading address autocomplete...
        </p>
      )}
      {isLoaded && !disabled && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <span>✓</span>
          Address autocomplete ready - Start typing to see suggestions
        </p>
      )}
      {!isLoaded && !disabled && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Google Maps API key not configured. You can still type addresses manually.
        </p>
      )}
    </div>
  );
};

// Declare the callback function on window
declare global {
  interface Window {
    initGoogleMapsAutocomplete: () => void;
  }
}

export default AddressAutocomplete;

