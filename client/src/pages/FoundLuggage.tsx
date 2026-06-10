import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function FoundLuggage() {
  const { token } = useParams();
  const { toast } = useToast();
  const [luggage, setLuggage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/found/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.found) setLuggage(data.luggage);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReport = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/found/${token}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) setSent(true);
      else toast({ title: 'Error', description: 'No se pudo enviar el reporte', variant: 'destructive' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar el reporte', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🧳</div>
        <h1 className="text-xl font-bold mb-2">Código no válido</h1>
        <p className="text-muted-foreground text-sm">Este código QR no corresponde a ninguna maleta registrada.</p>
      </div>
    </div>
  );

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-xl font-bold mb-2">¡Gracias!</h1>
        <p className="text-muted-foreground text-sm">El propietario ha sido notificado. Tu gesto puede hacer una gran diferencia.</p>
        <p className="text-xs text-muted-foreground mt-4">Powered by manifiesto.app</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🧳</div>
          <h1 className="text-2xl font-bold mb-2">¿Encontraste esta maleta?</h1>
          <p className="text-muted-foreground text-sm">
            Esta maleta tiene dueño. Al presionar el botón, el propietario recibirá una notificación inmediata.
          </p>
        </div>

        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-sm font-medium">{luggage.nickname || luggage.type || "Maleta"}</p>
          {luggage.color && <p className="text-xs text-muted-foreground mt-1">Color: {luggage.color}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensaje opcional para el dueño</label>
          <Textarea
            placeholder="Ej: La encontré en la cinta del aeropuerto, puerta B12..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleReport} disabled={sending} className="w-full" size="lg">
          {sending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          Notificar al propietario
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          No compartimos ningún dato personal del propietario. Solo enviamos una notificación.
        </p>
      </div>
    </div>
  );
}