import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTrip, useUpdateTripPhotos } from "@/hooks/useTrips";
import { useFlightCertificates } from "@/hooks/useFlightCertificates";
import { useTravelers, useCreateTraveler, useDeleteTraveler } from '@/hooks/useTravelers';
import TopAppBar from "@/components/TopAppBar";
import BottomNavigation from "@/components/BottomNavigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Calendar, Camera, X } from "lucide-react";
import beachImg from "@assets/generated_images/Beach_destination_photo_a88a2d29.png";

export default function TripDetail() {
  const { id: tripId } = useParams();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showLuggagePhotosDialog, setShowLuggagePhotosDialog] = useState(false);
  const [showAddTravelerDialog, setShowAddTravelerDialog] = useState(false);
  const [travelerFormData, setTravelerFormData] = useState({
    name: '',
    type: 'adult' as 'adult' | 'child',
    age: '',
    relation: '',
    document: '',
  });
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
  const updateTripPhotosMutation = useUpdateTripPhotos();

  const { data: travelers = [] } = useTravelers(tripId || null);
  const createTravelerMutation = useCreateTraveler();
  const deleteTravelerMutation = useDeleteTraveler();

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
            <LuggageTab 
              tripId={tripId!} 
              trip={trip || null}
              user={user ? { name: user.name || 'Usuario', email: user.email || '' } : null}
            />
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


            <BottomNavigation />
          </div>
        );
      }