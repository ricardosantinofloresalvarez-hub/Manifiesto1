import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Calendar, User, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

interface VerificationResultProps {
  valid: boolean;
  manifestId?: string;
  userName?: string;
  tripTitle?: string;
  itemCount?: number;
  timestamp?: string;
  hash?: string;
}

export default function VerificationResult({
  valid,
  manifestId,
  userName,
  tripTitle,
  itemCount,
  timestamp,
  hash,
}: VerificationResultProps) {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex flex-col items-center mb-8">
        {valid ? (
          <>
            <CheckCircle2 className="h-20 w-20 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Manifiesto Verificado</h2>
            <Badge variant="default" className="text-base px-4 py-1">
              Válido
            </Badge>
          </>
        ) : (
          <>
            <XCircle className="h-20 w-20 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Manifiesto Inválido</h2>
            <Badge variant="destructive" className="text-base px-4 py-1">
              No Verificado
            </Badge>
          </>
        )}
      </div>

      {valid && manifestId && (
        <>
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Detalles del Manifiesto</h3>
            <div className="space-y-3">
              {tripTitle && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Viaje</p>
                    <p className="font-medium">{tripTitle}</p>
                  </div>
                </div>
              )}
              {userName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">{userName}</p>
                  </div>
                </div>
              )}
              {itemCount !== undefined && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Artículos</p>
                    <p className="font-medium">{itemCount} artículos</p>
                  </div>
                </div>
              )}
              {timestamp && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Certificado</p>
                    <p className="font-medium">
                      {format(new Date(timestamp), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {hash && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-center">Código QR</h3>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={hash} size={200} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4 font-mono break-all">
                {hash}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
