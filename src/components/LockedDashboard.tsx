import { Lock, Phone, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import logo from '@/assets/logo.webp';

interface LockedDashboardProps {
  reason: 'suspended' | 'unpaid';
}

export function LockedDashboard({ reason }: LockedDashboardProps) {
  const reasonText = reason === 'suspended' 
    ? 'Your account has been suspended.'
    : 'Your payment is overdue.';

  return (
    <AppLayout>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="safe-top px-5 pt-6 pb-4">
          <img src={logo} alt="Street Surfers" className="h-10 w-auto" />
        </div>

        <div className="flex-1 flex items-center justify-center px-5">
          <Card className="bg-card border-border rounded-2xl w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-destructive" />
              </div>

              <h1 className="text-2xl font-display font-bold text-foreground mb-3">
                Access Suspended
              </h1>

              <div className="flex items-center justify-center gap-2 mb-4 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{reasonText}</span>
              </div>

              <p className="text-muted-foreground mb-8">
                Your shuttle access is currently suspended. Please contact dispatch to resolve this issue.
              </p>

              <Button
                className="w-full h-14 gradient-accent text-accent-foreground font-display font-semibold rounded-xl glow-accent"
                onClick={() => window.location.href = 'tel:+27000000000'}
              >
                <Phone className="w-5 h-5 mr-2" />
                Contact Dispatch
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
