'use client';

import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function RouteMap({ points }) {
  if (!points || points.length < 2) return null;

  const latlngs = points.map((p) => [p.lat, p.lon]);
  const bounds = latlngs;

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [24, 24] }}
      style={{ height: '340px', width: '100%', borderRadius: '10px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        subdomains="abcd"
        maxZoom={19}
      />
      <Polyline positions={latlngs} pathOptions={{ color: '#C8FF00', weight: 3 }} />
      <CircleMarker
        center={latlngs[0]}
        radius={6}
        pathOptions={{ color: '#DAF748', fillColor: '#DAF748', fillOpacity: 1 }}
      >
        <Tooltip>Start</Tooltip>
      </CircleMarker>
      <CircleMarker
        center={latlngs[latlngs.length - 1]}
        radius={6}
        pathOptions={{ color: '#FF6B57', fillColor: '#FF6B57', fillOpacity: 1 }}
      >
        <Tooltip>Finish</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
