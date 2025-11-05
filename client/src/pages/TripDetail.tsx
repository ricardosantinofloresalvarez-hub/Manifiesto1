import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import TopAppBar from '@/components/TopAppBar';
import BottomNavigation from '@/components/BottomNavigation';
import ManifestItemCard from '@/components/ManifestItemCard';
import EmptyState from '@/components/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import cameraImg from '@assets/generated_images/Sample_camera_item_1b3b205a.png';
import laptopImg from '@assets/generated_images/Sample_laptop_item_6d043e96.png';
import headphonesImg from '@assets/generated_images/Sample_headphones_item_73b302f6.png';

//TODO: Remove mock data
const mockTrip = {
  id: '1',
  title: 'Vacaciones en Cancún',
  destination: 'Cancún, México',
  startDate: '2025-06-15',
  endDate: '2025-06-22',
  imageUrl: beachImg,
  notes: 'Viaje familiar de verano',
};

const mockItems = [
  {
    id: '1',
    name: 'Cámara Sony A7 III',
    category: 'electronics',
    quantity: 1,
    estimatedValue: 2000,
    serialNumber: 'SN123456789',
    imageUrl: cameraImg,
  },
  {
    id: '2',
    name: 'MacBook Pro 16"',
    category: 'electronics',
    quantity: 1,
    estimatedValue: 2500,
    serialNumber: 'MBPRO2024',
    imageUrl: laptopImg,
  },
  {
    id: '3',
    name: 'Auriculares Sony',
    category: 'electronics',
    quantity: 1,
    estimatedValue: 350,
    imageUrl: headphonesImg,
  },
];

const mockItinerary = [
  { type: 'flight', title: 'Vuelo CDMX - CUN', date: '2025-06-15', time: '10:00 AM' },
  { type: 'hotel', title: 'Hotel Riu Palace', date: '2025-06-15', time: '14:00 PM' },
  { type: 'activity', title: 'Tour Chichén Itzá', date: '2025-06-17', time: '08:00 AM' },
];

export default function TripDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [items] = useState(mockItems); //TODO: Replace with actual data

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
    console.log('Generate certificate for trip:', id);
    //TODO: Implement PDF generation
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar
        title={mockTrip.title}
        onBack={() => setLocation('/dashboard')}
      />

      <div className="relative h-48 overflow-hidden">
        <img src={mockTrip.imageUrl} alt={mockTrip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{mockTrip.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">15-22 Jun 2025</span>
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
              <Button onClick={() => setShowAddItemDialog(true)} data-testid="button-add-item">
                {t('addItem')}
              </Button>
            </div>

            {items.length === 0 ? (
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
                      {...item}
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
                >
                  <Download className="h-5 w-5" />
                  {t('generateCertificate')}
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
                  <p className="text-sm text-muted-foreground mt-1">{mockTrip.title}</p>
                </div>
                <div>
                  <Label>Destino</Label>
                  <p className="text-sm text-muted-foreground mt-1">{mockTrip.destination}</p>
                </div>
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm text-muted-foreground mt-1">{mockTrip.notes}</p>
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
              <Input id="itemName" placeholder="Ej: Cámara Sony" data-testid="input-item-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('category')}</Label>
              <Select defaultValue="electronics">
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
                <Input id="quantity" type="number" defaultValue="1" data-testid="input-quantity" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">{t('estimatedValue')}</Label>
                <Input id="value" type="number" placeholder="0" data-testid="input-value" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial">{t('serialNumber')}</Label>
              <Input id="serial" placeholder="Opcional" data-testid="input-serial" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)} data-testid="button-cancel">
              {t('cancel')}
            </Button>
            <Button onClick={() => setShowAddItemDialog(false)} data-testid="button-save-item">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
