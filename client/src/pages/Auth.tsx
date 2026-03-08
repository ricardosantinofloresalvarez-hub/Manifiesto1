import { useState } from 'react';
import { useLocation } from 'wouter';
import AuthForm from '@/components/AuthForm';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [, setLocation] = useLocation();
  const { i18n, t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (data: { email: string; password: string; name?: string }) => {
    try {
      // Llamar al backend para guardar/actualizar usuario
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, name: data.name || 'Usuario' }),
      });

      if (!res.ok) {
        throw new Error('Error en la autenticación');
      }

      const user = await res.json();

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Redirigir al dashboard
      setLocation('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar sesión. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleLanguage}
          data-testid="button-language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Manifiesto</h1>
        <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
      </div>
      <AuthForm
        mode={mode}
        onSubmit={handleSubmit}
        onToggleMode={() => setMode(mode === 'login' ? 'register' : 'login')}
      />
    </div>
  );
}