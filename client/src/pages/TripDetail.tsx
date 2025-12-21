import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTrip, useUpdateTripPhotos } from "@/hooks/useTrips";
import {
  useManifestItems,
  useCreateManifestItem,
  useUpdateManifestItem,
  useDeleteManifestItem,
} from "@/hooks/useManifestItems";
import { useGenerateCertificate } from "@/hooks/useCertificates";
import { useFlightCertificates } from "@/hooks/useFlightCertificates";
import type { ManifestItem } from "@shared/schema";
import { useTravelers, useCreateTraveler, useDeleteTraveler } from '@/hooks/useTravelers';
import TopAppBar from "@/components/TopAppBar";
import BottomNavigation from "@/components/BottomNavigation";
import ManifestItemCard from "@/components/ManifestItemCard";
import EmptyState from "@/components/EmptyState";
import ItineraryTab from "@/components/ItineraryTab";
import LuggageTab from "@/components/LuggageTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, MapPin, Calendar, Camera, X } from "lucide-react";
import beachImg from "@assets/generated_images/Beach_destination_photo_a88a2d29.png";
import {
  ITEM_CATEGORIES,
  LUGGAGE_BRANDS,
  LUGGAGE_TYPES,
  type ItemCategory,
} from "@/constants/manifestItems";

export default function TripDetail() {
  const { id: tripId } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLuggagePhotosDialog, setShowLuggagePhotosDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ManifestItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    customName: "",
    category: "electronics" as ItemCategory,
    quantity: "1",
    estimatedValue: "" as string,
    serialNumber: "",
    itemBrand: "",
    luggageType: "",
    luggageBrand: "",
    isSealed: false,
    isLocked: false,
  });
  const [showAddTravelerDialog, setShowAddTravelerDialog] = useState(false);
  const [travelerFormData, setTravelerFormData] = useState({
    name: '',
    type: 'adult' as 'adult' | 'child',
    age: '',
    relation: '',
    document: '',
  });
  const [showCustomName, setShowCustomName] = useState(false);
  const [luggagePhotos, setLuggagePhotos] = useState({
    openPhotoUrl: "",
    closedPhotoUrl: "",
  });

  const { uploadCertificate, uploading, uploadProgress } =
    useFlightCertificates();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  const { data: trip, isLoading: isTripLoading } = useTrip(tripId || null);
  const { data: items = [], isLoading: isItemsLoading } = useManifestItems(
    tripId || null,
  );
  const addItemMutation = useCreateManifestItem();
  const updateItemMutation = useUpdateManifestItem();
  const deleteItemMutation = useDeleteManifestItem();
  const generateCertificateMutation = useGenerateCertificate();
  const updateTripPhotosMutation = useUpdateTripPhotos();

  const { data: travelers = [] } = useTravelers(tripId || null);
  const createTravelerMutation = useCreateTraveler();
  const deleteTravelerMutation = useDeleteTraveler();

  useEffect(() => {
    if (trip) {
      setLuggagePhotos({
        openPhotoUrl: trip.openPhotoUrl || "",
        closedPhotoUrl: trip.closedPhotoUrl || "",
      });
    }
  }, [trip]);

  const totalValue = items.reduce(
    (sum, item) => sum + (item.estimatedValue || 0),
    0,
  );
  // Continúa desde PARTE 1...

  const handleOpenPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !tripId) return;

    try {
      const url = await uploadCertificate(file, tripId);
      setLuggagePhotos({ ...luggagePhotos, openPhotoUrl: url });
      await updateTripPhotosMutation.mutateAsync({
        tripId,
        openPhotoUrl: url,
      });
      toast({
        title: t("success"),
        description: "Foto de maleta abierta subida correctamente",
      });
    } catch (error) {
      console.error("Error uploading open photo:", error);
      toast({
        title: t("error"),
        description: "Error al subir la foto",
        variant: "destructive",
      });
    }
  };

  const handleClosedPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !tripId) return;

    try {
      const url = await uploadCertificate(file, tripId);
      setLuggagePhotos({ ...luggagePhotos, closedPhotoUrl: url });
      await updateTripPhotosMutation.mutateAsync({
        tripId,
        closedPhotoUrl: url,
      });
      toast({
        title: t("success"),
        description: "Foto de maleta cerrada subida correctamente",
      });
    } catch (error) {
      console.error("Error uploading closed photo:", error);
      toast({
        title: t("error"),
        description: "Error al subir la foto",
        variant: "destructive",
      });
    }
  };

  const handleRemoveOpenPhoto = async () => {
    if (!tripId) return;

    try {
      setLuggagePhotos({ ...luggagePhotos, openPhotoUrl: "" });
      await updateTripPhotosMutation.mutateAsync({
        tripId,
        openPhotoUrl: "",
      });
      toast({
        title: t("success"),
        description: "Foto eliminada",
      });
    } catch (error) {
      console.error("Error removing photo:", error);
      toast({
        title: t("error"),
        description: "Error al eliminar la foto",
        variant: "destructive",
      });
    }
  };

  const handleRemoveClosedPhoto = async () => {
    if (!tripId) return;

    try {
      setLuggagePhotos({ ...luggagePhotos, closedPhotoUrl: "" });
      await updateTripPhotosMutation.mutateAsync({
        tripId,
        closedPhotoUrl: "",
      });
      toast({
        title: t("success"),
        description: "Foto eliminada",
      });
    } catch (error) {
      console.error("Error removing photo:", error);
      toast({
        title: t("error"),
        description: "Error al eliminar la foto",
        variant: "destructive",
      });
    }
  };

  const handleAddTraveler = () => {
    if (!travelerFormData.name.trim() || !tripId) {
      toast({
        title: t('error'),
        description: 'El nombre es requerido',
        variant: 'destructive',
      });
      return;
    }

    const travelerData: any = {
      tripId,
      name: travelerFormData.name,
      type: travelerFormData.type,
      isMainTraveler: false,
    };

    if (travelerFormData.type === 'child') {
      if (travelerFormData.age) travelerData.age = parseInt(travelerFormData.age);
      if (travelerFormData.relation) travelerData.relation = travelerFormData.relation;
    }

    if (travelerFormData.document) travelerData.document = travelerFormData.document;

    createTravelerMutation.mutate(travelerData, {
      onSuccess: () => {
        toast({
          title: t('success'),
          description: 'Pasajero agregado correctamente',
        });
        setShowAddTravelerDialog(false);
        setTravelerFormData({
          name: '',
          type: 'adult',
          age: '',
          relation: '',
          document: '',
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
  };

  const handleDeleteTraveler = (travelerId: string) => {
    if (!tripId) return;

    deleteTravelerMutation.mutate(
      { id: travelerId, tripId },
      {
        onSuccess: () => {
          toast({
            title: t('success'),
            description: 'Pasajero eliminado',
          });
        },
        onError: (error: Error) => {
          toast({
            title: t('error'),
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleGenerateCertificate = () => {
    if (!trip || !user) return;

    const tripWithPhotos = {
      ...trip,
      openPhotoUrl: luggagePhotos.openPhotoUrl || null,
      closedPhotoUrl: luggagePhotos.closedPhotoUrl || null,
    };

    generateCertificateMutation.mutate(
      { trip: tripWithPhotos, items, user },
      {
        onSuccess: (data) => {
          setGeneratedHash(data.hash);

          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${data.pdf}`;
          link.download = `manifest-${tripId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: t("success"),
            description: t("certificateGenerated"),
          });
        },

        onError: (error: Error) => {
          toast({
            title: t("error"),
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleAddItem = () => {
    const itemName = showCustomName ? formData.customName : formData.name;

    if (!itemName.trim() || !tripId) {
      toast({
        title: t("error"),
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }

    const itemData: any = {
      tripId,
      name: itemName,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 1,
      isSealed: formData.isSealed,
      isLocked: formData.isLocked,
    };

    // Solo agregar campos opcionales si tienen valor (evitar undefined)
    if (formData.estimatedValue) {
      itemData.estimatedValue = parseFloat(formData.estimatedValue);
    }
    if (formData.serialNumber) {
      itemData.serialNumber = formData.serialNumber;
    }
    if (formData.itemBrand) {
      itemData.itemBrand = formData.itemBrand;
    }
    if (formData.luggageType) {
      itemData.luggageType = formData.luggageType;
    }
    if (formData.luggageBrand) {
      itemData.luggageBrand = formData.luggageBrand;
    }

    addItemMutation.mutate(
      itemData,
      {
        onSuccess: () => {
          toast({
            title: t("success"),
            description: t("itemAdded"),
          });
          setShowAddItemDialog(false);
          setShowCustomName(false);
          setFormData({
            name: "",
            customName: "",
            category: "electronics" as ItemCategory,
            quantity: "1",
            estimatedValue: "",
            serialNumber: "",
            itemBrand: "",
            luggageType: "",
            luggageBrand: "",
            isSealed: false,
            isLocked: false,
          });
        },
        onError: (error: Error) => {
          toast({
            title: t("error"),
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };
  // Continúa desde PARTE 2...

  const handleEditItem = (item: ManifestItem) => {
    setEditingItem(item);

    const categoryData = ITEM_CATEGORIES[item.category as ItemCategory];
    const isInSuggestions = categoryData?.suggestions.includes(item.name);

    setFormData({
      name: isInSuggestions ? item.name : "",
      customName: isInSuggestions ? "" : item.name,
      category: item.category as ItemCategory,
      quantity: item.quantity.toString(),
      estimatedValue: item.estimatedValue?.toString() ?? "",
      serialNumber: item.serialNumber ?? "",
      itemBrand: item.itemBrand ?? "",
      luggageType: item.luggageType ?? "",
      luggageBrand: item.luggageBrand ?? "",
      isSealed: item.isSealed ?? false,
      isLocked: item.isLocked ?? false,
    });

    setShowCustomName(!isInSuggestions);
    setShowEditItemDialog(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem) {
      toast({
        title: t("error"),
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }

    const itemName = showCustomName ? formData.customName : formData.name;

    if (!itemName.trim()) {
      toast({
        title: t("error"),
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {
      name: itemName,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 1,
      isSealed: formData.isSealed,
      isLocked: formData.isLocked,
    };

    // Solo agregar campos opcionales si tienen valor (evitar undefined)
    if (formData.estimatedValue) {
      updateData.estimatedValue = parseFloat(formData.estimatedValue);
    }
    if (formData.serialNumber) {
      updateData.serialNumber = formData.serialNumber;
    }
    if (formData.itemBrand) {
      updateData.itemBrand = formData.itemBrand;
    }
    if (formData.luggageType) {
      updateData.luggageType = formData.luggageType;
    }
    if (formData.luggageBrand) {
      updateData.luggageBrand = formData.luggageBrand;
    }

    updateItemMutation.mutate(
      {
        id: editingItem.id,
        data: updateData,
      },
      {
        onSuccess: () => {
          toast({
            title: t("success"),
            description: "Artículo actualizado",
          });
          setShowEditItemDialog(false);
          setEditingItem(null);
        },
        onError: (error: Error) => {
          toast({
            title: t("error"),
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setDeletingItemId(itemId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingItemId && tripId) {
      deleteItemMutation.mutate(
        { id: deletingItemId, tripId },
        {
          onSuccess: () => {
            toast({
              title: t("success"),
              description: "Artículo eliminado",
            });
            setShowDeleteConfirm(false);
            setDeletingItemId(null);
          },
          onError: (error: Error) => {
            toast({
              title: t("error"),
              description: error.message,
              variant: "destructive",
            });
          },
        },
      );
    }
  };
  // Continúa desde PARTE 3...

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

  if (isTripLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopAppBar title="" onBack={() => setLocation("/dashboard")} />
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
        <TopAppBar
          title="Trip Not Found"
          onBack={() => setLocation("/dashboard")}
        />
        <div className="p-4 max-w-7xl mx-auto">
          <EmptyState
            title="Trip not found"
            description="The trip you're looking for doesn't exist."
            actionLabel="Go to Dashboard"
            onAction={() => setLocation("/dashboard")}
          />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopAppBar title={trip.title} onBack={() => setLocation("/dashboard")} />

      <div className="relative h-48 overflow-hidden">
        <img
          src={trip.imageUrl || beachImg}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {trip.startDate} - {trip.endDate}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        <Tabs defaultValue="manifest" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="itinerary" data-testid="tab-itinerary">
              {t("itinerary")}
            </TabsTrigger>
            <TabsTrigger value="manifest" data-testid="tab-manifest">
              {t("manifest")}
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              {t("settings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary">
            <ItineraryTab tripId={tripId!} />
          </TabsContent>

          <TabsContent value="manifest" className="space-y-4">
            <LuggageTab tripId={tripId!} />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {items.length} {t("items")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("totalValue")}: ${totalValue.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={() => setShowAddItemDialog(true)}
                data-testid="button-add-item"
                disabled={addItemMutation.isPending}
              >
                {t("addItem")}
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
                title={t("noItems")}
                description={t("noItemsDescription")}
                actionLabel={t("addItem")}
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
                      luggageType={item.luggageType}
                      isSealed={item.isSealed}
                      isLocked={item.isLocked}
                      onEdit={() => handleEditItem(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>
                {/* Continúa desde PARTE 4... */}

                          {(luggagePhotos.openPhotoUrl ||
                            luggagePhotos.closedPhotoUrl) && (
                            <Card className="p-4 bg-primary/5 border-primary/20">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Fotos de Maleta
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                {luggagePhotos.openPhotoUrl && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Maleta Abierta
                                    </p>
                                    <img
                                      src={luggagePhotos.openPhotoUrl}
                                      alt="Maleta abierta"
                                      className="w-full h-32 object-cover rounded"
                                    />
                                  </div>
                                )}
                                {luggagePhotos.closedPhotoUrl && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Maleta Cerrada
                                    </p>
                                    <img
                                      src={luggagePhotos.closedPhotoUrl}
                                      alt="Maleta cerrada"
                                      className="w-full h-32 object-cover rounded"
                                    />
                                  </div>
                                )}
                              </div>
                            </Card>
                          )}

                          <Button
                            onClick={() => setShowLuggagePhotosDialog(true)}
                            variant="outline"
                            className="w-full gap-2"
                            data-testid="button-luggage-photos"
                          >
                            <Camera className="h-5 w-5" />
                            {luggagePhotos.openPhotoUrl || luggagePhotos.closedPhotoUrl
                              ? "Editar Fotos de Maleta"
                              : "Agregar Fotos de Maleta"}
                          </Button>

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
                                  toast({
                                    title: "Copiado",
                                    description: "Hash copiado al portapapeles",
                                  });
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
                            {generateCertificateMutation.isPending
                              ? t("generating")
                              : t("generateCertificate")}
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

                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">👥 Pasajeros</h3>
                          <Button 
                            onClick={() => setShowAddTravelerDialog(true)}
                            size="sm"
                          >
                            Agregar Pasajero
                          </Button>
                        </div>

                        {travelers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay pasajeros registrados. Agrega adultos o niños que viajarán.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {travelers.map((traveler) => (
                              <div 
                                key={traveler.id} 
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {traveler.type === 'adult' ? '👤' : '👶'} {traveler.name}
                                  </p>
                                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                    <span>{traveler.type === 'adult' ? 'Adulto' : 'Niño'}</span>
                                    {traveler.age && <span>• {traveler.age} años</span>}
                                    {traveler.relation && <span>• {traveler.relation}</span>}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTraveler(traveler.id)}
                                  disabled={deleteTravelerMutation.isPending}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
      {/* Continúa desde PARTE 5... */}

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addItem')}</DialogTitle>
            <DialogDescription>
              Añade un artículo a tu manifiesto de equipaje
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t('category')}</Label>
              <Select 
                value={formData.category}
                onValueChange={(value: ItemCategory) => {
                  setFormData({ ...formData, category: value, name: '' });
                  setShowCustomName(false);
                }}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ITEM_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">{t('itemName')}</Label>
              <Select 
                value={formData.name}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setShowCustomName(true);
                    setFormData({ ...formData, name: '' });
                  } else {
                    setShowCustomName(false);
                    setFormData({ ...formData, name: value, customName: '' });
                  }
                }}
              >
                <SelectTrigger data-testid="select-item-name">
                  <SelectValue placeholder="Selecciona un artículo" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES[formData.category].suggestions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">✏️ Otro (escribir)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showCustomName && (
              <div className="space-y-2">
                <Label htmlFor="customName">Nombre personalizado</Label>
                <Input 
                  id="customName" 
                  placeholder="Escribe el nombre del artículo" 
                  data-testid="input-custom-name"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                />
              </div>
            )}

            {ITEM_CATEGORIES[formData.category].brands.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="itemBrand">Marca del artículo</Label>
                <Select 
                  value={formData.itemBrand}
                  onValueChange={(value) => setFormData({ ...formData, itemBrand: value })}
                >
                  <SelectTrigger data-testid="select-item-brand">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES[formData.category].brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            {formData.category === 'electronics' && (
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
            )}

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">📦 ¿En qué maleta va este artículo?</h4>
              <div className="space-y-2">
                <Label htmlFor="luggageType">Tipo de maleta</Label>
                <Select 
                  value={formData.luggageType}
                  onValueChange={(value) => setFormData({ ...formData, luggageType: value })}
                >
                  <SelectTrigger data-testid="select-luggage-type">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {LUGGAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="luggageBrandSelect">Marca de la maleta</Label>
                <Select 
                  value={formData.luggageBrand}
                  onValueChange={(value) => setFormData({ ...formData, luggageBrand: value })}
                >
                  <SelectTrigger data-testid="select-luggage-brand">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {LUGGAGE_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              onClick={() => {
                setShowAddItemDialog(false);
                setShowCustomName(false);
              }}
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
      {/* Continúa desde PARTE 6... */}

      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artículo</DialogTitle>
            <DialogDescription>
              Modifica los detalles de este artículo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategory">{t('category')}</Label>
              <Select 
                value={formData.category}
                onValueChange={(value: ItemCategory) => {
                  setFormData({ ...formData, category: value, name: '' });
                  setShowCustomName(false);
                }}
              >
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ITEM_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editItemName">{t('itemName')}</Label>
              <Select 
                value={formData.name}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setShowCustomName(true);
                    setFormData({ ...formData, name: '' });
                  } else {
                    setShowCustomName(false);
                    setFormData({ ...formData, name: value, customName: '' });
                  }
                }}
              >
                <SelectTrigger data-testid="select-edit-item-name">
                  <SelectValue placeholder="Selecciona un artículo" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES[formData.category].suggestions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">✏️ Otro (escribir)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showCustomName && (
              <div className="space-y-2">
                <Label htmlFor="editCustomName">Nombre personalizado</Label>
                <Input 
                  id="editCustomName" 
                  placeholder="Escribe el nombre del artículo" 
                  data-testid="input-edit-custom-name"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                />
              </div>
            )}

            {ITEM_CATEGORIES[formData.category].brands.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="editItemBrand">Marca del artículo</Label>
                <Select 
                  value={formData.itemBrand}
                  onValueChange={(value) => setFormData({ ...formData, itemBrand: value })}
                >
                  <SelectTrigger data-testid="select-edit-item-brand">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES[formData.category].brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            {formData.category === 'electronics' && (
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
            )}

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">📦 ¿En qué maleta va este artículo?</h4>
              <div className="space-y-2">
                <Label htmlFor="editLuggageType">Tipo de maleta</Label>
                <Select 
                  value={formData.luggageType}
                  onValueChange={(value) => setFormData({ ...formData, luggageType: value })}
                >
                  <SelectTrigger data-testid="select-edit-luggage-type">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {LUGGAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLuggageBrandSelect">Marca de la maleta</Label>
                <Select 
                  value={formData.luggageBrand}
                  onValueChange={(value) => setFormData({ ...formData, luggageBrand: value })}
                >
                  <SelectTrigger data-testid="select-edit-luggage-brand">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {LUGGAGE_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                setShowCustomName(false);
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
      {/* Continúa desde PARTE 7... */}

            {/* 🆕 ESTE ES EL DIALOG QUE FALTABA - CAUSA DEL ERROR */}
            <Dialog open={showLuggagePhotosDialog} onOpenChange={setShowLuggagePhotosDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>📸 Fotos de Maleta</DialogTitle>
                  <DialogDescription>
                    Agrega fotos de tu maleta abierta y cerrada para el certificado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="openPhoto">Foto de Maleta Abierta</Label>
                    {luggagePhotos.openPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={luggagePhotos.openPhotoUrl}
                          alt="Maleta abierta"
                          className="w-full h-48 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveOpenPhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          id="openPhoto"
                          type="file"
                          accept="image/*"
                          onChange={handleOpenPhotoUpload}
                          className="hidden"
                        />
                        <Label
                          htmlFor="openPhoto"
                          className="cursor-pointer text-sm text-primary hover:underline"
                        >
                          Subir foto de maleta abierta
                        </Label>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closedPhoto">Foto de Maleta Cerrada</Label>
                    {luggagePhotos.closedPhotoUrl ? (
                      <div className="relative">
                        <img
                          src={luggagePhotos.closedPhotoUrl}
                          alt="Maleta cerrada"
                          className="w-full h-48 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveClosedPhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          id="closedPhoto"
                          type="file"
                          accept="image/*"
                          onChange={handleClosedPhotoUpload}
                          className="hidden"
                        />
                        <Label
                          htmlFor="closedPhoto"
                          className="cursor-pointer text-sm text-primary hover:underline"
                        >
                          Subir foto de maleta cerrada
                        </Label>
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Subiendo...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowLuggagePhotosDialog(false)}
                  >
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddTravelerDialog} onOpenChange={setShowAddTravelerDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Pasajero</DialogTitle>
                  <DialogDescription>
                    Agrega un adulto o niño que viajará en este viaje
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="travelerType">Tipo de Pasajero</Label>
                    <Select 
                      value={travelerFormData.type}
                      onValueChange={(value: 'adult' | 'child') => 
                        setTravelerFormData({ ...travelerFormData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adult">👤 Adulto</SelectItem>
                        <SelectItem value="child">👶 Niño/a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travelerName">Nombre Completo</Label>
                    <Input 
                      id="travelerName" 
                      placeholder="Ej: Juan Pérez" 
                      value={travelerFormData.name}
                      onChange={(e) => setTravelerFormData({ ...travelerFormData, name: e.target.value })}
                    />
                  </div>

                  {travelerFormData.type === 'child' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="travelerAge">Edad</Label>
                        <Input 
                          id="travelerAge" 
                          type="number" 
                          placeholder="Ej: 8" 
                          value={travelerFormData.age}
                          onChange={(e) => setTravelerFormData({ ...travelerFormData, age: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="travelerRelation">Relación</Label>
                        <Input 
                          id="travelerRelation" 
                          placeholder="Ej: Hijo, Hija, Sobrino" 
                          value={travelerFormData.relation}
                          onChange={(e) => setTravelerFormData({ ...travelerFormData, relation: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="travelerDocument">Documento (Opcional)</Label>
                    <Input 
                      id="travelerDocument" 
                      placeholder="Pasaporte o DNI" 
                      value={travelerFormData.document}
                      onChange={(e) => setTravelerFormData({ ...travelerFormData, document: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddTravelerDialog(false)}
                    disabled={createTravelerMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddTraveler}
                    disabled={createTravelerMutation.isPending}
                  >
                    {createTravelerMutation.isPending ? 'Agregando...' : 'Agregar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El artículo será eliminado
                    permanentemente del manifiesto.
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
                    {deleteItemMutation.isPending ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <BottomNavigation />
          </div>
        );
      }