import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Car,
  Phone,
  X,
  Navigation,
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { useTripDetails } from '@/hooks/useTripDetails';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

export default function TripDetails() {
  const { trip_id } = useParams<{ trip_id: string }>();
  const navigate = useNavigate();
  const { passenger } = useAuth();
  const { trip, loading, error, accessDenied, refetch } = useTripDetails(trip_id);
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const isTripActive = trip?.status === 'in_progress';
  const canCancel = trip?.status === 'scheduled' || trip?.status === 'driver_assigned';

  const handleCallDriver = () => {
    if (trip?.driver?.profile?.phone) {
      window.location.href = `tel:${trip.driver.profile.phone}`;
    }
  };

  const handleCancelTrip = async () => {
    if (!trip || !passenger) return;
    setIsCancelling(true);
    try {
      const { error: cancelError } = await supabase
        .from('trip_passengers')
        .update({ status: 'cancelled' })
        .eq('trip_id', trip.id)
        .eq('passenger_id', passenger.id);

      if (cancelError) throw cancelError;

      toast({ title: 'Trip cancelled', description: 'Your booking has been cancelled.' });
      refetch();
    } catch (err) {
      toast({ title: 'Failed to cancel trip', description: 'Please try again or contact support.', variant: 'destructive' });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <div className="bg-card border-b border-border px-4 py-4 safe-top">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-secondary" />
              <Skeleton className="h-6 w-32 bg-secondary" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-32 w-full bg-secondary rounded-xl" />
            <Skeleton className="h-48 w-full bg-secondary rounded-xl" />
            <Skeleton className="h-24 w-full bg-secondary rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (accessDenied) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex flex-col">
          <div className="bg-card border-b border-border px-4 py-4 safe-top">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-secondary"
                onClick={() => navigate('/trips')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-display font-bold text-foreground">Trip Details</h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="bg-card border-border w-full max-w-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Access Denied</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  You don't have permission to view this trip, or it doesn't exist.
                </p>
                <Button asChild className="w-full gradient-accent text-accent-foreground">
                  <Link to="/trips">Back to My Trips</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !trip) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex flex-col">
          <div className="bg-card border-b border-border px-4 py-4 safe-top">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-secondary"
                onClick={() => navigate('/trips')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-display font-bold text-foreground">Trip Details</h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="bg-card border-border w-full max-w-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Trip Not Found</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {error || "We couldn't find this trip. It may have been removed."}
                </p>
                <Button asChild className="w-full gradient-accent text-accent-foreground">
                  <Link to="/trips">Back to My Trips</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  const pickupAddress = trip.trip_passenger.pickup_address || trip.origin_address;
  const dropoffAddress = trip.trip_passenger.dropoff_address || trip.destination_address;
  const formattedDate = format(parseISO(trip.scheduled_date), 'EEEE, MMMM d, yyyy');
  const formattedTime = trip.pickup_time.slice(0, 5);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4 safe-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-secondary"
                onClick={() => navigate('/trips')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-display font-bold text-foreground">Trip Details</h1>
            </div>
            <Badge className={`${statusColors[trip.status]} border`}>
              {statusLabels[trip.status]}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Trip Type & Time */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Badge 
                  className={`text-sm px-3 py-1 ${trip.trip_type === 'inbound' 
                    ? 'bg-accent text-accent-foreground' 
                    : 'bg-secondary text-foreground border border-border'
                  }`}
                >
                  {trip.trip_type === 'inbound' ? 'Home → Work' : 'Work → Home'}
                </Badge>
                {trip.trip_passenger.seat_number && (
                  <span className="text-sm text-muted-foreground">
                    Seat #{trip.trip_passenger.seat_number}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-foreground">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-semibold text-xl">{formattedTime}</p>
                  <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
              </div>
              
              {trip.pickup_time_window_minutes && (
                <p className="text-xs text-muted-foreground mt-2">
                  Pickup window: ±{trip.pickup_time_window_minutes} minutes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Route */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="h-4 w-4 rounded-full bg-success ring-4 ring-success/20" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pickup</p>
                  <p className="text-foreground font-medium">{pickupAddress}</p>
                </div>
              </div>
              
              <div className="ml-2 border-l-2 border-dashed border-border h-6" />
              
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="h-4 w-4 rounded-full bg-accent ring-4 ring-accent/20" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Drop-off</p>
                  <p className="text-foreground font-medium">{dropoffAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Preview */}
          <Card className="bg-card border-border overflow-hidden">
            <div className="h-48 relative">
              {(trip.origin_lat && trip.origin_lng) ? (
                <img
                  src={`https://staticmap.openstreetmap.de/staticmap.php?center=${trip.origin_lat},${trip.origin_lng}&zoom=13&size=600x300&maptype=osmarenderer&markers=${trip.origin_lat},${trip.origin_lng},green-pushpin${trip.destination_lat && trip.destination_lng ? `|${trip.destination_lat},${trip.destination_lng},red-pushpin` : ''}`}
                  alt="Trip route map"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${trip.origin_lat ? 'hidden' : ''} h-full bg-secondary flex items-center justify-center`}>
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Map preview</p>
                  <p className="text-xs text-muted-foreground">Coordinates not available</p>
                </div>
              </div>
              {isTripActive && (
                <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground animate-pulse">
                  Live Tracking Active
                </Badge>
              )}
            </div>
          </Card>

          {/* Driver Info */}
          {trip.driver ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Your Driver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-accent">
                    <AvatarImage src={trip.driver.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-foreground text-xl">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-foreground">
                      {trip.driver.profile?.full_name || 'Driver'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Car className="h-4 w-4" />
                      <span>
                        {trip.driver.vehicle_color} {trip.driver.vehicle_make} {trip.driver.vehicle_model}
                      </span>
                    </div>
                    {trip.driver.license_plate && (
                      <p className="text-sm font-mono text-accent font-bold mt-1">
                        {trip.driver.license_plate}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">No driver assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A driver will be assigned before your trip
                </p>
              </CardContent>
            </Card>
          )}

          {/* Passenger Manifest */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Passengers ({trip.all_passengers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trip.all_passengers.map((tp, index) => {
                const isYou = tp.passenger_id === passenger?.id;
                return (
                  <div
                    key={tp.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      isYou ? 'bg-accent/10 border border-accent/30' : 'bg-secondary'
                    }`}
                  >
                    <Avatar className={`h-10 w-10 ${isYou ? 'border-2 border-accent' : ''}`}>
                      <AvatarImage src={tp.passenger?.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-foreground">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${isYou ? 'text-accent' : 'text-foreground'}`}>
                          {tp.passenger?.profile?.full_name || 'Passenger'}
                        </p>
                        {isYou && (
                          <Badge className="bg-accent text-accent-foreground text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      {tp.seat_number && (
                        <p className="text-xs text-muted-foreground">
                          Seat #{tp.seat_number}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Notes */}
          {trip.notes && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Trip Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm">{trip.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <div className="flex gap-3 max-w-lg mx-auto">
            {isTripActive ? (
              <Button asChild className="flex-1 gradient-accent text-accent-foreground h-12">
                <Link to={`/map?trip=${trip.id}`}>
                  <Navigation className="h-5 w-5 mr-2" />
                  Track Live
                </Link>
              </Button>
            ) : (
              <>
                {trip.driver && trip.driver.profile?.phone && (
                  <Button
                    onClick={handleCallDriver}
                    variant="outline"
                    className="flex-1 h-12 border-border text-foreground"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call Driver
                  </Button>
                )}
                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 h-12 border-destructive text-destructive hover:bg-destructive/10"
                        disabled={isCancelling}
                      >
                        {isCancelling ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <X className="h-5 w-5 mr-2" />}
                        Cancel Trip
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your booking for this trip. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelTrip}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Cancel Trip
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
