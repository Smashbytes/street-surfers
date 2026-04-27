import { supabase } from '@/integrations/supabase/client';

const DEFAULT_ARRAY: unknown[] = [];

interface SnapshotDriver {
  id: string;
  userId: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  licenseNumber: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  licensePlate: string | null;
  isActive: boolean;
  isOnline: boolean;
}

interface SnapshotTripPassenger {
  id: string;
  tripId: string;
  passengerId: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  seatNumber: number | null;
  pickupOrder: number | null;
  status: string;
  etaMinutes?: number | null;
  pickupTime: string | null;
  dropoffTime: string | null;
  passenger?: {
    id: string;
    userId: string;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
}

interface TripSnapshot {
  id: string;
  tripType: 'inbound' | 'outbound';
  direction?: string | null;
  scheduledDate: string;
  pickupTime: string;
  pickupTimeWindowMinutes: number | null;
  status: 'scheduled' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
  originAddress: string;
  destinationAddress: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  notes: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  driver: SnapshotDriver | null;
  driverLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
  lastLocationAt?: string | null;
  locationFreshness?: string | null;
  etaMinutes?: number | null;
  geofenceState?: Record<string, unknown> | null;
  tripPassengerForUser?: SnapshotTripPassenger | null;
  manifest?: SnapshotTripPassenger[] | null;
}

interface RpcSnapshotRow {
  trip_id: string;
  snapshot: TripSnapshot;
}

function mapDriver(driver: SnapshotDriver | null | undefined) {
  if (!driver) return undefined;
  return {
    id: driver.id,
    user_id: driver.userId,
    license_number: driver.licenseNumber ?? null,
    vehicle_make: driver.vehicleMake ?? null,
    vehicle_model: driver.vehicleModel ?? null,
    vehicle_color: driver.vehicleColor ?? null,
    license_plate: driver.licensePlate ?? null,
    vehicle_photo_url: null,
    is_active: driver.isActive,
    is_online: driver.isOnline,
    profile: {
      full_name: driver.fullName ?? null,
      avatar_url: driver.avatarUrl ?? null,
      phone: driver.phone ?? null,
    },
  };
}

function mapTripPassenger(passenger: SnapshotTripPassenger | null | undefined) {
  if (!passenger) return null;
  return {
    id: passenger.id,
    trip_id: passenger.tripId,
    passenger_id: passenger.passengerId,
    pickup_address: passenger.pickupAddress ?? null,
    dropoff_address: passenger.dropoffAddress ?? null,
    pickup_lat: passenger.pickupLat ?? null,
    pickup_lng: passenger.pickupLng ?? null,
    dropoff_lat: passenger.dropoffLat ?? null,
    dropoff_lng: passenger.dropoffLng ?? null,
    seat_number: passenger.seatNumber ?? null,
    pickup_order: passenger.pickupOrder ?? null,
    status: passenger.status,
    eta_minutes: passenger.etaMinutes ?? null,
    pickup_time: passenger.pickupTime ?? null,
    dropoff_time: passenger.dropoffTime ?? null,
    passenger: passenger.passenger
      ? {
          id: passenger.passenger.id,
          user_id: passenger.passenger.userId,
          profile: {
            full_name: passenger.passenger.fullName ?? null,
            avatar_url: passenger.passenger.avatarUrl ?? null,
            phone: passenger.passenger.phone ?? null,
          },
        }
      : undefined,
  };
}

export function mapSnapshotToPassengerTrip(snapshot: TripSnapshot) {
  const tripPassenger = mapTripPassenger(snapshot.tripPassengerForUser);
  if (!tripPassenger) return null;

  return {
    id: snapshot.id,
    driver_id: snapshot.driver?.id ?? null,
    trip_type: snapshot.tripType,
    scheduled_date: snapshot.scheduledDate,
    pickup_time: snapshot.pickupTime,
    pickup_time_window_minutes: snapshot.pickupTimeWindowMinutes ?? null,
    origin_address: snapshot.originAddress,
    destination_address: snapshot.destinationAddress,
    origin_lat: snapshot.originLat ?? null,
    origin_lng: snapshot.originLng ?? null,
    destination_lat: snapshot.destinationLat ?? null,
    destination_lng: snapshot.destinationLng ?? null,
    status: snapshot.status,
    notes: snapshot.notes ?? null,
    actual_start_time: snapshot.actualStartTime ?? null,
    actual_end_time: snapshot.actualEndTime ?? null,
    trip_passenger: tripPassenger,
    driver: mapDriver(snapshot.driver),
    driver_location: snapshot.driverLocation
      ? {
          latitude: snapshot.driverLocation.latitude,
          longitude: snapshot.driverLocation.longitude,
          updated_at: snapshot.driverLocation.updatedAt,
        }
      : null,
    last_location_at: snapshot.lastLocationAt ?? null,
    location_freshness: snapshot.locationFreshness ?? null,
    eta_minutes: snapshot.etaMinutes ?? tripPassenger.eta_minutes ?? null,
    geofence_state: snapshot.geofenceState ?? null,
  };
}

export function mapSnapshotToTripDetails(snapshot: TripSnapshot) {
  const baseTrip = mapSnapshotToPassengerTrip(snapshot);
  if (!baseTrip) return null;

  return {
    ...baseTrip,
    all_passengers: (snapshot.manifest ?? DEFAULT_ARRAY).map((passenger) =>
      mapTripPassenger(passenger as SnapshotTripPassenger),
    ).filter(Boolean),
  };
}

export async function fetchTripSnapshots(tripId?: string) {
  const { data, error } = await supabase.rpc('get_trip_snapshots', {
    p_trip_id: tripId ?? null,
    p_active_only: false,
  });

  if (error) throw error;
  return (data ?? []) as RpcSnapshotRow[];
}
