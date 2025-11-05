import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import heroImg from '@assets/generated_images/Hero_welcome_travel_scene_144f68de.png';
import { Plane, Shield, CheckCircle2 } from 'lucide-react';

export default function Welcome() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={heroImg}
          alt="Travel organization"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('welcome')}</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            {t('welcomeSubtitle')}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Plane className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Organiza tus Viajes</h3>
            <p className="text-sm text-muted-foreground">
              Planifica itinerarios completos con vuelos, hoteles y actividades
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Gestiona tu Equipaje</h3>
            <p className="text-sm text-muted-foreground">
              Registra cada artículo con fotos, valores y números de serie
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Certificación Verificable</h3>
            <p className="text-sm text-muted-foreground">
              Genera PDFs certificados con códigos QR para verificación
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => setLocation('/login')}
            className="text-base"
            data-testid="button-get-started"
          >
            {t('getStarted')}
          </Button>
        </div>
      </div>
    </div>
  );
}
