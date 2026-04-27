import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PassengerTypeStep, PassengerType } from '@/components/onboarding/PassengerTypeStep';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { AddressStep, AddressData } from '@/components/onboarding/AddressStep';
import { CompanyStep } from '@/components/onboarding/CompanyStep';
import { SchoolStep } from '@/components/onboarding/SchoolStep';
import { ScholarInfoStep, ScholarInfoData } from '@/components/onboarding/ScholarInfoStep';
import { ScheduleStep } from '@/components/onboarding/ScheduleStep';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.webp';

type OnboardingStep = 
  | 'passenger-type' 
  | 'welcome' 
  | 'home-address' 
  | 'company' 
  | 'scholar-info'
  | 'school-address'
  | 'schedule' 
  | 'complete';

interface Company {
  id: string;
  company_name: string;
  verification_status: string;
  street: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Branch {
  id: string;
  company_id: string;
  branch_name: string;
  street: string;
  building_note: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
}

interface School {
  id: string;
  company_name: string;
  street: string;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  verification_status: string;
}

export default function Onboarding() {
  const { profile, passenger, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('passenger-type');
  const [passengerType, setPassengerType] = useState<PassengerType | null>(null);
  const [scholarInfo, setScholarInfo] = useState<ScholarInfoData | null>(null);

  const handlePassengerTypeSubmit = async (type: PassengerType) => {
    if (!user) return;

    setPassengerType(type);
    
    try {
      // Update passenger type and is_minor flag
      const { error } = await supabase
        .from('passengers')
        .update({
          passenger_type: type,
          is_minor: type === 'scholar',
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentStep('welcome');
    } catch (error) {
      console.error('Error updating passenger type:', error);
      toast({
        title: 'Error',
        description: 'Failed to save passenger type. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleProfileSubmit = async (data: { full_name: string; phone: string; company: string }) => {
    if (!user || !passenger) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update passenger company (legacy field) - only for staff
      if (passengerType === 'staff') {
        const { error: passengerError } = await supabase
          .from('passengers')
          .update({
            company: data.company,
          })
          .eq('user_id', user.id);

        if (passengerError) throw passengerError;
      }

      setCurrentStep('home-address');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleHomeAddressSubmit = async (data: AddressData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('passengers')
        .update({
          home_address: data.address,
          home_lat: data.lat || null,
          home_lng: data.lng || null,
          home_house_number: data.house_number || null,
          home_street: data.street || null,
          home_suburb: data.suburb || null,
          home_city: data.city || null,
          home_province: data.province || null,
          address_confidence: data.address_confidence || 'street-level',
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Different flow for scholar vs staff
      if (passengerType === 'scholar') {
        setCurrentStep('scholar-info');
      } else {
        setCurrentStep('company');
      }
    } catch (error) {
      console.error('Error updating home address:', error);
      toast({
        title: 'Error',
        description: 'Failed to save home address. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleScholarInfoSubmit = async (data: ScholarInfoData) => {
    if (!user || !passenger) return;

    try {
      // Store scholar info for later (will be saved after school selection)
      setScholarInfo(data);
      setCurrentStep('school-address');
    } catch (error) {
      console.error('Error saving scholar info:', error);
      toast({
        title: 'Error',
        description: 'Failed to save scholar info. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSchoolSubmit = async (school: School) => {
    if (!user || !passenger || !scholarInfo) return;

    try {
      // Build school address
      const schoolAddress = [
        school.street,
        school.suburb,
        school.city
      ].filter(Boolean).join(', ');

      // Update passenger with school info
      const { error: passengerError } = await supabase
        .from('passengers')
        .update({
          school_company_id: school.id,
          school_address: schoolAddress,
          school_lat: school.latitude,
          school_lng: school.longitude,
          school_street: school.street,
          school_suburb: school.suburb,
          school_city: school.city,
          school_province: school.province,
        })
        .eq('user_id', user.id);

      if (passengerError) throw passengerError;

      // Create scholar_profile with guardian info
      const { error: scholarError } = await supabase
        .from('scholar_profiles')
        .insert({
          passenger_id: passenger.id,
          grade_year: scholarInfo.grade_year,
          guardian_full_name: scholarInfo.guardian_full_name,
          guardian_phone: scholarInfo.guardian_phone,
          guardian_email: scholarInfo.guardian_email || null,
        });

      if (scholarError) throw scholarError;

      setCurrentStep('schedule');
    } catch (error) {
      console.error('Error updating school:', error);
      toast({
        title: 'Error',
        description: 'Failed to save school. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCompanySubmit = async (company: Company, branch: Branch | null) => {
    if (!user) return;

    try {
      let workAddress: string;
      let workLat: number | null;
      let workLng: number | null;
      let companyLabel: string;

      if (branch) {
        // Use branch address
        workAddress = [
          branch.street,
          branch.building_note ? `(${branch.building_note})` : null,
          branch.suburb,
          branch.city
        ].filter(Boolean).join(', ');
        workLat = branch.latitude;
        workLng = branch.longitude;
        companyLabel = `${company.company_name} – ${branch.branch_name}`;
      } else {
        // No branch — use company address
        workAddress = [
          company.street,
          company.suburb,
          company.city
        ].filter(Boolean).join(', ');
        workLat = company.latitude;
        workLng = company.longitude;
        companyLabel = company.company_name;
      }

      // Update passenger with company and branch references
      const { error } = await supabase
        .from('passengers')
        .update({
          company_id: company.id,
          branch_id: branch?.id || null,
          company: companyLabel,
          work_address: workAddress,
          work_lat: workLat,
          work_lng: workLng,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentStep('schedule');
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleScheduleSubmit = async (schedules: { dayOfWeek: number; inboundTime: string | null; outboundTime: string | null; weekStart: string }[]) => {
    if (!user || !passenger) return;

    try {
      // Insert availability requests with week_start
      const { error: scheduleError } = await supabase
        .from('availability_requests')
        .insert(
          schedules.map((schedule) => ({
            passenger_id: passenger.id,
            day_of_week: schedule.dayOfWeek,
            inbound_time: schedule.inboundTime,
            outbound_time: schedule.outboundTime,
            week_start: schedule.weekStart,
            status: 'pending',
          }))
        );

      if (scheduleError) throw scheduleError;

      // Mark onboarding as complete
      const { error: onboardingError } = await supabase
        .from('passengers')
        .update({
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      if (onboardingError) throw onboardingError;

      setCurrentStep('complete');

      // Redirect after showing success
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error submitting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit schedule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Completed state
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <img src={logo} alt="Street Surfers" className="h-12 w-auto mb-8" />
        <Card className="bg-card border-border rounded-2xl w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center mx-auto mb-6 glow-accent">
              <Check className="w-10 h-10 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">
              You're All Set!
            </h1>
            <p className="text-muted-foreground mb-4">
              Your schedule has been submitted for dispatch approval.
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecting to dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get ride type from passenger, default to dual
  const rideType = (passenger?.ride_type || 'dual') as 'inbound' | 'outbound' | 'dual';

  // Determine the correct "back" step based on flow
  const getBackStep = (current: OnboardingStep): OnboardingStep | null => {
    switch (current) {
      case 'welcome':
        return 'passenger-type';
      case 'home-address':
        return 'welcome';
      case 'company':
        return 'home-address';
      case 'scholar-info':
        return 'home-address';
      case 'school-address':
        return 'scholar-info';
      case 'schedule':
        return passengerType === 'scholar' ? 'school-address' : 'company';
      default:
        return null;
    }
  };

  switch (currentStep) {
    case 'passenger-type':
      return (
        <PassengerTypeStep
          onSubmit={handlePassengerTypeSubmit}
        />
      );

    case 'welcome':
      return (
        <WelcomeStep
          initialData={{
            full_name: profile?.full_name || null,
            phone: profile?.phone || null,
            email: profile?.email || null,
            company: passenger?.company || null,
          }}
          onSubmit={handleProfileSubmit}
          passengerType={passengerType || 'staff'}
        />
      );

    case 'home-address':
      return (
        <AddressStep
          addressType="home"
          initialAddress={passenger?.home_address}
          onSubmit={handleHomeAddressSubmit}
          onBack={() => setCurrentStep('welcome')}
        />
      );

    case 'scholar-info':
      return (
        <ScholarInfoStep
          onSubmit={handleScholarInfoSubmit}
          onBack={() => setCurrentStep('home-address')}
        />
      );

    case 'school-address':
      return (
        <SchoolStep
          initialSchoolId={passenger?.school_company_id}
          onSubmit={handleSchoolSubmit}
          onBack={() => setCurrentStep('scholar-info')}
        />
      );

    case 'company':
      return (
        <CompanyStep
          initialCompanyId={passenger?.company_id}
          initialBranchId={passenger?.branch_id}
          homeLat={passenger?.home_lat ?? null}
          homeLng={passenger?.home_lng ?? null}
          onSubmit={handleCompanySubmit}
          onBack={() => setCurrentStep('home-address')}
        />
      );

    case 'schedule':
      return (
        <ScheduleStep
          rideType={rideType}
          onSubmit={handleScheduleSubmit}
          onBack={() => setCurrentStep(passengerType === 'scholar' ? 'school-address' : 'company')}
          isScholar={passengerType === 'scholar'}
        />
      );

    default:
      return null;
  }
}
