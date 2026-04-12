import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar, Clock, Home, Building2, Check, X, Loader2, Plus, Trash2,
  CalendarClock, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  format, startOfWeek, addDays, isBefore, startOfDay, nextMonday,
} from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

const WORK_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri

type DaySelection = 'none' | 'inbound' | 'outbound' | 'both';

interface AvailabilityRequest {
  id: string;
  day_of_week: number;
  inbound_time: string | null;
  outbound_time: string | null;
  status: string;
  effective_from: string;
  week_start: string | null;
}

// ─── Sunday Schedule Update ────────────────────────────────────────────────
function SundayScheduleUpdate({ onDone }: { onDone: () => void }) {
  const { passenger } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const rideType = (passenger?.ride_type || 'dual') as 'inbound' | 'outbound' | 'dual';
  const canInbound = rideType === 'inbound' || rideType === 'dual';
  const canOutbound = rideType === 'outbound' || rideType === 'dual';

  const defaultSelection = (): DaySelection => {
    if (rideType === 'inbound') return 'inbound';
    if (rideType === 'outbound') return 'outbound';
    return 'both';
  };

  const [selections, setSelections] = useState<Record<number, DaySelection>>(
    () => Object.fromEntries(WORK_DAYS.map(d => [d, defaultSelection()])),
  );
  const [inboundTime, setInboundTime] = useState('07:30');
  const [outboundTime, setOutboundTime] = useState('17:00');

  // Next week Mon–Fri dates
  const nextMon = nextMonday(new Date());
  const weekDays = WORK_DAYS.map(d => ({ value: d, date: addDays(nextMon, d - 1) }));
  const weekStart = format(nextMon, 'yyyy-MM-dd');
  const weekLabel = `${format(nextMon, 'dd MMM')} – ${format(addDays(nextMon, 4), 'dd MMM yyyy')}`;

  const cycleSelection = (day: number) => {
    setSelections(prev => {
      const cur = prev[day];
      const order: DaySelection[] = ['none', 'inbound', 'outbound', 'both'];
      const filtered: DaySelection[] = order.filter(s => {
        if (s === 'none') return true;
        if (s === 'inbound' || s === 'both') return canInbound;
        if (s === 'outbound') return canOutbound;
        return true;
      });
      const idx = filtered.indexOf(cur);
      return { ...prev, [day]: filtered[(idx + 1) % filtered.length] };
    });
  };

  const selectionLabel = (s: DaySelection) => {
    if (s === 'none') return 'Off';
    if (s === 'inbound') return 'In';
    if (s === 'outbound') return 'Out';
    return 'Both';
  };

  const selectionColor = (s: DaySelection) => {
    if (s === 'none') return 'bg-secondary text-muted-foreground border-border';
    if (s === 'inbound') return 'bg-accent/20 text-accent border-accent/40';
    if (s === 'outbound') return 'bg-primary/20 text-primary border-primary/40';
    return 'bg-success/20 text-success border-success/40';
  };

  const activeDaysCount = WORK_DAYS.filter(d => selections[d] !== 'none').length;

  const handleSubmit = async () => {
    if (!passenger) return;
    setSaving(true);
    try {
      // Delete any existing pending submissions for this week
      await supabase
        .from('availability_requests')
        .delete()
        .eq('passenger_id', passenger.id)
        .eq('week_start', weekStart)
        .eq('status', 'pending');

      // Insert new selections for active days
      const inserts = WORK_DAYS.filter(d => selections[d] !== 'none').map(d => ({
        passenger_id: passenger.id,
        day_of_week: d,
        inbound_time: (selections[d] === 'inbound' || selections[d] === 'both') ? inboundTime : null,
        outbound_time: (selections[d] === 'outbound' || selections[d] === 'both') ? outboundTime : null,
        status: 'pending',
        week_start: weekStart,
        effective_from: format(addDays(nextMon, d - 1), 'yyyy-MM-dd'),
      }));

      if (inserts.length > 0) {
        const { error } = await supabase.from('availability_requests').insert(inserts);
        if (error) throw error;
      }

      // Mark as submitted in localStorage so gate doesn't re-trigger today
      localStorage.setItem('ss_schedule_week', weekStart);

      toast({ title: 'Schedule submitted', description: 'Dispatch will review and assign your trips for the week.' });
      onDone();
    } catch (err: any) {
      toast({ title: 'Failed to submit', description: err.message ?? 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="safe-top px-5 pt-8 pb-5 bg-card border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Weekly Schedule</h1>
            <p className="text-xs text-muted-foreground">Update for {weekLabel}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Select which days you need transport next week. Dispatch will review and assign your trips.
        </p>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4 pb-32">
        {/* Day selectors */}
        <Card className="bg-card border-border rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {weekDays.map(({ value: day, date }, i) => {
              const sel = selections[day];
              return (
                <button
                  key={day}
                  onClick={() => cycleSelection(day)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-4 transition-colors active:scale-[0.99]',
                    i > 0 && 'border-t border-border',
                    sel !== 'none' ? 'bg-card' : 'bg-secondary/30',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex flex-col items-center justify-center border',
                      selectionColor(sel),
                    )}>
                      <span className="text-xs font-bold uppercase leading-none">
                        {DAYS_OF_WEEK[day].label}
                      </span>
                      <span className="text-[10px] mt-0.5 opacity-75">{format(date, 'd')}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{DAYS_OF_WEEK[day].fullLabel}</p>
                      <p className="text-xs text-muted-foreground">{format(date, 'MMM d')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sel !== 'none' && (
                      <div className="text-right text-xs text-muted-foreground">
                        {(sel === 'inbound' || sel === 'both') && <p className="flex items-center gap-1"><Home className="w-3 h-3" />{inboundTime}</p>}
                        {(sel === 'outbound' || sel === 'both') && <p className="flex items-center gap-1"><Building2 className="w-3 h-3" />{outboundTime}</p>}
                      </div>
                    )}
                    <span className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-full border',
                      selectionColor(sel),
                    )}>
                      {selectionLabel(sel)}
                    </span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">Tap a day to cycle: Off → Inbound → Outbound → Both</p>

        {/* Time preferences */}
        {activeDaysCount > 0 && (
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display">Preferred Times</CardTitle>
              <CardDescription className="text-xs">Dispatch will schedule as close to these as possible</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {canInbound && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Inbound pickup time</p>
                    <p className="text-xs text-muted-foreground">Home → Work/School</p>
                  </div>
                  <Input
                    type="time"
                    value={inboundTime}
                    onChange={e => setInboundTime(e.target.value)}
                    className="w-28 h-10 bg-input border-border rounded-lg text-center"
                  />
                </div>
              )}
              {canOutbound && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Outbound pickup time</p>
                    <p className="text-xs text-muted-foreground">Work/School → Home</p>
                  </div>
                  <Input
                    type="time"
                    value={outboundTime}
                    onChange={e => setOutboundTime(e.target.value)}
                    className="w-28 h-10 bg-input border-border rounded-lg text-center"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeDaysCount === 0 && (
          <Card className="bg-warning/10 border-warning/30 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-warning font-medium">No days selected</p>
              <p className="text-xs text-muted-foreground mt-1">Tap the days above to add transport days for next week</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <Button
          onClick={handleSubmit}
          disabled={saving || activeDaysCount === 0}
          className="w-full h-14 gradient-accent text-accent-foreground font-display font-bold text-base rounded-2xl"
        >
          {saving
            ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
            : <ArrowRight className="w-5 h-5 mr-2" />}
          {saving ? 'Submitting...' : `Submit ${activeDaysCount} Day${activeDaysCount !== 1 ? 's' : ''} to Dispatch`}
        </Button>
      </div>
    </div>
  );
}

// ─── Regular Schedule View ─────────────────────────────────────────────────
export default function Schedule() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { passenger } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityRequest[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newInboundTime, setNewInboundTime] = useState('07:30');
  const [newOutboundTime, setNewOutboundTime] = useState('17:00');

  const sundayMode = searchParams.get('mode') === 'sunday';

  const rideType = (passenger?.ride_type || 'dual') as 'inbound' | 'outbound' | 'dual';
  const canInbound = rideType === 'inbound' || rideType === 'dual';
  const canOutbound = rideType === 'outbound' || rideType === 'dual';

  useEffect(() => {
    if (passenger?.id && !sundayMode) {
      fetchAvailability();
    } else {
      setLoading(false);
    }
  }, [passenger?.id, sundayMode]);

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
    } catch {
      toast({ title: 'Error', description: 'Failed to load your schedule. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDay = (day: number) => availability.find(a => a.day_of_week === day);

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
      toast({ title: 'Schedule Submitted', description: 'Your availability has been sent for dispatch approval.' });
      setSelectedDay(null);
      fetchAvailability();
    } catch {
      toast({ title: 'Error', description: 'Failed to submit schedule. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase.from('availability_requests').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Removed', description: 'Availability request removed.' });
      fetchAvailability();
    } catch {
      toast({ title: 'Error', description: 'Cannot remove approved schedules.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-xs font-medium text-green-400"><Check className="w-3 h-3" />Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs font-medium text-destructive"><X className="w-3 h-3" />Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-medium text-warning"><Clock className="w-3 h-3" />Pending</span>;
    }
  };

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);

  // ── Sunday mode: show the take-over UI ─────────────────────────────
  if (sundayMode) {
    return (
      <SundayScheduleUpdate
        onDone={() => navigate('/', { replace: true })}
      />
    );
  }

  // ── Regular schedule view ───────────────────────────────────────────
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="safe-top px-5 pt-6 pb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">My Schedule</h1>
          <p className="text-muted-foreground text-sm">Manage your shuttle availability</p>
        </div>

        <div className="px-5 space-y-4 pb-32">
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
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 bg-secondary rounded-xl" />)}
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
                            isSelected && 'ring-2 ring-accent bg-accent/10',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center font-display font-semibold',
                              existing?.status === 'approved' ? 'bg-green-500/20 text-green-400'
                                : existing?.status === 'pending' ? 'bg-warning/20 text-warning'
                                : 'bg-muted text-foreground',
                            )}>
                              {day.label}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{day.fullLabel}</p>
                              <p className="text-xs text-muted-foreground">{format(dayDate, 'MMM d')}</p>
                            </div>
                          </div>

                          {existing ? (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                {existing.inbound_time && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Home className="w-3 h-3" />{existing.inbound_time}</p>
                                )}
                                {existing.outbound_time && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{existing.outbound_time}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {getStatusBadge(existing.status)}
                                {existing.status === 'pending' && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleDeleteAvailability(existing.id); }}
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
                                  onChange={e => setNewInboundTime(e.target.value)}
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
                                  onChange={e => setNewOutboundTime(e.target.value)}
                                  className="w-28 h-10 bg-input border-border rounded-lg text-center"
                                />
                              </div>
                            )}
                            <Button
                              onClick={handleAddAvailability}
                              disabled={saving}
                              className="w-full h-12 gradient-accent text-accent-foreground font-display font-semibold rounded-xl"
                            >
                              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit for Approval'}
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
