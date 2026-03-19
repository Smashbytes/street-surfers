import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { SOSButton } from './SOSButton';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showSOS?: boolean;
  tripId?: string;
}

export function AppLayout({ children, showNav = true, showSOS = true, tripId }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background dark">
      <main className={`${showNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {showSOS && <SOSButton tripId={tripId} />}
      {showNav && <BottomNav />}
    </div>
  );
}
