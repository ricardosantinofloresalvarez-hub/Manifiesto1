import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import VerificationResult from '@/components/VerificationResult';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function Verify() {
  const { t } = useTranslation();
  const [hash, setHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = () => {
    console.log('Verifying hash:', hash);
    //TODO: Implement actual verification with backend
    // Mock verification result for prototype
    setVerificationResult({
      valid: true,
      manifestId: 'manifest-123',
      userName: 'Juan Pérez',
      tripTitle: 'Vacaciones en Cancún',
      itemCount: 24,
      timestamp: new Date().toISOString(),
      hash: hash || 'a3f5d8e2b1c4f6a9d7e3b5c8f2a1d9e6',
    });
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
                disabled={!hash}
                data-testid="button-verify"
              >
                Verificar
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
