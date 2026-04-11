import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, Shield, MapPin, Mail } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.webp';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().regex(/^[\d\s\-+()]*$/, 'Please enter a valid phone number').optional();

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, passenger, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupShiftType, setSignupShiftType] = useState('day');

  const noPassengerRecord = location.state?.noPassengerRecord;

  // Redirect if already logged in as passenger
  if (!loading && user && passenger) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    
    const { error: signInError } = await signIn(loginEmail, loginPassword);
    
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
      if (!signupFullName.trim()) throw new Error('Please enter your full name');
      if (signupPassword !== signupConfirmPassword) throw new Error('Passwords do not match');
      if (signupPhone) phoneSchema.parse(signupPhone);
      if (!consentAccepted) throw new Error('Please accept the Privacy Policy to continue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation error');
      return;
    }

    setIsLoading(true);
    
    const { error: signUpError } = await signUp(signupEmail, signupPassword, signupFullName, {
      phone: signupPhone,
      shift_type: signupShiftType,
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes('timeout') || msg.includes('cannot process') || msg.includes('network')) {
        setError('Something went wrong — please try again.');
      } else {
        setError(signUpError.message);
      }
      setIsLoading(false);
    } else {
      // Success — show the email confirmation screen.
      setIsLoading(false);
      setSignupEmailSent(true);
    }
  };

  if (signupEmailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="mb-6">
          <img src={logo} alt="Street Surfers" className="h-20 w-auto mx-auto" />
        </div>
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mx-auto">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We've sent a confirmation link to <span className="text-foreground font-medium">{signupEmail}</span>.
            Click the link to activate your account and get started.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder or{' '}
            <button
              className="text-accent underline underline-offset-2"
              onClick={() => { setSignupEmailSent(false); setError(null); }}
            >
              try again
            </button>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="px-6 pt-12 pb-6 text-center">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src={logo} 
            alt="Street Surfers - South Side Shuttles" 
            className="h-24 w-auto mx-auto"
          />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">
          Welcome Back
        </h1>
        <p className="text-muted-foreground">Sign in to track your rides</p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-sm text-foreground">Live Tracking</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm text-foreground">Safe Rides</span>
          </div>
        </div>
      </div>

      {/* Auth Card */}
      <div className="flex-1 px-5 pb-8">
        {noPassengerRecord && (
          <Alert variant="destructive" className="mb-4 rounded-xl border-accent/50 bg-accent/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              No passenger record found. Please contact your administrator.
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border-border rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 m-4 mb-0 bg-secondary rounded-xl" style={{ width: 'calc(100% - 32px)' }}>
                <TabsTrigger 
                  value="login" 
                  className="rounded-lg text-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-lg text-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mx-4 mt-4 rounded-xl border-accent/50 bg-accent/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-foreground">{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <TabsContent value="login" className="p-5 pt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-foreground">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-foreground">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 rounded-xl bg-secondary border-border text-foreground focus:border-accent focus:ring-accent"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl gradient-accent hover:opacity-90 text-accent-foreground font-semibold text-base glow-accent"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup" className="p-5 pt-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Personal Info Section */}
                  <div className="space-y-4">
                    <p className="text-xs text-accent uppercase tracking-wider font-semibold">Personal Information</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-foreground">
                        Full Name <span className="text-accent">*</span>
                      </Label>
                      <Input
                        id="signup-name"
                        placeholder="John Doe"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        disabled={isLoading}
                        className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-foreground">
                        Email <span className="text-accent">*</span>
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@company.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="text-foreground">Phone Number</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+27 82 123 4567"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        disabled={isLoading}
                        className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                      />
                    </div>
                  </div>

                  {/* Work Info Section */}
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-accent uppercase tracking-wider font-semibold">Work Information</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-shift" className="text-foreground">
                        Shift Type <span className="text-accent">*</span>
                      </Label>
                      <Select value={signupShiftType} onValueChange={setSignupShiftType} disabled={isLoading}>
                        <SelectTrigger className="h-12 rounded-xl bg-secondary border-border text-foreground">
                          <SelectValue placeholder="Select your shift type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day Shift</SelectItem>
                          <SelectItem value="night">Night Shift</SelectItem>
                          <SelectItem value="rotational">Rotational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  {/* Security Section */}
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-accent uppercase tracking-wider font-semibold">Security</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-foreground">
                        Password <span className="text-accent">*</span>
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-foreground">
                        Confirm Password <span className="text-accent">*</span>
                      </Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent"
                      />
                    </div>
                  </div>

                  {/* POPIA Consent — required, not pre-ticked */}
                  <div className="flex items-start gap-3 pt-2">
                    <input
                      id="consent"
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      disabled={isLoading}
                      className="mt-1 h-4 w-4 rounded border-border accent-accent cursor-pointer flex-shrink-0"
                    />
                    <Label htmlFor="consent" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                      I have read and agree to the{' '}
                      <Link to="/privacy-policy" className="text-accent underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </Link>{' '}
                      and consent to the collection and processing of my personal information for transport scheduling purposes.{' '}
                      <span className="text-accent">*</span>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl gradient-accent hover:opacity-90 text-accent-foreground font-semibold text-base mt-2 glow-accent"
                    disabled={isLoading || !consentAccepted}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/privacy-policy" className="text-accent underline underline-offset-2">
            Privacy Policy
          </Link>
          {' '}— Street Surfers / South Side Shuttles
        </p>
      </div>
    </div>
  );
}