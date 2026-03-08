import { useEffect, useState, useRef } from 'react';
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
import { User, Moon, Sun, Globe, LogOut, MapPin, Briefcase, Package, DollarSign, Calendar, Mail, FileText, Shield, Info, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CLOUDINARY_CLOUD_NAME = "drjrozqs8";
const CLOUDINARY_UPLOAD_PRESET = "luggage_photos";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [stats, setStats] = useState({
    totalTrips: 0,
    totalLuggage: 0,
    totalItems: 0,
    totalValue: 0,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      loadStats(userData.id);
    }
  }, []);

  const loadStats = async (userId: string) => {
    try {
      const tripsRes = await fetch(`/api/trips?userId=${userId}`);
      const trips = await tripsRes.json();

      let totalLuggage = 0;
      let totalItems = 0;
      let totalValue = 0;

      for (const trip of trips) {
        const luggageRes = await fetch(`/api/luggage?tripId=${trip.id}`);
        const luggage = await luggageRes.json();
        totalLuggage += luggage.length;

        for (const lug of luggage) {
          const itemsRes = await fetch(`/api/manifestItems?luggageId=${lug.id}`);
          const items = await itemsRes.json();
          totalItems += items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          totalValue += items.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
        }
      }

      setStats({
        totalTrips: trips.length,
        totalLuggage,
        totalItems,
        totalValue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Subir a Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'profile-photos');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const photoUrl = data.secure_url;

      // Actualizar en base de datos
      const updateRes = await fetch(`/api/auth/update-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, photoUrl }),
      });

      if (!updateRes.ok) throw new Error('Failed to update photo');

      // Actualizar localStorage y estado
      const updatedUser = { ...user, photoUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast({
        title: "Éxito",
        description: "Foto de perfil actualizada correctamente",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar title={t('profile')} />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoUrl || ""} alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={uploading}
              />

              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg"
                onClick={handlePhotoClick}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-3 w-3" />
                <span>{user.email}</span>
              </div>
              {user.createdAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Tu actividad
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTrips}</p>
                <p className="text-xs text-muted-foreground">Viajes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Briefcase className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalLuggage}</p>
                <p className="text-xs text-muted-foreground">Maletas</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-green-500/10">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">Artículos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Valor total</p>
              </div>
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
                  <Label>Modo Oscuro</Label>
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
                  <Label>Idioma</Label>
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
          <h3 className="font-semibold mb-4">Información</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => window.open('/privacy-policy.html', '_blank')}
            >
              <Shield className="h-4 w-4" />
              Política de Privacidad
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => window.open('/terms-of-service.html', '_blank')}
            >
              <FileText className="h-4 w-4" />
              Términos de Uso
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => window.open('/about.html', '_blank')}
            >
              <Info className="h-4 w-4" />
              Acerca de Manifiesto
            </Button>
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
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}