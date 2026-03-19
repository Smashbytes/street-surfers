import { AlertTriangle, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SuspendedBannerProps {
  type: 'suspended' | 'unpaid';
}

export function SuspendedBanner({ type }: SuspendedBannerProps) {
  const message = type === 'suspended'
    ? 'Your account has been suspended.'
    : 'Your payment is overdue.';

  return (
    <Card className="bg-destructive/10 border-destructive/30 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground mb-1">
              Access Suspended
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {message} Please contact dispatch to resolve this issue and restore your shuttle access.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => window.location.href = 'tel:+27000000000'}
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Dispatch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
