import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TripWithDetails, Driver, TripPassenger } from './useTrips';

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

  const fetchTripDetails = async () => {
    if (!tripId || !passenger) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAccessDenied(false);

      // First check if this passenger has access to this trip
      const { data: tripPassenger, error: tpError } = await supabase
        .from('trip_passengers')
        .select('*')
        .eq('trip_id', tripId)
        .eq('passenger_id', passenger.id)
        .single();

      if (tpError || !tripPassenger) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch the trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError || !tripData) {
        setError('Trip not found');
        setLoading(false);
        return;
      }

      // Fetch all passengers for this trip
      const { data: allTripPassengers } = await supabase
        .from('trip_passengers')
        .select('*')
        .eq('trip_id', tripId)
        .order('seat_number', { ascending: true });

      // Fetch passenger profiles
      const passengerIds = allTripPassengers?.map(tp => tp.passenger_id).filter(Boolean) || [];
      let passengersWithProfiles: PassengerWithProfile[] = [];

      if (passengerIds.length > 0) {
        const { data: passengersData } = await supabase
          .from('passengers')
          .select('id, user_id')
          .in('id', passengerIds);

        if (passengersData) {
          const userIds = passengersData.map(p => p.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, phone')
            .in('user_id', userIds);

          const profilesMap = profilesData?.reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {} as Record<string, any>) || {};

          const passengersMap = passengersData.reduce((acc, p) => {
            acc[p.id] = {
              id: p.id,
              user_id: p.user_id,
              profile: profilesMap[p.user_id],
            };
            return acc;
          }, {} as Record<string, any>);

          passengersWithProfiles = allTripPassengers?.map(tp => ({
            ...tp,
            passenger: passengersMap[tp.passenger_id],
          })) || [];
        }
      }

      // Fetch driver if assigned
      let driver: Driver | undefined;
      if (tripData.driver_id) {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', tripData.driver_id)
          .single();

        if (driverData) {
          const { data: driverProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, phone')
            .eq('user_id', driverData.user_id)
            .single();

          driver = {
            ...driverData,
            profile: driverProfile || undefined,
          };
        }
      }

      const currentTripPassenger = passengersWithProfiles.find(
        tp => tp.passenger_id === passenger.id
      ) || { ...tripPassenger };

      setTrip({
        ...tripData,
        trip_passenger: currentTripPassenger,
        all_passengers: passengersWithProfiles,
        driver,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching trip details:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [tripId, passenger]);

  // Subscribe to realtime updates for this trip
  useEffect(() => {
    if (!tripId || !passenger) return;

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        () => fetchTripDetails()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_passengers',
          filter: `trip_id=eq.${tripId}`,
        },
        () => fetchTripDetails()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, passenger]);

  return {
    trip,
    loading,
    error,
    accessDenied,
    refetch: fetchTripDetails,
  };
}
