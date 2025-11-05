import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import { useTheme } from '@/components/ThemeProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Moon, Sun, Globe, LogOut } from 'lucide-react';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    console.log('Logout');
    //TODO: Implement logout
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar title={t('profile')} />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">Juan Pérez</h2>
              <p className="text-sm text-muted-foreground">juan@example.com</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Preferencias</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <Label>{theme === 'dark' ? t('darkMode') : t('lightMode')}</Label>
                  <p className="text-xs text-muted-foreground">Tema de la aplicación</p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                data-testid="switch-theme"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                <div>
                  <Label>{t('language')}</Label>
                  <p className="text-xs text-muted-foreground">Idioma de la interfaz</p>
                </div>
              </div>
              <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
                <SelectTrigger className="w-32" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Cuenta</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </Button>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
