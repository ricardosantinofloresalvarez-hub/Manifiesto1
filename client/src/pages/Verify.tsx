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
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const hashParam = params.get('hash');
    if (hashParam) {
      setHash(hashParam);
      handleVerifyHash(hashParam);
    }
  }, [location]);

  const handleVerifyHash = async (hashToVerify: string) => {
    if (!hashToVerify) return;

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/verify/${hashToVerify}`);
      if (!res.ok) throw new Error('Verification failed');
      
      const result = await res.json();
      setVerificationResult(result);
      
      if (!result.valid) {
        toast({
          title: 'Verificación fallida',
          description: 'El hash proporcionado no corresponde a ningún manifiesto válido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo verificar el manifiesto. Intenta de nuevo.',
        variant: 'destructive',
      });
      setVerificationResult({ valid: false });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    handleVerifyHash(hash);
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
                <Label htmlFor="hash">{t('enterHash')}</Label>
                <Input
                  id="hash"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="a3f5d8e2b1c4f6a9..."
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
            <VerificationResult {...verificationResult} />
            <Button
              variant="outline"
              onClick={() => setVerificationResult(null)}
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
