import BottomNavigation from '../BottomNavigation';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../lib/i18n';

export default function BottomNavigationExample() {
  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen bg-background pb-16">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-2">Bottom Navigation Example</h1>
          <p className="text-muted-foreground">Click on the navigation items below</p>
        </div>
        <BottomNavigation />
      </div>
    </I18nextProvider>
  );
}
