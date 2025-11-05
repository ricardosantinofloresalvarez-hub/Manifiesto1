import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import TripCard from '@/components/TripCard';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
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
import beachImg from '@assets/generated_images/Beach_destination_photo_a88a2d29.png';
import mountainImg from '@assets/generated_images/Mountain_destination_photo_988c16a1.png';
import cityImg from '@assets/generated_images/City_destination_photo_450e6abe.png';

//TODO: Remove mock data - this is placeholder for the prototype
const mockTrips = [
  {
    id: '1',
    title: 'Vacaciones en Cancún',
    destination: 'Cancún, México',
    startDate: '2025-06-15',
    endDate: '2025-06-22',
    itemCount: 24,
    verified: true,
    imageUrl: beachImg,
  },
  {
    id: '2',
    title: 'Aventura en los Alpes',
    destination: 'Chamonix, Francia',
    startDate: '2025-12-01',
    endDate: '2025-12-10',
    itemCount: 18,
    verified: false,
    imageUrl: mountainImg,
  },
  {
    id: '3',
    title: 'Tour Europeo',
    destination: 'París, Francia',
    startDate: '2025-09-10',
    endDate: '2025-09-20',
    itemCount: 32,
    verified: true,
    imageUrl: cityImg,
  },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [trips] = useState(mockTrips); //TODO: Replace with actual data from backend

  const handleCreateTrip = () => {
    console.log('Create trip');
    setShowCreateDialog(false);
    //TODO: Implement trip creation
  };

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
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                {...trip}
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
              <Input id="title" placeholder="Ej: Vacaciones en Cancún" data-testid="input-trip-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">{t('destination')}</Label>
              <Input id="destination" placeholder="Ej: Cancún, México" data-testid="input-destination" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('startDate')}</Label>
                <Input id="startDate" type="date" data-testid="input-start-date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t('endDate')}</Label>
                <Input id="endDate" type="date" data-testid="input-end-date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea id="notes" placeholder="Notas adicionales..." data-testid="input-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel">
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateTrip} data-testid="button-save-trip">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
