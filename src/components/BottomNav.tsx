import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, Clock } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'My Trips', path: '/trips' },
  { icon: Clock, label: 'Schedule', path: '/schedule' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path === '/' && location.pathname === '/') ||
            (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200
                ${isActive 
                  ? 'text-accent' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-lg transition-all
                ${isActive ? 'bg-accent/10' : ''}
              `}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}