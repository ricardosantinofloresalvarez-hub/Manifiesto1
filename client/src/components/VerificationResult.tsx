import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Calendar, User, Package, DollarSign, Lock, ShieldCheck, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import CategoryBadge from './CategoryBadge';

interface ManifestItem {
  name: string;
  category: string;
  quantity: number;
  estimatedValue?: number;
  serialNumber?: string;
  luggageBrand?: string;
  luggageSize?: string;
  isSealed?: boolean;
  isLocked?: boolean;
}

interface VerificationResultProps {
  valid: boolean;
  manifestId?: string;
  userName?: string;
  tripTitle?: string;
  destination?: string;
  itemCount?: number;
  totalValue?: number;
  items?: ManifestItem[];
  timestamp?: string;
  hash?: string;
}

export default function VerificationResult({
  valid,
  manifestId,
  userName,
  tripTitle,
  destination,
  itemCount,
  totalValue,
  items,
  timestamp,
  hash,
}: VerificationResultProps) {
  const getSizeLabel = (size: string) => {
    const sizeMap: Record<string, string> = {
      small: 'Pequeña',
      medium: 'Mediana',
      large: 'Grande',
      xlarge: 'Extra Grande',
    };
    return sizeMap[size] || size;
  };
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
                    {destination && <p className="text-sm text-muted-foreground">{destination}</p>}
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
              {totalValue !== undefined && totalValue !== null && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium">${totalValue.toLocaleString()}</p>
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

          {items && items.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Artículos del Manifiesto</h3>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <CategoryBadge category={item.category} />
                          <span className="text-sm text-muted-foreground">Cantidad: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    {(item.estimatedValue || item.serialNumber || item.luggageBrand) && (
                      <div className="text-sm text-muted-foreground space-y-1 mt-2">
                        {item.estimatedValue && <div>Valor: ${item.estimatedValue.toLocaleString()}</div>}
                        {item.serialNumber && <div>S/N: {item.serialNumber}</div>}
                        {item.luggageBrand && (
                          <div className="flex items-center gap-1">
                            <span>Maleta:</span>
                            <span className="font-medium">{item.luggageBrand}</span>
                            {item.luggageSize && <span>({getSizeLabel(item.luggageSize)})</span>}
                          </div>
                        )}
                      </div>
                    )}
                    {(item.isSealed || item.isLocked) && (
                      <div className="flex gap-2 mt-2">
                        {item.isSealed && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Sellada
                          </Badge>
                        )}
                        {item.isLocked && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            Con Candado
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

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
