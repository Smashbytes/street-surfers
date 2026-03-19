import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, ArrowLeft, Loader2, Check, Home, Building2, ArrowRight, CalendarDays, GraduationCap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.webp';
import { format, addDays, startOfWeek, endOfWeek, isAfter, isBefore, parseISO } from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

// Scholar-only weekdays (Mon-Fri only)
const SCHOLAR_ALLOWED_DAYS = [1, 2, 3, 4, 5];

interface DaySchedule {
  enabled: boolean;
  inboundTime: string;
  outboundTime: string;
}

interface ScheduleData {
  dayOfWeek: number;
  inboundTime: string | null;
  outboundTime: string | null;
  weekStart: string;
}

interface ScheduleStepProps {
  rideType: 'inbound' | 'outbound' | 'dual';
  onSubmit: (schedules: ScheduleData[]) => Promise<void>;
  onBack: () => void;
  isNextWeek?: boolean;
  isScholar?: boolean;
}

export function ScheduleStep({ rideType, onSubmit, onBack, isNextWeek = false, isScholar = false }: ScheduleStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate the week start date
  const today = new Date();
  const weekStartDate = isNextWeek 
    ? startOfWeek(addDays(today, 7), { weekStartsOn: 1 }) // Next Monday
    : startOfWeek(today, { weekStartsOn: 1 }); // This Monday
  
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  
  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>(() => {
    const initial: Record<number, DaySchedule> = {};
    // Default to weekdays enabled (Mon-Fri)
    for (let i = 0; i < 7; i++) {
      initial[i] = {
        enabled: i >= 1 && i <= 5, // Mon-Fri enabled
        inboundTime: isScholar ? '06:45' : '07:30',
        outboundTime: isScholar ? '14:30' : '17:00',
      };
    }
    return initial;
  });

  const canInbound = rideType === 'inbound' || rideType === 'dual';
  const canOutbound = rideType === 'outbound' || rideType === 'dual';

  const toggleDay = (dayValue: number) => {
    // Scholars can only toggle weekdays
    if (isScholar && !SCHOLAR_ALLOWED_DAYS.includes(dayValue)) {
      return;
    }
    
    setSchedules((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        enabled: !prev[dayValue].enabled,
      },
    }));
  };

  const updateTime = (dayValue: number, type: 'inboundTime' | 'outboundTime', time: string) => {
    setSchedules((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [type]: time,
      },
    }));
  };

  const handleSubmit = async () => {
    const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
    const scheduleData: ScheduleData[] = [];
    
    Object.entries(schedules).forEach(([dayStr, schedule]) => {
      if (schedule.enabled) {
        scheduleData.push({
          dayOfWeek: parseInt(dayStr),
          inboundTime: canInbound ? schedule.inboundTime : null,
          outboundTime: canOutbound ? schedule.outboundTime : null,
          weekStart: weekStartStr,
        });
      }
    });

    if (scheduleData.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(scheduleData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledDaysCount = Object.values(schedules).filter((s) => s.enabled).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top px-6 pt-8 pb-4 text-center">
        <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          {isNextWeek ? 'Schedule Next Week' : 'Set Your Schedule'}
        </h1>
        <p className="text-muted-foreground">
          {isNextWeek 
            ? 'Submit your schedule for the upcoming week' 
            : 'Tell us when you need shuttle service'
          }
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Week Info Card */}
        <Card className="bg-card border-border rounded-2xl mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduling for week</p>
                <p className="font-display font-semibold text-foreground">
                  {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ride Type Info */}
        <Card className="bg-card border-border rounded-2xl mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your ride type</p>
                <p className="font-display font-semibold text-foreground capitalize">
                  {rideType === 'dual' ? 'Inbound & Outbound' : rideType}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scholar Weekday-Only Notice */}
        {isScholar && (
          <Card className="bg-warning/10 border-warning/30 rounded-2xl mb-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Scholar Transport Rules</p>
                  <p className="text-xs text-muted-foreground">
                    Scholar transport is only available on weekdays (Monday to Friday).
                    Weekend scheduling is disabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day Selection */}
        <Card className="bg-card border-border rounded-2xl mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Select Days</CardTitle>
            <CardDescription>
              {isScholar ? 'Weekdays only (Mon-Fri)' : 'Tap to toggle each day'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-between">
              {DAYS_OF_WEEK.map((day) => {
                const isDisabled = isScholar && !SCHOLAR_ALLOWED_DAYS.includes(day.value);
                return (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    disabled={isDisabled}
                    className={cn(
                      'w-10 h-10 rounded-xl text-sm font-medium transition-all',
                      isDisabled
                        ? 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                        : schedules[day.value].enabled
                          ? 'gradient-accent text-accent-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Settings */}
        <Card className="bg-card border-border rounded-2xl mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Set Times</CardTitle>
            <CardDescription>Default times for enabled days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canInbound && (
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {isScholar ? 'Inbound (Home → School)' : 'Inbound (Home → Work)'}
                  </p>
                  <p className="text-xs text-muted-foreground">Pickup time from home</p>
                </div>
                <Input
                  type="time"
                  value={schedules[1].inboundTime}
                  onChange={(e) => {
                    const time = e.target.value;
                    Object.keys(schedules).forEach((day) => {
                      updateTime(parseInt(day), 'inboundTime', time);
                    });
                  }}
                  className="w-28 h-10 bg-input border-border rounded-lg text-center text-foreground"
                />
              </div>
            )}

            {canOutbound && (
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  {isScholar ? <GraduationCap className="w-5 h-5 text-accent" /> : <Building2 className="w-5 h-5 text-accent" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {isScholar ? 'Outbound (School → Home)' : 'Outbound (Work → Home)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isScholar ? 'Pickup time from school' : 'Pickup time from work'}
                  </p>
                </div>
                <Input
                  type="time"
                  value={schedules[1].outboundTime}
                  onChange={(e) => {
                    const time = e.target.value;
                    Object.keys(schedules).forEach((day) => {
                      updateTime(parseInt(day), 'outboundTime', time);
                    });
                  }}
                  className="w-28 h-10 bg-input border-border rounded-lg text-center text-foreground"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-secondary/50 border-accent/30 rounded-2xl mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {enabledDaysCount} {enabledDaysCount === 1 ? 'day' : 'days'} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Your schedule will be submitted for dispatch approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rolling Schedule Info */}
        <Card className="bg-accent/5 border-accent/20 rounded-2xl mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Your schedule is submitted weekly. 
              After your last trip of the week, you can submit your schedule for the next week. 
              Schedules remain editable until dispatch confirms your assignment.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-14 border-border text-foreground rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={enabledDaysCount === 0 || isSubmitting}
            className="flex-1 h-14 gradient-accent text-accent-foreground font-display font-semibold rounded-xl glow-accent disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Submit Schedule
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
