import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { AppLayout } from '@/components/AppLayout';
import { TripCard } from '@/components/TripCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import logo from '@/assets/logo.webp';

export default function Index() {
  const { profile } = useAuth();
  const { getUpcomingTrips, loading } = useTrips();
  const upcomingTrips = getUpcomingTrips();
  const isLoading = loading;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  // Get today's trips or next upcoming trip
  const todaysTrips = upcomingTrips?.filter(trip => 
    isToday(parseISO(trip.scheduled_date))
  ) || [];

  const nextTrip = upcomingTrips?.[0];

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header with Logo */}
        <div className="safe-top px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <img src={logo} alt="Street Surfers" className="h-10 w-auto" />
          </div>
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {firstName}
          </h1>
        </div>

        {/* Main Content */}
        <div className="px-5 space-y-6 pb-32">
          {/* Today's Summary */}
          <Card className="bg-card border-border rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center glow-accent">
                  <Calendar className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="font-display font-semibold text-foreground">
                    {format(new Date(), 'EEEE, MMMM d')}
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-secondary" />
                  <Skeleton className="h-4 w-1/2 bg-secondary" />
                </div>
              ) : todaysTrips.length > 0 ? (
                <div className="flex items-center gap-2 text-foreground">
                  <span className="text-3xl font-display font-bold text-accent">{todaysTrips.length}</span>
                  <span className="text-muted-foreground">
                    {todaysTrips.length === 1 ? 'trip scheduled' : 'trips scheduled'}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">No trips scheduled for today</p>
              )}
            </CardContent>
          </Card>

          {/* Next Trip Section */}
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
              {todaysTrips.length > 0 ? "Today's Trips" : 'Upcoming Trip'}
            </h2>

            {isLoading ? (
              <Card className="bg-card border-border rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <Skeleton className="h-6 w-1/3 bg-secondary" />
                  <Skeleton className="h-4 w-full bg-secondary" />
                  <Skeleton className="h-4 w-2/3 bg-secondary" />
                </CardContent>
              </Card>
            ) : todaysTrips.length > 0 ? (
              <div className="space-y-4">
                {todaysTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : nextTrip ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{getDateLabel(nextTrip.scheduled_date)}</span>
                </div>
                <TripCard trip={nextTrip} />
              </div>
            ) : (
              <Card className="bg-card border-border border-dashed rounded-2xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">
                    No upcoming trips
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Your scheduled shuttle trips will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Stats */}
          {upcomingTrips && upcomingTrips.length > 1 && (
            <Card className="bg-card border-border rounded-2xl">
              <CardContent className="p-5">
                <h3 className="text-sm text-muted-foreground mb-3">This Week</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-accent">
                    {upcomingTrips.length}
                  </span>
                  <span className="text-muted-foreground">upcoming trips</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}