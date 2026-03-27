import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useTrips } from '@/hooks/useTrips';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import LuggageCard from '@/components/LuggageCard';
import EmptyState from '@/components/EmptyState';
import { Package } from 'lucide-react';

export default function Manifests() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [allLuggage, setAllLuggage] = useState<any[]>([]);

  // Obtener usuario de localStorage
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation('/login');
    }
  }, [setLocation]);

  // Obtener todos los viajes del usuario
  const { data: trips = [] } = useTrips(user?.id || null);

  // Obtener todas las maletas cuando cambien los viajes
  useEffect(() => {
    const fetchAllLuggage = async () => {
      if (trips.length === 0) {
        setAllLuggage([]);
        return;
      }

      const luggagePromises = trips.map(async (trip: any) => {
        const res = await fetch(`/api/luggage?tripId=${trip.id}`);
        if (!res.ok) return [];
        const luggage = await res.json();
        return luggage.map((lug: any) => ({
          ...lug,
          tripTitle: trip.title,
          tripDestination: trip.destination,
        }));
      });

      const results = await Promise.all(luggagePromises);
      const flatLuggage = results.flat();
      setAllLuggage(flatLuggage);
    };

    fetchAllLuggage();
  }, [trips]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar title={t('myManifests')} />

      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{t('allYourLuggage')}</h2>
          <p className="text-muted-foreground">
            {t('youHaveLuggage')} {allLuggage.length} {allLuggage.length === 1 ? t('luggageSingle') : t('luggagePlural')} {t('registered')}
          </p>
        </div>

        {allLuggage.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('noLuggageYet')}
            description={t('createTripAndAddLuggage')}
            actionLabel={t('goToTrips')}
            onAction={() => setLocation('/dashboard')}
          />
        ) : (
          <div className="space-y-6">
            {/* Agrupar por viaje */}
            {trips.map((trip: any) => {
              const tripLuggage = allLuggage.filter((lug) => lug.tripId === trip.id);
              if (tripLuggage.length === 0) return null;

              return (
                <div key={trip.id} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <h3 className="font-semibold text-lg">{trip.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      • {trip.destination}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tripLuggage.map((lug: any) => (
                      <LuggageCard
                        key={lug.id}
                        luggage={lug}  // ✅ CORRECTO
                        onClick={() => setLocation(`/trip/${trip.id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}