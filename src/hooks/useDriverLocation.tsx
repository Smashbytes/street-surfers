import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DriverLocation {
  id: string;
  driver_id: string;
  trip_id: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  updated_at: string;
}

export function useDriverLocation(driverId: string | null | undefined) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestLocation = async () => {
    if (!driverId) {
      setLocation(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setLocation(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching driver location:', err);
      setError('Failed to load driver location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestLocation();
  }, [driverId]);

  // Subscribe to realtime location updates
  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          if (payload.new) {
            setLocation(payload.new as DriverLocation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return {
    location,
    loading,
    error,
    refetch: fetchLatestLocation,
  };
}
