import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Trip {
  id: string;
  driver_id: string | null;
  trip_type: 'inbound' | 'outbound';
  scheduled_date: string;
  pickup_time: string;
  pickup_time_window_minutes: number | null;
  origin_address: string;
  destination_address: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  status: 'scheduled' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
}

export interface TripPassenger {
  id: string;
  trip_id: string;
  passenger_id: string;
  pickup_address: string | null;
  dropoff_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  seat_number: number | null;
  status: 'confirmed' | 'picked_up' | 'dropped_off' | 'no_show' | 'cancelled';
  pickup_time: string | null;
  dropoff_time: string | null;
}

export interface Driver {
  id: string;
  user_id: string;
  license_number: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  vehicle_photo_url: string | null;
  is_active: boolean;
  is_online: boolean;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  };
}

export interface TripWithDetails extends Trip {
  trip_passenger: TripPassenger;
  driver?: Driver;
}

export function useTrips() {
  const { passenger } = useAuth();
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    if (!passenger) {
      setTrips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch trip assignments for this passenger
      const { data: tripPassengers, error: tpError } = await supabase
        .from('trip_passengers')
        .select('*')
        .eq('passenger_id', passenger.id);

      if (tpError) throw tpError;

      if (!tripPassengers || tripPassengers.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // Fetch the actual trips
      const tripIds = tripPassengers.map(tp => tp.trip_id);
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds)
        .order('scheduled_date', { ascending: true });

      if (tripsError) throw tripsError;

      // Fetch drivers for trips that have drivers
      const driverIds = tripsData
        ?.filter(t => t.driver_id)
        .map(t => t.driver_id) || [];
      
      let driversMap: Record<string, Driver> = {};
      
      if (driverIds.length > 0) {
        const { data: driversData } = await supabase
          .from('drivers')
          .select('*')
          .in('id', driverIds);

        if (driversData) {
          // Fetch profiles for drivers
          const driverUserIds = driversData.map(d => d.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, phone')
            .in('user_id', driverUserIds);

          const profilesMap = profilesData?.reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {} as Record<string, any>) || {};

          driversData.forEach(driver => {
            driversMap[driver.id] = {
              ...driver,
              profile: profilesMap[driver.user_id],
            };
          });
        }
      }

      // Combine data — skip any trip that somehow has no matching trip_passenger
      const combinedTrips: TripWithDetails[] = (tripsData ?? []).flatMap(trip => {
        const tripPassenger = tripPassengers.find(tp => tp.trip_id === trip.id);
        if (!tripPassenger) return [];
        return [{
          ...trip,
          trip_passenger: tripPassenger,
          driver: trip.driver_id ? driversMap[trip.driver_id] : undefined,
        }];
      });

      setTrips(combinedTrips);
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [passenger]);

  // Subscribe to realtime updates — filtered to this passenger only
  useEffect(() => {
    if (!passenger) return;

    const channel = supabase
      .channel(`trips-updates-${passenger.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_passengers',
          filter: `passenger_id=eq.${passenger.id}`,
        },
        () => {
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [passenger?.id]);

  const getTodaysTrips = () => {
    const today = new Date().toISOString().split('T')[0];
    return trips.filter(t => t.scheduled_date === today);
  };

  const getUpcomingTrips = () => {
    const today = new Date().toISOString().split('T')[0];
    return trips.filter(t => t.scheduled_date >= today && t.status !== 'completed' && t.status !== 'cancelled');
  };

  const getPastTrips = () => {
    const today = new Date().toISOString().split('T')[0];
    return trips.filter(t => t.scheduled_date < today || t.status === 'completed');
  };

  const getNextTrip = () => {
    const upcoming = getUpcomingTrips();
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  return {
    trips,
    loading,
    error,
    refetch: fetchTrips,
    getTodaysTrips,
    getUpcomingTrips,
    getPastTrips,
    getNextTrip,
  };
}
