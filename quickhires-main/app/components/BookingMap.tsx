"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Fix Leaflet's default marker icon URLs broken by webpack/Next.js module bundling.
// Leaflet tries to auto-detect paths via _getIconUrl which fails after bundling.
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng.src,
  iconRetinaUrl: markerIconRetinaPng.src,
  shadowUrl: markerShadowPng.src,
});

interface Props {
  lat: number;
  lng: number;
  address: string;
  height?: string;
}

export default function BookingMap({
  lat,
  lng,
  address,
  height = "320px",
}: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height, width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
}
