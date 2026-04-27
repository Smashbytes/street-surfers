import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TripWithDetails, TripPassenger } from './useTrips';
import { fetchTripSnapshots, mapSnapshotToTripDetails } from '@/lib/tripSnapshots';

interface PassengerWithProfile extends TripPassenger {
  passenger?: {
    id: string;
    user_id: string;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
      phone: string | null;
    };
  };
}

export interface TripDetailsData extends Omit<TripWithDetails, 'trip_passenger'> {
  trip_passenger: PassengerWithProfile;
  all_passengers: PassengerWithProfile[];
}

export function useTripDetails(tripId: string | undefined) {
  const { passenger } = useAuth();
  const [trip, setTrip] = useState<TripDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchTripDetails = useCallback(async () => {
    if (!tripId || !passenger) {
      setTrip(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAccessDenied(false);

      const snapshotRows = await fetchTripSnapshots(tripId);
      const snapshot = snapshotRows[0]?.snapshot;

      if (!snapshot) {
        setTrip(null);
        setAccessDenied(true);
        setError(null);
        return;
      }

      const mappedTrip = mapSnapshotToTripDetails(snapshot) as TripDetailsData | null;
      if (!mappedTrip) {
        setTrip(null);
        setAccessDenied(true);
        setError(null);
        return;
      }

      setTrip(mappedTrip);
      setError(null);
    } catch (err) {
      console.error('Error fetching trip details:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  }, [passenger, tripId]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  useEffect(() => {
    if (!tripId || !passenger) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchTripDetails();
      }, 250);
    };

    const channel = supabase
      .channel(`passenger-trip-details-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, debouncedRefetch)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_passengers', filter: `trip_id=eq.${tripId}` },
        debouncedRefetch,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, debouncedRefetch)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_geofence_events', filter: `trip_id=eq.${tripId}` },
        debouncedRefetch,
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchTripDetails, passenger, tripId]);

  return {
    trip,
    loading,
    error,
    accessDenied,
    refetch: fetchTripDetails,
  };
}
