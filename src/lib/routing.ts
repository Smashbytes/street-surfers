import { supabase } from '@/integrations/supabase/client';

interface Waypoint {
  lat: number;
  lng: number;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  confidence: number;
}

export async function fetchRoute(waypoints: Waypoint[]): Promise<[number, number][] | null> {
  if (waypoints.length < 2) return null;

  try {
    const { data, error } = await supabase.functions.invoke('map-adapter', {
      body: {
        action: 'route',
        waypoints,
      },
    });

    if (error) throw error;
    return (data?.route ?? null) as [number, number][] | null;
  } catch (err) {
    console.error('Route fetch failed:', err);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim() === '' || address.trim().toUpperCase() === 'TBD') return null;

  try {
    const { data, error } = await supabase.functions.invoke('map-adapter', {
      body: {
        action: 'geocode',
        query: address,
        limit: 1,
      },
    });

    if (error) throw error;

    const first = (data?.results ?? [])[0];
    if (!first?.lat || !first?.lng) return null;

    return {
      lat: Number(first.lat),
      lng: Number(first.lng),
      address: first.address ?? address,
      confidence: Number(first.confidence ?? 0),
    };
  } catch (err) {
    console.error('Geocode failed:', err);
    return null;
  }
}
