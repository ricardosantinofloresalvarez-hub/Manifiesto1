import { Home, FileText, Shield, User } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('trips') },
    { path: '/manifests', icon: FileText, label: t('manifests') },
    { path: '/verify', icon: Shield, label: t('verify') },
    { path: '/profile', icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
