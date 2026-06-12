"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  LayersControl,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  DEFAULT_MAP_CENTER,
  TURKEY_BOUNDS,
} from "@/lib/listing-geo";
import type { MapFocusTarget } from "@/types/listing-geo";
import "leaflet/dist/leaflet.css";

interface ListingLocationMapInnerProps {
  latitude: number | null;
  longitude: number | null;
  focusTarget: MapFocusTarget | null;
  disabled?: boolean;
  onCoordinatesChange: (latitude: number, longitude: number) => void;
}

const crimsonMarkerIcon = L.divIcon({
  className: "listing-location-marker",
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:#ee254b;border:3px solid #ffffff;box-shadow:0 8px 20px rgba(238,37,75,0.45);pointer-events:auto;"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const STREET_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const mapControlStyles =
  "[&_.leaflet-control-attribution]:bg-white/90 [&_.leaflet-control-attribution]:text-charcoal/60 [&_.leaflet-control-zoom]:border-charcoal/10 [&_.leaflet-control-zoom_a]:bg-white [&_.leaflet-control-zoom_a]:text-charcoal [&_.leaflet-control-zoom_a]:border-charcoal/10 [&_.leaflet-control-layers]:border-charcoal/10 [&_.leaflet-control-layers]:bg-white [&_.leaflet-control-layers]:text-charcoal [&_.leaflet-control-layers]:shadow-md [&_.leaflet-control-layers-toggle]:bg-white [&_.leaflet-control-layers-toggle]:text-charcoal [&_.leaflet-container]:cursor-crosshair";

function MapFlyController({
  focusTarget,
}: {
  focusTarget: MapFocusTarget | null;
}) {
  const map = useMap();
  const lastFocusKey = useRef<string>("");

  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    const focusKey = `${focusTarget.label}-${focusTarget.zoom}-${focusTarget.latitude}-${focusTarget.longitude}`;

    if (lastFocusKey.current === focusKey) {
      return;
    }

    lastFocusKey.current = focusKey;
    map.flyTo([focusTarget.latitude, focusTarget.longitude], focusTarget.zoom, {
      duration: 1.1,
    });
  }, [focusTarget, map]);

  return null;
}

function MapClickHandler({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (disabled) {
        return;
      }

      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function ListingLocationMapInner({
  latitude,
  longitude,
  focusTarget,
  disabled = false,
  onCoordinatesChange,
}: ListingLocationMapInnerProps) {
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(() => {
    if (latitude != null && longitude != null) {
      return [latitude, longitude];
    }

    return null;
  });

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setPinPosition([latitude, longitude]);
      return;
    }

    setPinPosition(null);
  }, [latitude, longitude]);

  const handleCoordinatePick = useCallback(
    (nextLatitude: number, nextLongitude: number) => {
      if (disabled) {
        return;
      }

      setPinPosition([nextLatitude, nextLongitude]);
      onCoordinatesChange(nextLatitude, nextLongitude);
    },
    [disabled, onCoordinatesChange]
  );

  const initialCenter = useMemo<[number, number]>(() => {
    if (pinPosition) {
      return pinPosition;
    }

    if (focusTarget) {
      return [focusTarget.latitude, focusTarget.longitude];
    }

    return [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];
  }, [focusTarget, pinPosition]);

  const initialZoom =
    pinPosition != null
      ? 16
      : focusTarget?.zoom ?? DEFAULT_MAP_CENTER.zoom;

  return (
    <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={6}
        maxZoom={19}
        maxBounds={[
          [TURKEY_BOUNDS.south, TURKEY_BOUNDS.west],
          [TURKEY_BOUNDS.north, TURKEY_BOUNDS.east],
        ]}
        scrollWheelZoom={!disabled}
        className={`h-[320px] w-full ${mapControlStyles}`}
      >
        <LayersControl position="topright" collapsed={false}>
          <LayersControl.BaseLayer checked name="Sokak Haritası">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={STREET_TILE_URL}
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Uydu Görünümü">
            <TileLayer
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
              url={SATELLITE_TILE_URL}
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapFlyController focusTarget={focusTarget} />

        <MapClickHandler disabled={disabled} onPick={handleCoordinatePick} />

        {pinPosition && (
          <Marker
            position={pinPosition}
            icon={crimsonMarkerIcon}
            draggable={!disabled}
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target;
                const position = marker.getLatLng();
                handleCoordinatePick(position.lat, position.lng);
              },
            }}
          />
        )}
      </MapContainer>

      <div className="flex items-center justify-between gap-3 border-t border-charcoal/10 bg-charcoal px-4 py-3 text-xs text-cream/50">
        <span>
          {disabled
            ? "Harita salt okunur"
            : "Haritaya tıklayın veya kırmızı pini sürükleyerek konumu kilitleyin"}
        </span>
        {pinPosition && (
          <span className="font-mono text-cream/70">
            {pinPosition[0].toFixed(5)}, {pinPosition[1].toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
}
