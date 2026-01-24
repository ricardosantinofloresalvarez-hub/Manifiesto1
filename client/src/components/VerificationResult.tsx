import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Calendar, User, Package, DollarSign, Lock, ShieldCheck, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import CategoryBadge from './CategoryBadge';

// ... (se mantienen las mismas interfaces ManifestItem y VerificationResultProps)

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
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Encabezado de Estado */}
      <div className="flex flex-col items-center mb-8 animate-in fade-in zoom-in duration-500">
        {valid ? (
          <>
            <div className="bg-blue-500/10 p-5 rounded-full mb-4 border border-blue-500/20">
              <CheckCircle2 className="h-16 w-16 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Manifiesto Verificado</h2>
            <Badge className="mt-2 bg-blue-500 text-white border-none px-6 py-1 font-black uppercase tracking-widest text-[10px]">
              OFICIAL / VÁLIDO
            </Badge>
          </>
        ) : (
          <>
            <div className="bg-red-500/10 p-5 rounded-full mb-4 border border-red-500/20">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Error de Registro</h2>
            <Badge variant="destructive" className="mt-2 px-6 py-1 font-black uppercase tracking-widest text-[10px]">
              NO VERIFICADO
            </Badge>
          </>
        )}
      </div>

      {valid && (
        <div className="space-y-6">
          {/* Detalles Principales con estilo Dark */}
          <Card className="bg-[#121417] border-white/5 shadow-2xl rounded-[32px] overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-6">Detalles de Certificación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tripTitle && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-white/20 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold">Viaje / Destino</p>
                      <p className="font-bold text-white uppercase italic">{tripTitle}</p>
                      {destination && <p className="text-xs text-white/30">{destination}</p>}
                    </div>
                  </div>
                )}
                {userName && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-white/20 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold">Titular</p>
                      <p className="font-bold text-white uppercase">{userName}</p>
                    </div>
                  </div>
                )}
                {timestamp && (
                  <div className="flex items-start gap-3 md:col-span-2 border-t border-white/5 pt-4">
                    <Calendar className="h-5 w-5 text-white/20 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold">Fecha de Emisión</p>
                      <p className="font-medium text-white/80">
                        {format(new Date(timestamp), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Listado de Artículos estilo Inventario */}
          {items && items.length > 0 && (
            <Card className="bg-[#121417] border-white/5 shadow-2xl rounded-[32px]">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Contenido Declarado</h3>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{itemCount} items</span>
                </div>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="bg-white/5 p-4 rounded-2xl border border-white/5 group transition-colors hover:bg-white/[0.08]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white uppercase tracking-tight text-sm">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <CategoryBadge category={item.category} />
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        {item.estimatedValue && (
                          <span className="text-xs font-black text-blue-400 font-mono">${item.estimatedValue.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR de Validación Final */}
          {hash && (
            <div className="flex flex-col items-center pt-4">
              <div className="bg-white p-3 rounded-[24px] shadow-2xl mb-4">
                <QRCodeSVG value={hash} size={160} />
              </div>
              <p className="text-[8px] text-white/20 font-mono break-all text-center max-w-xs uppercase tracking-tighter">
                Digital Seal ID: {hash}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}