import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ManifestItem, Trip } from '@shared/schema';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import ManifestItemCard from '@/components/ManifestItemCard';
import EmptyState from '@/components/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, MapPin, Calendar, Plane, Hotel, UtensilsCrossed, Activity } from 'lucide-react';
import beachImg from '@assets/generated_images/Beach_destination_photo_a88a2d29.png';

const mockItinerary = [
  { type: 'flight', title: 'Vuelo CDMX - CUN', date: '2025-06-15', time: '10:00 AM' },
  { type: 'hotel', title: 'Hotel Riu Palace', date: '2025-06-15', time: '14:00 PM' },
  { type: 'activity', title: 'Tour Chichén Itzá', date: '2025-06-17', time: '08:00 AM' },
];

export default function TripDetail() {
  const { id: tripId } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'electronics',
    quantity: 1,
    estimatedValue: undefined as number | undefined,
    serialNumber: '',
  });

  // Redirect to login if no user
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  // Fetch trip data
  const { data: trip, isLoading: isTripLoading } = useQuery<Trip>({
    queryKey: ['/api/trips', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}?userId=${user!.id}`);
      if (!res.ok) throw new Error('Failed to fetch trip');
      return res.json();
    },
    enabled: !!tripId && !!user,
  });

  // Fetch manifest items
  const { data: items = [], isLoading: isItemsLoading } = useQuery<ManifestItem[]>({
    queryKey: ['/api/trips', tripId, 'items'],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/items?userId=${user!.id}`);
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json();
    },
    enabled: !!tripId && !!user,
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', `/api/trips/${tripId}/items`, {
        ...data,
        userId: user!.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      toast({
        title: t('success'),
        description: t('itemAdded'),
      });
      setShowAddItemDialog(false);
      setFormData({
        name: '',
        category: 'electronics',
        quantity: 1,
        estimatedValue: undefined,
        serialNumber: '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/trips/${tripId}/certificate`, {
        userId: user!.id,
      });
      return response.json();
    },
    onSuccess: (data: { pdfUrl: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      
      // Download PDF
      const link = document.createElement('a');
      link.href = data.pdfUrl;
      link.download = `manifest-${tripId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: t('success'),
        description: t('certificateGenerated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getItineraryIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'hotel': return <Hotel className="h-5 w-5" />;
      case 'activity': return <Activity className="h-5 w-5" />;
      case 'restaurant': return <UtensilsCrossed className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

  const handleGenerateCertificate = () => {
    generateCertificateMutation.mutate();
  };

  const handleAddItem = () => {
    if (!formData.name.trim()) {
      toast({
        title: t('error'),
        description: 'Item name is required',
        variant: 'destructive',
      });
      return;
    }
    addItemMutation.mutate(formData);
  };

  // Show loading state while auth is loading
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

  // Return null if no user after loading completes
  if (!user) {
    return null;
  }

  // Show loading state while fetching trip data
  if (isTripLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopAppBar title="" onBack={() => setLocation('/dashboard')} />
        <div className="p-4 max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopAppBar title="Trip Not Found" onBack={() => setLocation('/dashboard')} />
        <div className="p-4 max-w-7xl mx-auto">
          <EmptyState
            title="Trip not found"
            description="The trip you're looking for doesn't exist."
            actionLabel="Go to Dashboard"
            onAction={() => setLocation('/dashboard')}
          />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar
        title={trip.title}
        onBack={() => setLocation('/dashboard')}
      />

      <div className="relative h-48 overflow-hidden">
        <img src={trip.imageUrl || beachImg} alt={trip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{trip.startDate} - {trip.endDate}</span>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        <Tabs defaultValue="manifest" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="itinerary" data-testid="tab-itinerary">{t('itinerary')}</TabsTrigger>
            <TabsTrigger value="manifest" data-testid="tab-manifest">{t('manifest')}</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">{t('settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="space-y-3">
            {mockItinerary.map((item, index) => (
              <Card key={index} className="p-4 hover-elevate">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {getItineraryIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.date} - {item.time}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="manifest" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{items.length} {t('items')}</h3>
                <p className="text-sm text-muted-foreground">{t('totalValue')}: ${totalValue.toLocaleString()}</p>
              </div>
              <Button 
                onClick={() => setShowAddItemDialog(true)} 
                data-testid="button-add-item"
                disabled={addItemMutation.isPending}
              >
                {t('addItem')}
              </Button>
            </div>

            {isItemsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title={t('noItems')}
                description={t('noItemsDescription')}
                actionLabel={t('addItem')}
                onAction={() => setShowAddItemDialog(true)}
              />
            ) : (
              <>
                <div className="space-y-3">
                  {items.map((item) => (
                    <ManifestItemCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      category={item.category}
                      quantity={item.quantity}
                      estimatedValue={item.estimatedValue ?? undefined}
                      serialNumber={item.serialNumber ?? undefined}
                      imageUrl={item.imageUrl ?? undefined}
                      onEdit={() => console.log('Edit item:', item.id)}
                      onDelete={() => console.log('Delete item:', item.id)}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleGenerateCertificate}
                  className="w-full gap-2"
                  size="lg"
                  data-testid="button-generate-certificate"
                  disabled={generateCertificateMutation.isPending}
                >
                  <Download className="h-5 w-5" />
                  {generateCertificateMutation.isPending ? t('generating') : t('generateCertificate')}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Detalles del Viaje</h3>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <p className="text-sm text-muted-foreground mt-1">{trip.title}</p>
                </div>
                <div>
                  <Label>Destino</Label>
                  <p className="text-sm text-muted-foreground mt-1">{trip.destination}</p>
                </div>
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm text-muted-foreground mt-1">{trip.notes || 'Sin notas'}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addItem')}</DialogTitle>
            <DialogDescription>
              Añade un artículo a tu manifiesto de equipaje
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">{t('itemName')}</Label>
              <Input 
                id="itemName" 
                placeholder="Ej: Cámara Sony" 
                data-testid="input-item-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('category')}</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">{t('electronics')}</SelectItem>
                  <SelectItem value="clothing">{t('clothing')}</SelectItem>
                  <SelectItem value="documents">{t('documents')}</SelectItem>
                  <SelectItem value="accessories">{t('accessories')}</SelectItem>
                  <SelectItem value="other">{t('other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('quantity')}</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  data-testid="input-quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">{t('estimatedValue')}</Label>
                <Input 
                  id="value" 
                  type="number" 
                  placeholder="0" 
                  data-testid="input-value"
                  value={formData.estimatedValue || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial">{t('serialNumber')}</Label>
              <Input 
                id="serial" 
                placeholder="Opcional" 
                data-testid="input-serial"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddItemDialog(false)} 
              data-testid="button-cancel"
              disabled={addItemMutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleAddItem} 
              data-testid="button-save-item"
              disabled={addItemMutation.isPending}
            >
              {addItemMutation.isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
