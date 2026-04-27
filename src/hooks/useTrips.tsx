import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { fetchTripSnapshots, mapSnapshotToPassengerTrip } from '@/lib/tripSnapshots';

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
  pickup_order: number | null;
  status: 'confirmed' | 'picked_up' | 'dropped_off' | 'no_show' | 'cancelled';
  eta_minutes?: number | null;
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
  driver_location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  } | null;
  location_freshness?: string | null;
  eta_minutes?: number | null;
  geofence_state?: Record<string, unknown> | null;
}

export function useTrips() {
  const { passenger } = useAuth();
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    if (!passenger) {
      setTrips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const snapshotRows = await fetchTripSnapshots();
      const mappedTrips = snapshotRows
        .map((row) => mapSnapshotToPassengerTrip(row.snapshot))
        .filter(Boolean) as TripWithDetails[];

      setTrips(mappedTrips);
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [passenger]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    if (!passenger) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchTrips();
      }, 250);
    };

    const channel = supabase
      .channel(`passenger-trip-snapshots-${passenger.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, debouncedRefetch)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_passengers',
          filter: `passenger_id=eq.${passenger.id}`,
        },
        debouncedRefetch,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_geofence_events' }, debouncedRefetch)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchTrips, passenger]);

  const getTodaysTrips = () => {
    const today = new Date().toISOString().split('T')[0];
    return trips.filter((trip) => trip.scheduled_date === today);
  };

  const getUpcomingTrips = () => {
    const today = new Date().toISOString().split('T')[0];
    return trips.filter(
      (trip) => trip.scheduled_date >= today && trip.status !== 'completed' && trip.status !== 'cancelled',
    );
  };

  const getPastTrips = () => {
    const today = new Date().toISOString().split('T')[0];
    return trips.filter((trip) => trip.scheduled_date < today || trip.status === 'completed');
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
