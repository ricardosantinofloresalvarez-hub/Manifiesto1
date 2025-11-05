import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Home } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Página no encontrada</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        La página que buscas no existe o ha sido movida
      </p>
      <Button onClick={() => setLocation('/')} className="gap-2" data-testid="button-home">
        <Home className="h-4 w-4" />
        Volver al inicio
      </Button>
    </div>
  );
}
