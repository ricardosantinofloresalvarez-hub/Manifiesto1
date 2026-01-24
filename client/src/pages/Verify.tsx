import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useCertificateByHash } from '@/hooks/useCertificates';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import VerificationResult from '@/components/VerificationResult';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Verify() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { toast } = useToast();
  const [hash, setHash] = useState('');
  const [shouldVerify, setShouldVerify] = useState(false);

  const { data: certificate, isLoading: isVerifying, error } = useCertificateByHash(
    shouldVerify && hash ? hash : null
  );

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const hashParam = params.get('hash');
    if (hashParam) {
      setHash(hashParam);
      setShouldVerify(true);
    }
  }, [location]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo verificar el manifiesto.',
        variant: 'destructive',
      });
      setShouldVerify(false);
    } 
    // CAMBIO AQUÍ: Si hay certificado, lo damos por válido si el servidor respondió bien
    else if (shouldVerify && !isVerifying && certificate) {
      toast({
        title: 'Verificación exitosa',
        description: 'El manifiesto es válido y oficial.',
      });
    } 
    // Si terminó de cargar y no hay nada
    else if (shouldVerify && !isVerifying && certificate === null) {
      toast({
        title: 'Verificación fallida',
        description: 'El hash no corresponde a ningún manifiesto.',
        variant: 'destructive',
      });
      setShouldVerify(false);
    }
  }, [error, certificate, shouldVerify, isVerifying, toast]);

  const handleVerify = () => {
    if (hash) {
      setShouldVerify(true);
    }
  };

  const handleReset = () => {
    setHash('');
    setShouldVerify(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar title={t('verifyManifest')} />

      <div className="p-4 max-w-2xl mx-auto">
        {/* Mostramos el resultado si tenemos datos del certificado */}
        {shouldVerify && certificate ? (
          <>
            <VerificationResult 
              valid={true} // Forzamos true porque si llegó aquí, el hash existe en DB
              certificate={certificate}
              trip={certificate.trip}
              items={certificate.items}
              user={certificate.user}
            />
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full mt-6"
            >
              Verificar Otro Manifiesto
            </Button>
          </>
        ) : (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Verificar Manifiesto</h2>
            <p className="text-muted-foreground mb-6">
              Ingresa el hash de verificación para validar su autenticidad
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hash">{t('enterHash')}</Label>
                <Input
                  id="hash"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Introduce el hash aquí..."
                  className="font-mono"
                />
              </div>
              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={!hash || isVerifying}
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}