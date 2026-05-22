import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useTrips, useCreateTrip, useDeleteTrip } from '@/hooks/useTrips';
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
import OnboardingModal from "@/components/OnboardingModal";
import beachImg from '@assets/generated_images/Beach_destination_photo_a88a2d29.png';
import mountainImg from '@assets/generated_images/Mountain_destination_photo_988c16a1.png';
import cityImg from '@assets/generated_images/City_destination_photo_450e6abe.png';

const defaultImages = [beachImg, mountainImg, cityImg];

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNextStepModal, setShowNextStepModal] = useState(false);
  const [newTripId, setNewTripId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Obtener usuario de localStorage directamente
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation('/login');
    }
    setIsLoadingUser(false);
  }, [setLocation]);

  const { data: trips = [], isLoading: isTripsLoading } = useTrips(user?.id || null);
  // Calcular itemCount para cada viaje
  const [tripsWithCounts, setTripsWithCounts] = useState<any[]>([]);

  useEffect(() => {
    const calculateItemCounts = async () => {
      if (!trips || trips.length === 0) {
        setTripsWithCounts([]);
        return;
      }

      const tripsWithItems = await Promise.all(
        trips.map(async (trip: any) => {
          try {
            // Obtener maletas del viaje
            const luggageRes = await fetch(`/api/luggage?tripId=${trip.id}`);
            if (!luggageRes.ok) {
              return { ...trip, itemCount: 0 };
            }
            const luggageList = await luggageRes.json();

            // Sumar artículos de todas las maletas
            let totalItems = 0;
            for (const lug of luggageList) {
              const itemsRes = await fetch(`/api/manifestItems?luggageId=${lug.id}`);
              if (itemsRes.ok) {
                const items = await itemsRes.json();
                totalItems += items.reduce((sum: number, item: any) => 
                  sum + (item.quantity || 1), 0
                );
              }
            }

            return { ...trip, itemCount: totalItems };
          } catch (error) {
            console.error(`Error calculating items for trip ${trip.id}:`, error);
            return { ...trip, itemCount: 0 };
          }
        })
      );

      setTripsWithCounts(tripsWithItems);
    };

    calculateItemCounts();
  }, [trips]);
  const createTripMutation = useCreateTrip();
  const deleteTripMutation = useDeleteTrip();

  const handleDeleteTrip = (tripId: string) => {
    deleteTripMutation.mutate(
      { id: tripId, userId: user!.id },
      {
        onSuccess: () => {
          toast({
            title: t('tripDeleted'),
            description: t('tripDeleted'),
          });
        },
        onError: () => {
          toast({
            title: t('error'),
            description: t('error'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleCreateTripMutation = () => {
    createTripMutation.mutate(
      {
        ...formData,
        userId: user!.id,
        imageUrl: null,
      },
      {
        onSuccess: (data: any) => {
          setShowCreateDialog(false);
          setFormData({ title: '', destination: '', startDate: '', endDate: '', notes: '' });
          setNewTripId(data?.id || null);
          setShowNextStepModal(true);
        },
        onError: () => {
          toast({
            title: t('error'),
            description: t('error'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleCreateTrip = () => {
    if (!formData.title || !formData.destination || !formData.startDate || !formData.endDate) {
      toast({
        title: t('error'),
        description: 'Please complete all required fields', // Agregar a i18n
        variant: 'destructive',
      });
      return;
    }
    handleCreateTripMutation();
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "linear-gradient(160deg, #0f1923 0%, #1a1410 50%, #0f1923 100%)" }}>
      <OnboardingModal />

      {/* Modal siguiente paso después de crear viaje */}
      {showNextStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 w-full max-w-sm text-center shadow-xl">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-white font-bold text-lg mb-1">{t('nextStepTitle')}</h2>
            <p className="text-white/60 text-sm mb-5">{t('nextStepDescription')}</p>
            <button
              onClick={() => { setShowNextStepModal(false); if (newTripId) setLocation(`/trip/${newTripId}`); }}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-900 mb-2"
              style={{ background: "#4FC3F7" }}
            >
              {t('nextStepButton')}
            </button>
            <button
              onClick={() => setShowNextStepModal(false)}
              className="w-full py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              {t('nextStepSkip')}
            </button>
          </div>
        </div>
      )}
      <TopAppBar
        title={t('trips')}
        onAction={() => setShowCreateDialog(true)}
        actionIcon="plus"
        actionLabel={t('createTrip')}
      />

      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6">
        {/* Banner de créditos */}
        {user?.manifestCredits !== undefined && user.manifestCredits < 10 && (
          <div className="mb-4 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
            <p className="text-sm text-muted-foreground">🎟️ {t("bannerCredits", { count: user.manifestCredits })}</p>
            <button
              onClick={() => setLocation("/planes")}
              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90"
            >
              {t("bannerUpgrade")}
            </button>
          </div>
        )}
          <h2 className="text-2xl font-bold mb-2">{t('welcomeBack', { name: user?.name?.split(' ')[0] })}</h2>
          <p className="text-muted-foreground">
            {t('youHave')} {trips.length} {trips.length === 1 ? t('trip') : t('tripsPlanned')}
          </p>
        </div>

        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="relative w-full mb-6 rounded-2xl overflow-hidden" style={{ height: 380 }}>
              <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200" alt="viaje" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
              <div className="absolute inset-0 flex flex-col items-center justify-between px-6 py-8">
                <div className="flex flex-col items-center">
                  <p className="text-white font-bold text-2xl leading-tight drop-shadow-lg">{t('welcomeHeroTitle', { name: user?.name?.split(' ')[0] })}</p>
                  <p className="text-white/90 text-base mt-2 font-medium drop-shadow-md">{t('welcomeHeroSubtitle')}</p>
                </div>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-8 py-3 rounded-xl font-bold text-white text-sm shadow-lg"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}
                >
                  {t('createTrip')}
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tripsWithCounts.map((trip: any) => (
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
                onDelete={handleDeleteTrip}
              />
            ))}
          </div>
        )}

          {/* Estadísticas */}
          <div className="mt-8 grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{trips.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('tripsPlanned')}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {tripsWithCounts.reduce((acc: number, trip: any) => acc + (trip.itemCount || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('items')}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {tripsWithCounts.filter((trip: any) => trip.verified).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('certified')}</p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
            <p className="font-semibold mb-1">✈️ {t('nextTripQuestion')}</p>
            <p className="text-sm text-muted-foreground mb-4">{t('nextTripDescription')}</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
            >
              + {t('createTrip')}
            </button>
          </div>

        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTrip')}</DialogTitle>
            <DialogDescription>
              {t('createTripDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('tripTitle')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('enterTripTitle')}
                data-testid="input-trip-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">{t('destination')}</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder={t('enterDestination')}
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
                placeholder={t('additionalNotes')}
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
              {createTripMutation.isPending ? t('saving') + '...' : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}