import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Home, Building2, Check, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, addDays, isBefore, startOfDay } from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

interface AvailabilityRequest {
  id: string;
  day_of_week: number;
  inbound_time: string | null;
  outbound_time: string | null;
  status: string;
  effective_from: string;
}

export default function Schedule() {
  const { passenger } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityRequest[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newInboundTime, setNewInboundTime] = useState('07:30');
  const [newOutboundTime, setNewOutboundTime] = useState('17:00');

  const rideType = (passenger?.ride_type || 'dual') as 'inbound' | 'outbound' | 'dual';
  const canInbound = rideType === 'inbound' || rideType === 'dual';
  const canOutbound = rideType === 'outbound' || rideType === 'dual';

  useEffect(() => {
    if (passenger?.id) {
      fetchAvailability();
    }
  }, [passenger?.id]);

  const fetchAvailability = async () => {
    if (!passenger) return;

    try {
      const { data, error } = await supabase
        .from('availability_requests')
        .select('*')
        .eq('passenger_id', passenger.id)
        .order('day_of_week');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDay = (day: number) => {
    return availability.find((a) => a.day_of_week === day);
  };

  const handleAddAvailability = async () => {
    if (selectedDay === null || !passenger) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('availability_requests').insert({
        passenger_id: passenger.id,
        day_of_week: selectedDay,
        inbound_time: canInbound ? newInboundTime : null,
        outbound_time: canOutbound ? newOutboundTime : null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Schedule Submitted',
        description: 'Your availability has been sent for dispatch approval.',
      });

      setSelectedDay(null);
      fetchAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit schedule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('availability_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Removed',
        description: 'Availability request removed.',
      });

      fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: 'Error',
        description: 'Cannot remove approved schedules.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-400">
            <Check className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-destructive">
            <X className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-warning">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  // Build week view
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="safe-top px-5 pt-6 pb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">My Schedule</h1>
          <p className="text-muted-foreground text-sm">Manage your shuttle availability</p>
        </div>

        <div className="px-5 space-y-4 pb-32">
          {/* Week Grid */}
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Tap a day to add or view availability</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 bg-secondary rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayDate = addDays(weekStart, day.value);
                    const isPast = isBefore(dayDate, today);
                    const existing = getAvailabilityForDay(day.value);
                    const isSelected = selectedDay === day.value;

                    return (
                      <div key={day.value}>
                        <button
                          onClick={() => !isPast && !existing && setSelectedDay(isSelected ? null : day.value)}
                          disabled={isPast || !!existing}
                          className={cn(
                            'w-full p-4 rounded-xl text-left transition-all flex items-center justify-between',
                            isPast && 'opacity-50 cursor-not-allowed bg-secondary/50',
                            existing && 'bg-secondary cursor-default',
                            !isPast && !existing && 'bg-secondary hover:bg-muted cursor-pointer',
                            isSelected && 'ring-2 ring-accent bg-accent/10'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center font-display font-semibold',
                                existing?.status === 'approved'
                                  ? 'bg-green-500/20 text-green-400'
                                  : existing?.status === 'pending'
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-muted text-foreground'
                              )}
                            >
                              {day.label}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{day.fullLabel}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(dayDate, 'MMM d')}
                              </p>
                            </div>
                          </div>

                          {existing ? (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                {existing.inbound_time && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Home className="w-3 h-3" />
                                    {existing.inbound_time}
                                  </p>
                                )}
                                {existing.outbound_time && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {existing.outbound_time}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {getStatusBadge(existing.status)}
                                {existing.status === 'pending' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAvailability(existing.id);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : !isPast ? (
                            <Plus className="w-5 h-5 text-muted-foreground" />
                          ) : null}
                        </button>

                        {/* Add availability form */}
                        {isSelected && (
                          <div className="mt-2 p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-4">
                            {canInbound && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                  <Home className="w-5 h-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">Inbound</p>
                                  <p className="text-xs text-muted-foreground">Home → Work</p>
                                </div>
                                <Input
                                  type="time"
                                  value={newInboundTime}
                                  onChange={(e) => setNewInboundTime(e.target.value)}
                                  className="w-28 h-10 bg-input border-border rounded-lg text-center"
                                />
                              </div>
                            )}
                            {canOutbound && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">Outbound</p>
                                  <p className="text-xs text-muted-foreground">Work → Home</p>
                                </div>
                                <Input
                                  type="time"
                                  value={newOutboundTime}
                                  onChange={(e) => setNewOutboundTime(e.target.value)}
                                  className="w-28 h-10 bg-input border-border rounded-lg text-center"
                                />
                              </div>
                            )}
                            <Button
                              onClick={handleAddAvailability}
                              disabled={saving}
                              className="w-full h-12 gradient-accent text-accent-foreground font-display font-semibold rounded-xl"
                            >
                              {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                'Submit for Approval'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-secondary/50 border-border rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Your schedule requests will be reviewed by dispatch. 
                Once approved, trips will be automatically assigned based on your availability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
