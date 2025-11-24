import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AddressMapPreviewProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
}

const AddressMapPreview: React.FC<AddressMapPreviewProps> = ({
  latitude,
  longitude,
  address,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: true,
        touchZoom: true
      });

      // Set initial view to Pittsburgh or provided coordinates
      const initialLat = latitude || 40.4432;
      const initialLng = longitude || -79.9428;
      map.setView([initialLat, initialLng], latitude && longitude ? 16 : 13);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Update map center and marker when coordinates change
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      const map = mapInstanceRef.current!;
      
      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Create new marker at the exact location
      const marker = L.marker([latitude, longitude], {
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map);

      // Add popup with address if available
      if (address) {
        marker.bindPopup(`<div class="text-sm font-medium">${address}</div>`).openPopup();
      }

      markerRef.current = marker;

      // Center map on the marker with smooth animation
      map.setView([latitude, longitude], 16, {
        animate: true,
        duration: 0.5
      });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }
      }
    };
  }, [latitude, longitude, address]);

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return (
      <div className={`h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 ${className}`}>
      <div className="text-center">
        <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Select an address to see location on map</p>
      </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm ${className}`}>
      <div ref={mapRef} className="w-full h-64" />
      {address && (
        <div className="p-2 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-600 font-medium truncate">{address}</p>
        </div>
      )}
    </div>
  );
};

export default AddressMapPreview;

