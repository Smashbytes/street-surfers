import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Phone, Building2, Mail, ArrowRight, Loader2, GraduationCap } from 'lucide-react';
import logo from '@/assets/logo.webp';

const staffProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long'),
  company: z.string().trim().min(1, 'Company/team is required').max(100, 'Company name is too long'),
});

const scholarProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long'),
  company: z.string().optional(),
});

type ProfileFormData = z.infer<typeof staffProfileSchema>;

interface WelcomeStepProps {
  initialData: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
    company: string | null;
  };
  onSubmit: (data: ProfileFormData) => Promise<void>;
  passengerType?: 'staff' | 'scholar';
}

export function WelcomeStep({ initialData, onSubmit, passengerType = 'staff' }: WelcomeStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isScholar = passengerType === 'scholar';

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(isScholar ? scholarProfileSchema : staffProfileSchema),
    defaultValues: {
      full_name: initialData.full_name || '',
      phone: initialData.phone || '',
      company: initialData.company || '',
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top px-6 pt-8 pb-4 text-center">
        <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Welcome to Street Surfers
        </h1>
        <p className="text-muted-foreground">
          Let's confirm your profile details
        </p>
        
        {/* Passenger Type Badge */}
        <div className="flex justify-center mt-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isScholar 
              ? 'bg-warning/20 text-warning border border-warning/30' 
              : 'bg-accent/20 text-accent border border-accent/30'
          }`}>
            {isScholar ? (
              <>
                <GraduationCap className="w-4 h-4" />
                Scholar Transport
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                Staff Transport
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pb-8">
        <Card className="bg-card border-border rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Profile Confirmation</CardTitle>
            <CardDescription>Please verify your information to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        {isScholar ? 'Student Full Name' : 'Full Name'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={isScholar ? "Enter student's full name" : "Enter your full name"}
                          className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {isScholar ? 'Student Phone Number (optional)' : 'Phone Number'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Only show company field for staff */}
                {!isScholar && (
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          Company / Team
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your company or team"
                            className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="pt-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <Mail className="w-4 h-4" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{initialData.email || 'Not provided'}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 gradient-accent text-accent-foreground font-display font-semibold text-lg rounded-xl glow-accent"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
