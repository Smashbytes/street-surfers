import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, LogOut, Shield, Briefcase, Lock, GraduationCap, AlertCircle, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.webp';

export default function Profile() {
  const { profile, passenger, signOut, user } = useAuth();
  const navigate = useNavigate();
  
  // Editable fields state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  
  const [phoneValue, setPhoneValue] = useState(profile?.phone || '');
  const [emailValue, setEmailValue] = useState(profile?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSavePhone = async () => {
    if (!phoneValue.trim()) {
      toast.error('Phone number cannot be empty');
      return;
    }
    
    setIsSavingPhone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phoneValue.trim() })
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      toast.success('Phone number updated');
      setIsEditingPhone(false);
    } catch (err) {
      console.error('Failed to update phone:', err);
      toast.error('Failed to update phone number');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailValue.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    
    setIsSavingEmail(true);
    try {
      // Update auth email (this will send a confirmation email)
      const { error: authError } = await supabase.auth.updateUser({
        email: emailValue.trim()
      });
      
      if (authError) throw authError;
      
      // Also update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: emailValue.trim() })
        .eq('user_id', user?.id);
      
      if (profileError) throw profileError;
      
      toast.success('Email updated. Please check your inbox for confirmation.');
      setIsEditingEmail(false);
    } catch (err: any) {
      console.error('Failed to update email:', err);
      toast.error(err.message || 'Failed to update email');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to update password:', err);
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const isScholar = passenger?.passenger_type === 'scholar';

  return (
    <AppLayout showSOS={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-6 safe-top">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-foreground">Profile</h1>
            <img src={logo} alt="Street Surfers" className="h-8 w-auto opacity-50" />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Profile Card */}
          <Card className="bg-card border-border rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-accent">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="gradient-accent text-accent-foreground text-xl font-bold">
                    {profile?.full_name?.charAt(0) || <User />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-display font-semibold text-foreground">
                      {profile?.full_name || 'Passenger'}
                    </h2>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {passenger?.employee_id && (
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        ID: {passenger.employee_id}
                      </p>
                    </div>
                  )}
                  {passenger?.department && (
                    <p className="text-xs text-accent font-medium mt-0.5">
                      {passenger.department}
                    </p>
                  )}
                  {isScholar && (
                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                      <GraduationCap className="h-3 w-3" />
                      Scholar Transport
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info - Editable */}
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Email - Editable */}
              <div className="p-3 bg-secondary rounded-xl">
                {isEditingEmail ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-accent shrink-0" />
                      <Input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className="h-9 bg-background border-border text-foreground"
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingEmail(false);
                          setEmailValue(profile?.email || '');
                        }}
                        disabled={isSavingEmail}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEmail}
                        disabled={isSavingEmail}
                        className="gradient-accent text-accent-foreground"
                      >
                        {isSavingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <Mail className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm text-foreground flex-1">{profile?.email || 'Not set'}</span>
                    <span className="text-xs text-accent">Edit</span>
                  </button>
                )}
              </div>
              
              {/* Phone - Editable */}
              <div className="p-3 bg-secondary rounded-xl">
                {isEditingPhone ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-accent shrink-0" />
                      <Input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        className="h-9 bg-background border-border text-foreground"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingPhone(false);
                          setPhoneValue(profile?.phone || '');
                        }}
                        disabled={isSavingPhone}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSavePhone}
                        disabled={isSavingPhone}
                        className="gradient-accent text-accent-foreground"
                      >
                        {isSavingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <Phone className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm text-foreground flex-1">{profile?.phone || 'Not set'}</span>
                    <span className="text-xs text-accent">Edit</span>
                  </button>
                )}
              </div>

              {/* Password - Editable */}
              <div className="p-3 bg-secondary rounded-xl">
                {isEditingPassword ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-accent shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-9 bg-background border-border text-foreground pr-10"
                            placeholder="New password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-9 bg-background border-border text-foreground"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        disabled={isSavingPassword}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSavePassword}
                        disabled={isSavingPassword}
                        className="gradient-accent text-accent-foreground"
                      >
                        {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <Lock className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm text-foreground flex-1">••••••••</span>
                    <span className="text-xs text-accent">Change</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Addresses - Locked */}
          {passenger && (
            <Card className="bg-card border-border rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-foreground">Addresses</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                    <MapPin className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Home</p>
                    <p className="text-sm text-foreground">{passenger.home_address || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                    {isScholar ? (
                      <GraduationCap className="h-4 w-4 text-accent" />
                    ) : (
                      <MapPin className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {isScholar ? 'School' : 'Work'}
                    </p>
                    <p className="text-sm text-foreground">
                      {isScholar ? (passenger.school_address || 'Not set') : (passenger.work_address || 'Not set')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          {passenger?.emergency_contact_name && (
            <Card className="bg-card border-accent/30 border-2 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4 text-accent" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-foreground">{passenger.emergency_contact_name}</p>
                <p className="text-sm text-muted-foreground">{passenger.emergency_contact_phone}</p>
              </CardContent>
            </Card>
          )}

          {/* Locked Fields Notice */}
          <div className="bg-secondary/50 border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Locked Details</p>
                <p className="text-xs text-muted-foreground mt-1">
                  To change your name, addresses, {isScholar ? 'school' : 'company'}, or passenger type, please contact Dispatch Support.
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl border-border text-foreground hover:bg-secondary hover:text-foreground" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
