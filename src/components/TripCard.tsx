import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, User, Car, Home, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TripWithDetails } from '@/hooks/useTrips';
import { format, parseISO } from 'date-fns';

interface TripCardProps {
  trip: TripWithDetails;
  showDriver?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-secondary text-foreground border-border',
  driver_assigned: 'bg-warning/20 text-warning border-warning/30',
  in_progress: 'bg-accent/20 text-accent border-accent/30',
  completed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  driver_assigned: 'Driver Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function TripCard({ trip, showDriver = true, showActions = true, compact = false }: TripCardProps) {
  const pickupAddress = trip.trip_passenger?.pickup_address || trip.origin_address;
  const dropoffAddress = trip.trip_passenger?.dropoff_address || trip.destination_address;
  
  const formattedDate = format(parseISO(trip.scheduled_date), 'EEE, MMM d');
  const formattedTime = trip.pickup_time.slice(0, 5);

  return (
    <Card className="bg-card border-border overflow-hidden hover:border-accent/50 transition-colors">
      <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge 
              className={`font-medium ${trip.trip_type === 'inbound' 
                ? 'bg-accent text-accent-foreground' 
                : 'bg-secondary text-foreground border border-border'
              }`}
            >
              {trip.trip_type === 'inbound' ? 'Home → Work' : 'Work → Home'}
            </Badge>
            {trip.trip_passenger?.seat_number && (
              <span className="text-xs text-muted-foreground">
                Seat {trip.trip_passenger.seat_number}
              </span>
            )}
          </div>
          <Badge className={`${statusColors[trip.status]} border`}>
            {statusLabels[trip.status]}
          </Badge>
        </div>

        {/* Time & Date */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Clock className="h-4 w-4 text-accent" />
          <span className="font-semibold text-foreground">{formattedTime}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formattedDate}</span>
          {trip.pickup_time_window_minutes && (
            <span className="text-xs text-muted-foreground">
              (±{trip.pickup_time_window_minutes}min window)
            </span>
          )}
        </div>

        {/* Route */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-1.5">
              <div className="h-3 w-3 rounded-full bg-success ring-4 ring-success/20" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                {trip.trip_type === 'inbound'
                  ? <Home className="h-3 w-3 text-muted-foreground" />
                  : <Building2 className="h-3 w-3 text-muted-foreground" />}
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {trip.trip_type === 'inbound' ? 'Home Pickup' : 'Work / School Pickup'}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground truncate">{pickupAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1.5">
              <div className="h-3 w-3 rounded-full bg-accent ring-4 ring-accent/20" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                {trip.trip_type === 'inbound'
                  ? <Building2 className="h-3 w-3 text-muted-foreground" />
                  : <Home className="h-3 w-3 text-muted-foreground" />}
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {trip.trip_type === 'inbound' ? 'Work / School Drop-off' : 'Home Drop-off'}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground truncate">{dropoffAddress}</p>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        {showDriver && trip.driver && (
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl mb-4 border border-border">
            <Avatar className="h-10 w-10 border-2 border-accent">
              <AvatarImage src={trip.driver.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {trip.driver.profile?.full_name || 'Driver'}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Car className="h-3 w-3" />
                <span className="truncate">
                  {trip.driver.vehicle_color} {trip.driver.vehicle_make} {trip.driver.vehicle_model}
                </span>
              </div>
              {trip.driver.license_plate && (
                <p className="text-xs font-mono text-accent font-semibold">
                  {trip.driver.license_plate}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            {(trip.status === 'driver_assigned' || trip.status === 'in_progress') && (
              <Button asChild className="flex-1 gradient-accent text-accent-foreground hover:opacity-90">
                <Link to={`/map?trip=${trip.id}`}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Live Map
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="flex-1 border-border text-foreground hover:bg-secondary hover:text-foreground">
              <Link to={`/passenger/trips/${trip.id}`}>
                Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}