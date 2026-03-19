import { useTrips } from '@/hooks/useTrips';
import { AppLayout } from '@/components/AppLayout';
import { TripCard } from '@/components/TripCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock } from 'lucide-react';

export default function MyTrips() {
  const { loading, getUpcomingTrips, getPastTrips } = useTrips();

  const upcomingTrips = getUpcomingTrips();
  const pastTrips = getPastTrips();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-6 safe-top">
          <h1 className="text-2xl font-display font-bold text-foreground">My Trips</h1>
          <p className="text-muted-foreground text-sm mt-1">View your scheduled and past trips</p>
        </div>

        <div className="p-4">
          <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary p-1 rounded-xl">
              <TabsTrigger 
                value="upcoming" 
                className="flex items-center gap-2 rounded-lg text-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Calendar className="h-4 w-4" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 rounded-lg text-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Clock className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-6 w-32 bg-secondary" />
                      <Skeleton className="h-4 w-full bg-secondary" />
                      <Skeleton className="h-4 w-3/4 bg-secondary" />
                    </CardContent>
                  </Card>
                ))
              ) : upcomingTrips.length > 0 ? (
                upcomingTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))
              ) : (
                <Card className="bg-card border-border border-dashed">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-semibold text-lg">No upcoming trips</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check back later for new assignments
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {loading ? (
                <Skeleton className="h-32 w-full bg-secondary" />
              ) : pastTrips.length > 0 ? (
                pastTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} showActions={false} compact />
                ))
              ) : (
                <Card className="bg-card border-border border-dashed">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-semibold text-lg">No trip history</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your completed trips will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}