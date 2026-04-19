import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useTrips } from '@/hooks/useTrips';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'driver-marker',
});

interface DriverLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LiveMap() {
  const { getUpcomingTrips } = useTrips();
  const activeTrip = getUpcomingTrips().find(t =>
    t.status === 'driver_assigned' || t.status === 'in_progress'
  );
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  useEffect(() => {
    if (!activeTrip?.driver_id) return;

    // Fetch initial driver location
    const fetchLocation = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, updated_at')
        .eq('driver_id', activeTrip.driver_id!)
        .maybeSingle();
      if (data) setDriverLocation(data);
    };
    fetchLocation();

    // Subscribe to realtime updates
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

  // Default center: South Africa
  const defaultCenter: [number, number] = [-26.2041, 28.0473];
  const mapCenter: [number, number] = driverLocation
    ? [driverLocation.latitude, driverLocation.longitude]
    : activeTrip?.origin_lat && activeTrip?.origin_lng
    ? [activeTrip.origin_lat, activeTrip.origin_lng]
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
                {driverLocation && (
                  <>
                    <RecenterMap lat={driverLocation.latitude} lng={driverLocation.longitude} />
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
                  </>
                )}
              </MapContainer>

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
