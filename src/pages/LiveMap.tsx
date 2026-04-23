import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useTrips } from '@/hooks/useTrips';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRoute } from '@/lib/routing';

// Fix default marker icons for Leaflet + bundlers
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

interface DriverLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

function FitToBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0] as any, 15);
    } else {
      map.fitBounds(points as any, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, points]);
  return null;
}

export default function LiveMap() {
  const { getUpcomingTrips } = useTrips();
  const activeTrip = getUpcomingTrips().find(t =>
    t.status === 'driver_assigned' || t.status === 'in_progress'
  );
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [selfLocation, setSelfLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => { ensurePulseCss(); }, []);

  // Driver location subscription
  useEffect(() => {
    if (!activeTrip?.driver_id) return;

    const fetchLocation = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, updated_at')
        .eq('driver_id', activeTrip.driver_id!)
        .maybeSingle();
      if (data) setDriverLocation(data);
    };
    fetchLocation();

    const channel = supabase
      .channel(`driver-loc-${activeTrip.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${activeTrip.driver_id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row?.latitude != null && row?.longitude != null) {
            setDriverLocation({
              latitude: row.latitude,
              longitude: row.longitude,
              updated_at: row.updated_at,
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTrip?.driver_id]);

  // Passenger's own GPS (best effort, no prompt spam — browser prompts once per session)
  useEffect(() => {
    if (!activeTrip || !('geolocation' in navigator)) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => setSelfLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* silently ignore — passenger can still see driver + pickup */ },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [activeTrip?.id]);

  // Resolve pickup + dropoff from trip_passenger first, fall back to trip origin/destination
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

  // Fetch pickup → dropoff route
  useEffect(() => {
    let cancelled = false;
    setRouteCoords(null);
    if (pickup && dropoff) {
      fetchRoute([pickup, dropoff]).then((coords) => {
        if (!cancelled) setRouteCoords(coords);
      });
    }
    return () => { cancelled = true; };
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

  return (
    <AppLayout tripId={activeTrip?.id}>
      <div className="min-h-screen flex flex-col">
        <div className="bg-card border-b border-border px-4 py-4 safe-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold">Live Tracking</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Track your shuttle in real-time</p>
            </div>
            {activeTrip && (
              <Badge className="bg-accent text-accent-foreground animate-pulse">
                <Navigation className="h-3 w-3 mr-1" />
                Live
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
                className="h-[calc(100vh-200px)] w-full z-0"
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
                        <p className="text-xs text-gray-500">{activeTrip.trip_passenger.pickup_address ?? activeTrip.origin_address}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {dropoff && (
                  <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">Drop-off</p>
                        <p className="text-xs text-gray-500">{activeTrip.trip_passenger.dropoff_address ?? activeTrip.destination_address}</p>
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

              {/* Legend */}
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

              {/* Info overlay */}
              <div className="absolute bottom-20 left-4 right-4 z-[1000] sm:bottom-4">
                <Card className="bg-card/95 backdrop-blur border-border shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {activeTrip.status === 'in_progress' ? 'Trip In Progress' : 'Driver Assigned'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {driverLocation
                              ? `Last update: ${new Date(driverLocation.updated_at).toLocaleTimeString()}`
                              : 'Waiting for driver location...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                  <p className="text-foreground font-medium">No active trip</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Live tracking will be available when your driver starts the trip
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
