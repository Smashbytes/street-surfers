import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useTrips } from '@/hooks/useTrips';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, MapPin, Navigation, User } from 'lucide-react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRoute } from '@/lib/routing';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LIVEMAP_PULSE_CSS_ID = 'passenger-livemap-pulse-css';
function ensurePulseCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(LIVEMAP_PULSE_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = LIVEMAP_PULSE_CSS_ID;
  style.textContent = `
    @keyframes livemapDriverPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(208,28,0,.45); }
      50% { box-shadow: 0 0 0 14px rgba(208,28,0,0); }
    }
    @keyframes livemapSelfPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,.45); }
      50% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
    }
  `;
  document.head.appendChild(style);
}

function makeDot(color: string, pulseAnim?: string, size = 18): L.DivIcon {
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
      ${pulseAnim ? `animation:${pulseAnim} 1.8s ease-in-out infinite;` : ''}
    "></div>`,
  });
}

const pickupIcon = makeDot('#3b82f6');
const dropoffIcon = makeDot('#22c55e');
const driverIcon = makeDot('#d01c00', 'livemapDriverPulse', 20);
const selfIcon = makeDot('#6366f1', 'livemapSelfPulse', 16);

function FitToBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0] as L.LatLngExpression, 15);
    } else {
      map.fitBounds(points as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, points]);

  return null;
}

const freshnessTone: Record<string, string> = {
  fresh: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  stale: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  offline: 'bg-destructive/15 text-destructive border-destructive/30',
  missing: 'bg-muted text-muted-foreground border-border',
};

export default function LiveMap() {
  const { trips, getUpcomingTrips } = useTrips();
  const [searchParams] = useSearchParams();
  const [selfLocation, setSelfLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    ensurePulseCss();
  }, []);

  const requestedTripId = searchParams.get('trip');
  const requestedTrip = requestedTripId ? trips.find((trip) => trip.id === requestedTripId) ?? null : null;
  const fallbackLiveTrip = getUpcomingTrips().find(
    (trip) => trip.status === 'driver_assigned' || trip.status === 'in_progress',
  );
  const activeTrip = requestedTrip ?? fallbackLiveTrip ?? null;

  useEffect(() => {
    if (!activeTrip || !('geolocation' in navigator)) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => setSelfLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [activeTrip?.id]);

  const pickup = useMemo(() => {
    const tp = activeTrip?.trip_passenger;
    if (tp?.pickup_lat != null && tp?.pickup_lng != null) {
      return { lat: tp.pickup_lat, lng: tp.pickup_lng };
    }
    if (activeTrip?.origin_lat != null && activeTrip?.origin_lng != null) {
      return { lat: activeTrip.origin_lat, lng: activeTrip.origin_lng };
    }
    return null;
  }, [activeTrip]);

  const dropoff = useMemo(() => {
    const tp = activeTrip?.trip_passenger;
    if (tp?.dropoff_lat != null && tp?.dropoff_lng != null) {
      return { lat: tp.dropoff_lat, lng: tp.dropoff_lng };
    }
    if (activeTrip?.destination_lat != null && activeTrip?.destination_lng != null) {
      return { lat: activeTrip.destination_lat, lng: activeTrip.destination_lng };
    }
    return null;
  }, [activeTrip]);

  const driverLocation = activeTrip?.driver_location ?? null;
  const locationFreshness = activeTrip?.location_freshness ?? 'missing';
  const etaMinutes = activeTrip?.trip_passenger?.eta_minutes ?? activeTrip?.eta_minutes ?? null;
  const hasLiveDriver = !!driverLocation && (activeTrip?.status === 'driver_assigned' || activeTrip?.status === 'in_progress');

  useEffect(() => {
    let cancelled = false;
    setRouteCoords(null);

    if (pickup && dropoff) {
      fetchRoute([pickup, dropoff]).then((coords) => {
        if (!cancelled) setRouteCoords(coords);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  const boundsPoints = useMemo<LatLngExpression[]>(() => {
    const points: LatLngExpression[] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (dropoff) points.push([dropoff.lat, dropoff.lng]);
    if (driverLocation) points.push([driverLocation.latitude, driverLocation.longitude]);
    if (selfLocation) points.push([selfLocation.lat, selfLocation.lng]);
    return points;
  }, [pickup, dropoff, driverLocation, selfLocation]);

  const defaultCenter: [number, number] = [-26.2041, 28.0473];
  const mapCenter: [number, number] = pickup
    ? [pickup.lat, pickup.lng]
    : driverLocation
    ? [driverLocation.latitude, driverLocation.longitude]
    : defaultCenter;

  const liveStatusLabel =
    activeTrip?.status === 'in_progress'
      ? 'Trip In Progress'
      : activeTrip?.status === 'driver_assigned'
      ? 'Driver Assigned'
      : 'Scheduled Preview';

  return (
    <AppLayout tripId={activeTrip?.id}>
      <div className="min-h-screen flex flex-col">
        <div className="bg-card border-b border-border px-4 py-4 safe-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold">Live Tracking</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {requestedTripId ? 'Viewing the selected trip map' : 'Track your shuttle in real time'}
              </p>
            </div>
            {activeTrip && (
              <Badge className={hasLiveDriver ? 'bg-accent text-accent-foreground animate-pulse' : 'bg-secondary text-foreground'}>
                <Navigation className="h-3 w-3 mr-1" />
                {hasLiveDriver ? 'Live' : 'Preview'}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          {activeTrip ? (
            <>
              <MapContainer
                center={mapCenter}
                zoom={14}
                className="h-[calc(100vh-220px)] w-full z-0"
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {routeCoords && (
                  <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
                  />
                )}
                {!routeCoords && pickup && dropoff && (
                  <Polyline
                    positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
                    pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.55, dashArray: '8 8' }}
                  />
                )}

                {pickup && (
                  <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">Pickup</p>
                        <p className="text-xs text-gray-500">
                          {activeTrip.trip_passenger.pickup_address ?? activeTrip.origin_address}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {dropoff && (
                  <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">Drop-off</p>
                        <p className="text-xs text-gray-500">
                          {activeTrip.trip_passenger.dropoff_address ?? activeTrip.destination_address}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {driverLocation && (
                  <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={driverIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">Your Driver</p>
                        <p className="text-xs text-gray-500">
                          Updated {new Date(driverLocation.updated_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {selfLocation && (
                  <Marker position={[selfLocation.lat, selfLocation.lng]} icon={selfIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">You</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                <FitToBounds points={boundsPoints} />
              </MapContainer>

              <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-wrap gap-1.5 max-w-[calc(100%-24px)]">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-background/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                  <div className="h-2 w-2 rounded-full bg-blue-500" /> Pickup
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-background/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                  <div className="h-2 w-2 rounded-full bg-green-500" /> Drop-off
                </div>
                {driverLocation && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-background/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                    <div className="h-2 w-2 rounded-full bg-red-600" /> Driver
                  </div>
                )}
                {selfLocation && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-background/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" /> You
                  </div>
                )}
              </div>

              <div className="absolute bottom-20 left-4 right-4 z-[1000] space-y-3 sm:bottom-4">
                {activeTrip.status !== 'scheduled' && (
                  <Card className={`backdrop-blur border shadow-lg ${freshnessTone[locationFreshness] ?? freshnessTone.missing}`}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {locationFreshness === 'fresh'
                            ? 'Driver location is live'
                            : locationFreshness === 'stale'
                            ? 'Driver location is delayed'
                            : locationFreshness === 'offline'
                            ? 'Driver location is offline'
                            : 'Waiting for driver location'}
                        </p>
                        <p className="text-xs opacity-90">
                          {driverLocation
                            ? `Last update: ${new Date(driverLocation.updated_at).toLocaleTimeString()}`
                            : 'We will show the driver as soon as the app reports a live position.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card/95 backdrop-blur border-border shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{liveStatusLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {etaMinutes != null
                              ? `Estimated pickup in ${etaMinutes} min`
                              : activeTrip.status === 'scheduled'
                              ? 'Scheduled trip preview is ready'
                              : 'ETA will appear when the trip is actively updating'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{activeTrip.pickup_time?.slice(0, 5)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">No trip selected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose an upcoming trip to see the route preview or live driver position
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
