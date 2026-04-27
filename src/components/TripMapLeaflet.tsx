import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import * as RL from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRoute, geocodeAddress } from '@/lib/routing';

type Coords = { lat: number; lng: number };

interface TripMapLeafletProps {
  pickup?: Coords;
  dropoff?: Coords;
  driver?: Coords;
  /** Address strings used as a last-resort geocoding fallback when coords are missing */
  pickupAddress?: string;
  dropoffAddress?: string;
  status: string;
  className?: string;
  height?: number | string;
}

function makeIcon(color: string, pulse = false): L.DivIcon {
  const size = 16;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.35);
      ${pulse ? 'animation:passengerDriverPulse 1.8s ease-in-out infinite;' : ''}
    "></div>`,
  });
}

const pickupIcon = makeIcon('#3b82f6');
const dropoffIcon = makeIcon('#22c55e');
const driverIcon = makeIcon('#d01c00', true);

const PULSE_CSS_ID = 'passenger-driver-pulse-css';

function ensurePulseCss() {
  if (document.getElementById(PULSE_CSS_ID)) return;

  const style = document.createElement('style');
  style.id = PULSE_CSS_ID;
  style.textContent = `
    @keyframes passengerDriverPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(208,28,0,.45); }
      50% { box-shadow: 0 0 0 10px rgba(208,28,0,0); }
    }
  `;
  document.head.appendChild(style);
}

function FitToBounds({ points }: { points: LatLngExpression[] }) {
  const map = (RL as any).useMap();

  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(points, { padding: [28, 28], maxZoom: 15 });
  }, [map, points]);

  return null;
}

export function TripMapLeaflet({
  pickup,
  dropoff,
  driver,
  pickupAddress,
  dropoffAddress,
  status,
  className,
  height = 220,
}: TripMapLeafletProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [geocodedPickup, setGeocodedPickup] = useState<Coords | null>(null);
  const [geocodedDropoff, setGeocodedDropoff] = useState<Coords | null>(null);

  useEffect(() => {
    ensurePulseCss();
  }, []);

  // Geocode address fallback when coords missing — one-shot per address change
  useEffect(() => {
    let cancelled = false;
    if (!pickup && pickupAddress) {
      geocodeAddress(pickupAddress).then((c) => {
        if (!cancelled) setGeocodedPickup(c ? { lat: c.lat, lng: c.lng } : null);
      });
    } else {
      setGeocodedPickup(null);
    }
    return () => { cancelled = true; };
  }, [pickup?.lat, pickup?.lng, pickupAddress]);

  useEffect(() => {
    let cancelled = false;
    if (!dropoff && dropoffAddress) {
      geocodeAddress(dropoffAddress).then((c) => {
        if (!cancelled) setGeocodedDropoff(c ? { lat: c.lat, lng: c.lng } : null);
      });
    } else {
      setGeocodedDropoff(null);
    }
    return () => { cancelled = true; };
  }, [dropoff?.lat, dropoff?.lng, dropoffAddress]);

  const effectivePickup = pickup ?? geocodedPickup ?? undefined;
  const effectiveDropoff = dropoff ?? geocodedDropoff ?? undefined;

  const routeWaypoints = useMemo(() => {
    const points: Coords[] = [];
    if (effectivePickup) points.push(effectivePickup);
    if (effectiveDropoff) points.push(effectiveDropoff);
    return points;
  }, [effectivePickup, effectiveDropoff]);

  useEffect(() => {
    let cancelled = false;
    setRouteCoords(null);

    if (routeWaypoints.length >= 2) {
      fetchRoute(routeWaypoints).then((coords) => {
        if (!cancelled) setRouteCoords(coords);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [routeWaypoints]);

  const boundsPoints = useMemo(() => {
    const points: LatLngExpression[] = routeWaypoints.map((point) => [point.lat, point.lng]);
    if (driver) points.push([driver.lat, driver.lng]);
    return points;
  }, [routeWaypoints, driver]);

  const fallbackLine = useMemo<LatLngExpression[] | null>(() => {
    if (routeCoords || routeWaypoints.length < 2) return null;
    return routeWaypoints.map((point) => [point.lat, point.lng]);
  }, [routeCoords, routeWaypoints]);

  const center = useMemo<LatLngExpression>(() => {
    if (driver) return [driver.lat, driver.lng];
    if (effectivePickup) return [effectivePickup.lat, effectivePickup.lng];
    if (effectiveDropoff) return [effectiveDropoff.lat, effectiveDropoff.lng];
    return [-26.2041, 28.0473];
  }, [driver, effectivePickup, effectiveDropoff]);

  if (!effectivePickup || !effectiveDropoff) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-border bg-card ${className ?? ''}`}
        style={{ height }}
      >
        <div className="absolute inset-0 grid place-items-center p-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">Map unavailable</p>
            <p className="text-xs text-muted-foreground">Pickup and drop-off coordinates are not ready yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const MapContainer: any = (RL as any).MapContainer;
  const Marker: any = (RL as any).Marker;
  const Polyline: any = (RL as any).Polyline;
  const TileLayer: any = (RL as any).TileLayer;

  const isActive = status === 'driver_assigned' || status === 'in_progress';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-border bg-card ${className ?? ''}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          updateWhenIdle
          updateWhenZooming={false}
          keepBuffer={2}
        />

        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#3b82f6',
              weight: 5,
              opacity: isActive ? 0.92 : 0.75,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {fallbackLine && (
          <Polyline
            positions={fallbackLine}
            pathOptions={{
              color: '#94a3b8',
              weight: 3,
              opacity: 0.55,
              dashArray: '8 8',
            }}
          />
        )}

        <Marker position={[effectivePickup.lat, effectivePickup.lng]} icon={pickupIcon} />
        <Marker position={[effectiveDropoff.lat, effectiveDropoff.lng]} icon={dropoffIcon} />
        {driver && <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />}

        <FitToBounds points={boundsPoints} />
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-background/85 px-2.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Pickup
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-background/85 px-2.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          Drop-off
        </div>
        {driver && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-background/85 px-2.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
            <div className="h-2.5 w-2.5 rounded-full bg-red-600" />
            Driver
          </div>
        )}
      </div>
    </div>
  );
}
