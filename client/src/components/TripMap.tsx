import { useEffect, useRef, useState } from 'react';

interface TripMapProps {
  destination: string;
}

export default function TripMap({ destination }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Fix leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Geocode destination
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`);
        const geoData = await geoRes.json();
        
        if (!geoData.length) { setError(true); setLoading(false); return; }
        
        const { lat, lon } = geoData[0];
        const map = L.map(mapRef.current!).setView([parseFloat(lat), parseFloat(lon)], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        // Fetch nearby places
        const query = `[out:json][timeout:25];(node["amenity"="restaurant"](around:800,${lat},${lon});node["tourism"="hotel"](around:800,${lat},${lon});node["tourism"="attraction"](around:800,${lat},${lon}););out body;`;
        const osmRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const osmData = await osmRes.json();

        const icons: Record<string, string> = {
          restaurant: '🍽️',
          hotel: '🏨',
          attraction: '⭐'
        };

        osmData.elements?.slice(0, 30).forEach((place: any) => {
          if (!place.lat || !place.lon) return;
          const type = place.tags?.amenity === 'restaurant' ? 'restaurant' : place.tags?.tourism === 'hotel' ? 'hotel' : 'attraction';
          const name = place.tags?.name || type;
          const icon = icons[type];
          
          L.marker([place.lat, place.lon])
            .addTo(map)
            .bindPopup(`<b>${icon} ${name}</b><br/><small>${type}</small>`);
        });

        mapInstanceRef.current = map;
        setLoading(false);
      } catch (e) {
        setError(true);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [destination]);

  if (error) return null;

  return (
    <div className="rounded-xl overflow-hidden border mb-6">
      <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
        <span className="text-sm font-medium">🗺️ Mapa de {destination}</span>
        <span className="text-xs text-muted-foreground">🍽️ Restaurantes · 🏨 Hoteles · ⭐ Atracciones</span>
      </div>
      {loading && (
        <div className="h-64 flex items-center justify-center bg-muted/10">
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      )}
      <div ref={mapRef} style={{ height: loading ? 0 : 350 }} />
    </div>
  );
}