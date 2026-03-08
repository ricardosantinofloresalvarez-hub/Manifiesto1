import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Extract hash from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const hashParam = params.get('hash');
    if (hashParam) {
      setHash(hashParam);
      handleVerifyHash(hashParam);
    }
  }, [location]);

  const handleVerifyHash = async (hashToVerify: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch(`/api/luggage/verify/${hashToVerify.trim()}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setVerificationResult(data);
        toast({
          title: 'Verificación exitosa',
          description: 'El manifiesto es válido y ha sido verificado correctamente',
        });
      } else {
        setVerificationResult({ valid: false });
        toast({
          title: 'Verificación fallida',
          description: 'El manifiesto no pudo ser verificado',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verificando:', error);
      setVerificationResult({ valid: false });
      toast({
        title: 'Error',
        description: 'No se pudo verificar el manifiesto. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (hash) {
      handleVerifyHash(hash);
    }
  };

  const handleReset = () => {
    setHash('');
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar title={t('verifyManifest')} />

      <div className="p-4 max-w-2xl mx-auto">
        {!verificationResult ? (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Verificar Manifiesto</h2>
            <p className="text-muted-foreground mb-6">
              Ingresa el hash de verificación del manifiesto para validar su autenticidad
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hash">Ingresar hash de verificación</Label>
                <Input
                  id="hash"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="78e9d0ff677b26f617bdbf5cf3c0e54b"
                  className="font-mono"
                  data-testid="input-hash"
                />
              </div>
              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={!hash || isVerifying}
                data-testid="button-verify"
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <VerificationResult
              valid={verificationResult.valid}
              manifestId={verificationResult.luggageId}
              userName={verificationResult.nickname}
              hash={hash}
            />
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full mt-6"
              data-testid="button-verify-another"
            >
              Verificar Otro Manifiesto
            </Button>
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}