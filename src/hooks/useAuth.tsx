import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Passenger {
  id: string;
  user_id: string;
  employee_id: string | null;
  department: string | null;
  home_address: string | null;
  work_address: string | null;
  pickup_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
  payment_status: string;
  account_status: string;
  ride_type: string;
  onboarding_completed: boolean;
  home_lat: number | null;
  home_lng: number | null;
  work_lat: number | null;
  work_lng: number | null;
  company: string | null;
  company_id: string | null;
  branch_id: string | null;
  shift_type: string | null;
  home_house_number: string | null;
  home_street: string | null;
  home_suburb: string | null;
  home_city: string | null;
  home_province: string | null;
  address_confidence: string | null;
  // Scholar fields
  passenger_type: string;
  is_minor: boolean;
  school_company_id: string | null;
  school_address: string | null;
  school_lat: number | null;
  school_lng: number | null;
  school_street: string | null;
  school_suburb: string | null;
  school_city: string | null;
  school_province: string | null;
}

interface ScholarProfile {
  id: string;
  passenger_id: string;
  school_name: string | null;
  grade_year: string | null;
  guardian_full_name: string;
  guardian_phone: string;
  guardian_email: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  passenger: Passenger | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, extraData?: {
    phone?: string;
    shift_type?: string;
    company_id?: string;
  }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isPassenger: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, userEmail?: string, userMeta?: Record<string, string>) => {
    try {
      // Fetch profile — create one if the trigger failed
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileData) {
        const { data: createdProfile, error: profileUpsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: userId,
              email: userEmail ?? null,
              full_name: userMeta?.full_name ?? null,
              phone: userMeta?.phone ?? null,
            },
            { onConflict: 'user_id', ignoreDuplicates: true }
          )
          .select()
          .maybeSingle();
        if (profileUpsertError) console.error('Profile fallback upsert failed:', profileUpsertError);
        profileData = createdProfile;
      }

      setProfile(profileData);

      // Fetch passenger record — create one if the trigger failed
      let { data: passengerData } = await supabase
        .from('passengers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!passengerData) {
        const { data: created, error: passengerUpsertError } = await supabase
          .from('passengers')
          .upsert(
            { user_id: userId, onboarding_completed: false, is_active: true, account_status: 'active', ride_type: 'dual' },
            { onConflict: 'user_id', ignoreDuplicates: true }
          )
          .select()
          .maybeSingle();
        if (passengerUpsertError) console.error('Passenger fallback upsert failed:', passengerUpsertError);
        passengerData = created;

        // Also ensure user_roles row exists (trigger may have failed before reaching it)
        const { error: roleUpsertError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'passenger' }, { onConflict: 'user_id,role', ignoreDuplicates: true });
        if (roleUpsertError) console.error('user_roles fallback upsert failed:', roleUpsertError);
      }

      setPassenger(passengerData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Set loading=true immediately so ProtectedRoute shows a spinner instead
          // of seeing loading=false + passenger=null and bouncing to /auth.
          setLoading(true);
          setTimeout(async () => {
            if (!mounted) return;
            const timeout = setTimeout(() => { if (mounted) setLoading(false); }, 8000);
            await fetchUserData(
              session.user.id,
              session.user.email,
              session.user.user_metadata as Record<string, string>
            );
            clearTimeout(timeout);
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setPassenger(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(
          session.user.id,
          session.user.email,
          session.user.user_metadata as Record<string, string>
        ).finally(() => { if (mounted) setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, extraData?: {
    phone?: string;
    shift_type?: string;
    company_id?: string;
  }) => {
    const redirectUrl = `${window.location.origin}/`;

    const signUpPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: extraData?.phone,
          shift_type: extraData?.shift_type,
          company_id: extraData?.company_id,
        },
      },
    });

    // fetch() has no default timeout. If GoTrue blocks on a cold-start trigger,
    // signUp hangs indefinitely. Race against a 15s timeout so the user gets
    // feedback instead of a forever-spinning button.
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timed out. Your account may have been created — please try signing in.')),
        15000
      )
    );

    try {
      const { error } = await Promise.race([signUpPromise, timeoutPromise]);
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unknown error during signup') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPassenger(null);
  };

  const value = {
    user,
    session,
    profile,
    passenger,
    loading,
    signIn,
    signUp,
    signOut,
    isPassenger: !!passenger,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
