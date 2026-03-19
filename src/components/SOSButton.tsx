import { useState, useRef, useCallback } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
} from '@/components/ui/alert-dialog';

interface SOSButtonProps {
  tripId?: string;
}

export function SOSButton({ tripId }: SOSButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const LONG_PRESS_DURATION = 2000; // 2 seconds

  const startLongPress = useCallback(() => {
    setIsPressed(true);
    setProgress(0);
    
    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setProgress(newProgress);
    }, 50);

    longPressTimer.current = setTimeout(() => {
      setShowConfirm(true);
      cancelLongPress();
    }, LONG_PRESS_DURATION);
  }, []);

  const cancelLongPress = useCallback(() => {
    setIsPressed(false);
    setProgress(0);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const sendSOS = async () => {
    if (!user) return;

    setSending(true);
    
    try {
      // Try to get current location
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (locError) {
        console.warn('Could not get location for SOS:', locError);
      }

      // Log SOS event
      const { error } = await supabase.from('status_logs').insert({
        log_type: 'sos_alert',
        user_id: user.id,
        trip_id: tripId || null,
        message: 'Emergency SOS alert triggered by passenger',
        latitude,
        longitude,
        metadata: {
          timestamp: new Date().toISOString(),
          platform: 'passenger_app',
        },
      });

      if (error) throw error;

      setSent(true);
      setShowConfirm(false);
      
      toast({
        title: 'Help request sent',
        description: 'Stay where you are if safe. Our team has been notified.',
      });

      // Reset after 30 seconds
      setTimeout(() => {
        setSent(false);
      }, 30000);
    } catch (err) {
      console.error('Error sending SOS:', err);
      toast({
        title: 'Error',
        description: 'Failed to send SOS. Please try again or call emergency services directly.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-2">
        <div className="bg-success text-success-foreground rounded-full p-4 shadow-lg animate-pulse">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <span className="text-xs text-success font-medium">Help is on the way</span>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-24 right-4 z-50">
        <button
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchCancel={cancelLongPress}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          className="relative group"
          aria-label="Emergency SOS - Hold for 2 seconds"
        >
          <div 
            className={`
              relative overflow-hidden rounded-full p-4 shadow-lg transition-all duration-200
              ${isPressed ? 'scale-110 bg-destructive' : 'bg-destructive/80 hover:bg-destructive'}
            `}
          >
            {/* Progress ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-destructive-foreground/30"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${progress * 2.83} 283`}
                className="text-destructive-foreground transition-all duration-100"
              />
            </svg>
            <AlertTriangle className="h-6 w-6 text-destructive-foreground relative z-10" />
          </div>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Hold for SOS
          </span>
        </button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Are you in danger?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send an emergency alert to our operations team with your current location. 
              They will contact you immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={sendSOS}
              disabled={sending}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Yes, send help request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
