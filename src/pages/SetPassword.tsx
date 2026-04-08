import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import logo from '@/assets/logo.webp';

const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const SetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [success, setSuccess] = useState(false);

  // On mount: Supabase JS SDK automatically exchanges the #access_token hash
  // from the invite email URL into a valid session.
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Give the SDK a moment to process the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError('This link is invalid or has expired. Please contact your dispatcher for a new invite.');
          setSessionReady(false);
        } else if (!session) {
          setError('This link has already been used or has expired. Please contact your dispatcher for a new invite.');
          setSessionReady(false);
        } else {
          setSessionReady(true);
        }
      } catch {
        setError('Something went wrong. Please try again or contact your dispatcher.');
        setSessionReady(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = setPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const errors: { password?: string; confirmPassword?: string } = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as 'password' | 'confirmPassword';
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message || 'Failed to set password. Please try again.');
        return;
      }

      setSuccess(true);
      toast({ title: 'Password set! Welcome to Street Surfers.', duration: 3000 });

      // Check if passenger has completed onboarding; if not, send them there
      const { data: passengerRow } = await supabase
        .from('passengers')
        .select('onboarding_completed')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .maybeSingle();

      const destination = passengerRow?.onboarding_completed ? '/' : '/onboarding';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1500);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading state while checking session ────────────────────────────
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Verifying your invite link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 pt-12">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mb-4">
          <img
            src={logo}
            alt="Street Surfers - South Side Shuttles"
            className="h-20 w-auto"
          />
        </div>

        {/* Badge */}
        <div className="mb-6">
          <span className="px-4 py-1.5 bg-accent/20 text-accent font-semibold text-sm uppercase tracking-widest rounded-full border border-accent/30">
            Passenger App
          </span>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground italic mb-2">
            Welcome to Street Surfers
          </h1>
          <p className="text-muted-foreground text-sm">
            {sessionReady
              ? 'Set your password to get started'
              : 'There was a problem with your invite link'}
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-2xl shadow-accent/5">

          {/* ── Invalid / expired link ── */}
          {!sessionReady && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <a
                href="/auth"
                className="flex items-center justify-center w-full h-12 rounded-full border border-border text-foreground font-medium hover:bg-secondary/60 transition-colors"
              >
                Back to Sign In
              </a>
            </div>
          )}

          {/* ── Success state ── */}
          {sessionReady && success && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <p className="text-lg font-bold text-success">Password set!</p>
              <p className="text-sm text-muted-foreground">Taking you into the app…</p>
            </div>
          )}

          {/* ── Set password form ── */}
          {sessionReady && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* General error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/50 rounded-xl"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 pl-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/50 rounded-xl"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold rounded-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting password…
                  </>
                ) : (
                  'Set Password & Enter App'
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            Having trouble? Contact your dispatcher.
          </p>
          {sessionReady && (
            <a href="/auth" className="text-xs text-accent/70 hover:text-accent mt-1 inline-block transition-colors">
              Already have a password? Sign in
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
