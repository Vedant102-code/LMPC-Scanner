import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useCompliance } from '../context/ComplianceContext';
import 'leaflet/dist/leaflet.css';

// Approximate center of India
const center: [number, number] = [22.9734, 78.6569];

export function LiveMap() {
  const { liveViolations } = useCompliance();
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') !== 'light');

  // Listen for theme changes from the header toggle to switch map tile layers
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const tileUrl = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer 
        center={center} 
        zoom={4.5} 
        scrollWheelZoom={true} 
        style={{ width: "100%", height: "100%", zIndex: 1 }}
      >
        <TileLayer
          key={tileUrl} // force re-render when theme changes
          url={tileUrl}
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Dynamic Real-time Red Dots */}
        {liveViolations.map((violation) => {
          // Leaflet expects coordinates as [latitude, longitude]
          // Our mock data generates [longitude, latitude] for the previous SVG engine
          const position: [number, number] = [violation.coordinates[1], violation.coordinates[0]];
          
          return (
            <CircleMarker 
              key={violation.id} 
              center={position}
              pathOptions={{
                color: isDark ? '#ffffff' : '#000000',
                fillColor: '#ef4444', // red dot
                fillOpacity: 1,
                weight: 1.5,
              }}
              radius={6}
            >
              <Tooltip>
                <strong>{violation.rule}</strong><br/>
                {violation.regionName}<br/>
                {violation.timestamp.toLocaleTimeString()}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
