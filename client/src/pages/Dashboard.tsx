import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import TripCard from '@/components/TripCard';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Trip } from '@shared/schema';
import beachImg from '@assets/generated_images/Beach_destination_photo_a88a2d29.png';
import mountainImg from '@assets/generated_images/Mountain_destination_photo_988c16a1.png';
import cityImg from '@assets/generated_images/City_destination_photo_450e6abe.png';

const defaultImages = [beachImg, mountainImg, cityImg];

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const { data: trips = [], isLoading: isTripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips', { userId: user?.id }],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/trips?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch trips');
      return res.json();
    },
    enabled: !!user?.id,
  });

  const createTripMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user!.id,
          imageUrl: defaultImages[Math.floor(Math.random() * defaultImages.length)],
        }),
      });
      if (!res.ok) throw new Error('Failed to create trip');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      setShowCreateDialog(false);
      setFormData({ title: '', destination: '', startDate: '', endDate: '', notes: '' });
      toast({
        title: 'Viaje creado',
        description: 'Tu viaje se ha creado exitosamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el viaje',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTrip = () => {
    if (!formData.title || !formData.destination || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }
    createTripMutation.mutate(formData);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar
        title={t('trips')}
        onAction={() => setShowCreateDialog(true)}
        actionIcon="plus"
        actionLabel={t('createTrip')}
      />

      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Bienvenido</h2>
          <p className="text-muted-foreground">
            Tienes {trips.length} {trips.length === 1 ? 'viaje' : 'viajes'} planificados
          </p>
        </div>

        {trips.length === 0 ? (
          <EmptyState
            title={t('noTrips')}
            description={t('noTripsDescription')}
            actionLabel={t('createTrip')}
            onAction={() => setShowCreateDialog(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip: any) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                title={trip.title}
                destination={trip.destination}
                startDate={trip.startDate}
                endDate={trip.endDate}
                itemCount={trip.itemCount || 0}
                verified={trip.verified || false}
                imageUrl={trip.imageUrl || undefined}
                onClick={() => setLocation(`/trip/${trip.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTrip')}</DialogTitle>
            <DialogDescription>
              Crea un nuevo viaje para comenzar a organizar tu equipaje
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('tripTitle')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Vacaciones en Cancún"
                data-testid="input-trip-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">{t('destination')}</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Ej: Cancún, México"
                data-testid="input-destination"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t('endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreateTrip}
              disabled={createTripMutation.isPending}
              data-testid="button-save-trip"
            >
              {createTripMutation.isPending ? 'Guardando...' : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
