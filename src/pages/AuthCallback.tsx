import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import logo from '@/assets/logo.webp';

/**
 * Universal Auth Callback Handler
 *
 * This page handles the Supabase Auth callback for ALL roles:
 * - Drivers → redirect to Drive app's /auth/callback with session token
 * - Passengers → proceed with password setup
 *
 * The invite email link goes through Supabase's verify endpoint, which then
 * redirects here with tokens in the URL hash.  The Supabase JS SDK processes
 * the hash asynchronously via onAuthStateChange — we MUST wait for that event
 * rather than calling getSession() immediately (which returns null on a fresh
 * page load before the hash has been processed).
 */

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'driver' | 'passenger' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let handled = false;

    const routeByRole = async (session: Session) => {
      if (handled) return;
      handled = true;

      try {
        // Check the user's role from user_roles table.
        const { data: rolesData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (roleError) {
          console.error('Role lookup error:', roleError);
          setStatus('error');
          setMessage('Unable to determine your account type. Please contact support.');
          return;
        }

        const roles = (rolesData ?? []).map((r: { role: string }) => r.role);
        // Also check user_metadata as fallback (set during inviteUserByEmail)
        const metaRole = session.user.user_metadata?.role as string | undefined;

        // Prioritise driver — if the user has a driver role OR was invited as
        // a driver, route them to the Drive app regardless of other roles.
        const userRole = roles.includes('driver') || metaRole === 'driver'
          ? 'driver'
          : roles.includes('passenger')
          ? 'passenger'
          : roles[0] ?? metaRole ?? null;

        if (userRole === 'driver') {
          setStatus('driver');
          setMessage('Redirecting to Driver App…');

          const driverAppUrl = import.meta.env.VITE_DRIVER_APP_URL || 'http://localhost:5174';

          // Pass the current session tokens to the Drive app via hash fragment
          window.location.href = `${driverAppUrl}/auth/callback#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=${session.expires_in}&token_type=bearer`;
        } else if (userRole === 'passenger') {
          setStatus('passenger');
          setMessage('Setting up your account…');
          setTimeout(() => {
            navigate('/auth/set-password', { replace: true, state: { fromCallback: true } });
          }, 500);
        } else {
          setStatus('error');
          setMessage(
            userRole
              ? `Account type "${userRole}" is not supported via this link.`
              : 'No role found for your account. Please contact your administrator.'
          );
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again or contact support.');
      }
    };

    // Listen for the auth state change that fires once the SDK processes the
    // URL hash (access_token / refresh_token / code).  This is the ONLY
    // reliable way to get the session from a redirect — getSession() returns
    // null until the hash has been consumed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (handled) return;

        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          routeByRole(session);
        }
      }
    );

    // Safety net: if the SDK already has a session (e.g. page reloaded while
    // still authenticated), grab it directly after a short delay to give the
    // auth state listener time to fire first.
    const fallbackTimer = setTimeout(async () => {
      if (handled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        routeByRole(session);
      } else if (!handled) {
        // No session after waiting — link is truly invalid/expired
        setStatus('error');
        setMessage('This link is invalid or has expired. Please request a new invite.');
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
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
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'passenger' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
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
