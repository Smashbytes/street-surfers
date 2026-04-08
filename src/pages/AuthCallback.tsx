import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/logo.webp';

/**
 * Universal Auth Callback Handler
 *
 * This page handles the Supabase Auth callback for ALL roles:
 * - Drivers → redirect to Drive app's /auth/callback
 * - Passengers → proceed with password setup
 * - Admins → show error (admin accounts don't use invite flow)
 *
 * The Supabase site_url is set to this page, so all magic links land here first.
 */

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'driver' | 'passenger' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase JS SDK automatically exchanges the hash token into a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setStatus('error');
          setMessage('This link is invalid or has expired. Please request a new invite.');
          return;
        }

        // Check the user's role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Role lookup error:', roleError);
          setStatus('error');
          setMessage('Unable to determine your account type. Please contact support.');
          return;
        }

        const userRole = roleData?.role;

        if (userRole === 'driver') {
          // This is a driver — redirect to the Drive app's callback handler
          setStatus('driver');
          setMessage('Redirecting to Driver App...');

          // Construct the redirect URL with the session token in the hash
          const driverAppUrl = import.meta.env.VITE_DRIVER_APP_URL || 'http://localhost:5174';
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();

          if (refreshedSession?.access_token) {
            // Redirect to Driver app's callback with the token in the hash
            window.location.href = `${driverAppUrl}/auth/callback#access_token=${refreshedSession.access_token}&refresh_token=${refreshedSession.refresh_token}&expires_in=3600&token_type=Bearer`;
          } else {
            setStatus('error');
            setMessage('Failed to obtain session token. Please request a new invite.');
          }
        } else if (userRole === 'passenger') {
          // This is a passenger — redirect to the password setup flow
          setStatus('passenger');
          setMessage('Setting up your account...');
          setTimeout(() => {
            navigate('/auth/set-password', { replace: true, state: { fromCallback: true } });
          }, 500);
        } else {
          setStatus('error');
          setMessage(`Account type "${userRole}" is not supported via this link. Please contact your administrator.`);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again or contact support.');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-start p-4 pt-12">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mb-4">
          <img src={logo} alt="Street Surfers" className="h-20 w-auto" />
        </div>

        {/* Card */}
        <div className="w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-2xl shadow-primary/5">
          {status === 'checking' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Processing your invite…</p>
            </div>
          )}

          {status === 'driver' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'passenger' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{message}</p>
              </div>
              <button
                onClick={() => window.location.href = '/auth'}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            Having trouble? Contact your dispatcher.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
