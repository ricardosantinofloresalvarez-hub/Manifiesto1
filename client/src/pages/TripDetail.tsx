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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState<ManifestItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'electronics',
    quantity: '1', // Changed to string to fix input editing
    estimatedValue: '' as string,
    serialNumber: '',
    luggageBrand: '',
    luggageSize: '',
    isSealed: false,
    isLocked: false,
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
    mutationFn: async (data: any) => {
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
        quantity: '1',
        estimatedValue: '',
        serialNumber: '',
        luggageBrand: '',
        luggageSize: '',
        isSealed: false,
        isLocked: false,
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

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/items/${id}`, {
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
        description: 'Artículo actualizado',
      });
      setShowEditItemDialog(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/items/${itemId}`, {
        userId: user!.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      toast({
        title: t('success'),
        description: 'Artículo eliminado',
      });
      setShowDeleteConfirm(false);
      setDeletingItemId(null);
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
    onSuccess: (data: { pdfUrl: string; certificate: { hash: string } }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      
      // Save hash for display
      setGeneratedHash(data.certificate.hash);
      
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
    addItemMutation.mutate({
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 1,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
      serialNumber: formData.serialNumber || undefined,
      luggageBrand: formData.luggageBrand || undefined,
      luggageSize: formData.luggageSize || undefined,
      isSealed: formData.isSealed,
      isLocked: formData.isLocked,
    });
  };

  const handleEditItem = (item: ManifestItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      estimatedValue: item.estimatedValue?.toString() ?? '',
      serialNumber: item.serialNumber ?? '',
      luggageBrand: item.luggageBrand ?? '',
      luggageSize: item.luggageSize ?? '',
      isSealed: item.isSealed ?? false,
      isLocked: item.isLocked ?? false,
    });
    setShowEditItemDialog(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !formData.name.trim()) {
      toast({
        title: t('error'),
        description: 'Item name is required',
        variant: 'destructive',
      });
      return;
    }
    updateItemMutation.mutate({ 
      id: editingItem.id, 
      data: {
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity) || 1,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        serialNumber: formData.serialNumber || undefined,
        luggageBrand: formData.luggageBrand || undefined,
        luggageSize: formData.luggageSize || undefined,
        isSealed: formData.isSealed,
        isLocked: formData.isLocked,
      }
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setDeletingItemId(itemId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingItemId) {
      deleteItemMutation.mutate(deletingItemId);
    }
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
                      luggageBrand={item.luggageBrand}
                      luggageSize={item.luggageSize}
                      isSealed={item.isSealed}
                      isLocked={item.isLocked}
                      onEdit={() => handleEditItem(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>

                {generatedHash && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Certificado Generado
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hash SHA-256 para verificación:
                    </p>
                    <code className="block p-2 bg-background rounded text-xs break-all font-mono">
                      {generatedHash}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedHash);
                        toast({ title: 'Copiado', description: 'Hash copiado al portapapeles' });
                      }}
                      data-testid="button-copy-hash"
                    >
                      Copiar Hash
                    </Button>
                  </Card>
                )}

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
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">{t('estimatedValue')}</Label>
                <Input 
                  id="value" 
                  type="number" 
                  placeholder="0" 
                  data-testid="input-value"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
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
            
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Información de Maleta</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input 
                    id="brand" 
                    placeholder="Ej: Samsonite" 
                    data-testid="input-brand"
                    value={formData.luggageBrand}
                    onChange={(e) => setFormData({ ...formData, luggageBrand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Tamaño</Label>
                  <Select 
                    value={formData.luggageSize}
                    onValueChange={(value) => setFormData({ ...formData, luggageSize: value })}
                  >
                    <SelectTrigger data-testid="select-size">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeña (Cabina)</SelectItem>
                      <SelectItem value="medium">Mediana</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="xlarge">Extra Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sealed"
                    className="h-4 w-4 rounded border-input"
                    data-testid="checkbox-sealed"
                    checked={formData.isSealed}
                    onChange={(e) => setFormData({ ...formData, isSealed: e.target.checked })}
                  />
                  <Label htmlFor="sealed" className="font-normal cursor-pointer">
                    Sellada
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="locked"
                    className="h-4 w-4 rounded border-input"
                    data-testid="checkbox-locked"
                    checked={formData.isLocked}
                    onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                  />
                  <Label htmlFor="locked" className="font-normal cursor-pointer">
                    Con Candado
                  </Label>
                </div>
              </div>
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

      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Artículo</DialogTitle>
            <DialogDescription>
              Modifica los detalles de este artículo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editItemName">{t('itemName')}</Label>
              <Input 
                id="editItemName" 
                placeholder="Ej: Cámara Sony" 
                data-testid="input-edit-item-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategory">{t('category')}</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-edit-category">
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
                <Label htmlFor="editQuantity">{t('quantity')}</Label>
                <Input 
                  id="editQuantity" 
                  type="number" 
                  data-testid="input-edit-quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editValue">{t('estimatedValue')}</Label>
                <Input 
                  id="editValue" 
                  type="number" 
                  placeholder="0" 
                  data-testid="input-edit-value"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSerial">{t('serialNumber')}</Label>
              <Input 
                id="editSerial" 
                placeholder="Opcional" 
                data-testid="input-edit-serial"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Información de Maleta</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editBrand">Marca</Label>
                  <Input 
                    id="editBrand" 
                    placeholder="Ej: Samsonite" 
                    data-testid="input-edit-brand"
                    value={formData.luggageBrand}
                    onChange={(e) => setFormData({ ...formData, luggageBrand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSize">Tamaño</Label>
                  <Select 
                    value={formData.luggageSize}
                    onValueChange={(value) => setFormData({ ...formData, luggageSize: value })}
                  >
                    <SelectTrigger data-testid="select-edit-size">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeña (Cabina)</SelectItem>
                      <SelectItem value="medium">Mediana</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="xlarge">Extra Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editSealed"
                    className="h-4 w-4 rounded border-input"
                    data-testid="checkbox-edit-sealed"
                    checked={formData.isSealed}
                    onChange={(e) => setFormData({ ...formData, isSealed: e.target.checked })}
                  />
                  <Label htmlFor="editSealed" className="font-normal cursor-pointer">
                    Sellada
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editLocked"
                    className="h-4 w-4 rounded border-input"
                    data-testid="checkbox-edit-locked"
                    checked={formData.isLocked}
                    onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                  />
                  <Label htmlFor="editLocked" className="font-normal cursor-pointer">
                    Con Candado
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditItemDialog(false);
                setEditingItem(null);
              }}
              data-testid="button-cancel-edit"
              disabled={updateItemMutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleUpdateItem} 
              data-testid="button-update-item"
              disabled={updateItemMutation.isPending}
            >
              {updateItemMutation.isPending ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El artículo será eliminado permanentemente del manifiesto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              data-testid="button-cancel-delete"
              disabled={deleteItemMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete"
              disabled={deleteItemMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteItemMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}
