import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { 
  useFlights, 
  useCreateFlight, 
  useDeleteFlight,
  useHotels,
  useCreateHotel,
  useDeleteHotel,
  useTransport,
  useCreateTransport,
  useDeleteTransport,
  useRestaurants,
  useCreateRestaurant,
  useDeleteRestaurant,
  useActivities,
  useCreateActivity,
  useDeleteActivity
} from '@/hooks/useItineraries';
import { useFlightCertificates } from '@/hooks/useFlightCertificates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plane, Hotel, Train, UtensilsCrossed, CalendarDays, ChevronDown, Plus, Trash2, Camera } from 'lucide-react';

interface ItineraryTabProps {
  tripId: string;
}

export default function ItineraryTab({ tripId }: ItineraryTabProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { uploadCertificate, uploading } = useFlightCertificates();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isFlightDialogOpen, setIsFlightDialogOpen] = useState(false);
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  const { data: flights = [] } = useFlights(tripId);
  const { data: hotels = [] } = useHotels(tripId);
  const { data: transport = [] } = useTransport(tripId);
  const { data: restaurants = [] } = useRestaurants(tripId);
  const { data: activities = [] } = useActivities(tripId);

  const [flightForm, setFlightForm] = useState({
    airline: '',
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    departureDateTime: '',
    arrivalDateTime: '',
    notes: '',
  });

  const createFlightMutation = useCreateFlight();
  const deleteFlightMutation = useDeleteFlight();

  const [hotelForm, setHotelForm] = useState({
    name: '',
    address: '',
    checkInDate: '',
    checkOutDate: '',
    reservationLink: '',
    notes: '',
  });

  const createHotelMutation = useCreateHotel();
  const deleteHotelMutation = useDeleteHotel();

  const [transportForm, setTransportForm] = useState({
    type: 'train' as 'train' | 'bus' | 'ferry',
    company: '',
    route: '',
    departureDateTime: '',
    arrivalDateTime: '',
    ticketNumber: '',
    notes: '',
  });

  const createTransportMutation = useCreateTransport();
  const deleteTransportMutation = useDeleteTransport();

  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    address: '',
    reservationDateTime: '',
    placeLink: '',
    notes: '',
  });

  const createRestaurantMutation = useCreateRestaurant();
  const deleteRestaurantMutation = useDeleteRestaurant();

  const [activityForm, setActivityForm] = useState({
    name: '',
    location: '',
    activityDateTime: '',
    notes: '',
  });

  const createActivityMutation = useCreateActivity();
  const deleteActivityMutation = useDeleteActivity();

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <Collapsible defaultOpen>
        <Card className="p-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Plane className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{t('flights')}</h3>
              <span className="text-sm text-muted-foreground">({flights.length})</span>
            </div>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              {flights.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noFlights')}</p>
              ) : (
                flights.map((flight) => (
                  <Card key={flight.id} className="p-4" data-testid={`flight-card-${flight.id}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-semibold">{flight.airline} {flight.flightNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                          {flight.departureAirport} → {flight.arrivalAirport}
                        </p>
                        <p className="text-sm">{formatDateTime(flight.departureDateTime)} - {formatDateTime(flight.arrivalDateTime)}</p>
                        {flight.notes && <p className="text-sm text-muted-foreground">{flight.notes}</p>}
                        {flight.certificateUrl && (
                          <div className="mt-2">
                            <img 
                              src={flight.certificateUrl} 
                              alt="Certificado de vuelo" 
                              className="w-full max-w-xs rounded-md border"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFlightMutation.mutate(
                          { id: flight.id, tripId },
                          {
                            onSuccess: () => {
                              toast({ title: t('success'), description: t('flightDeleted') || 'Vuelo eliminado' });
                            },
                          }
                        )}
                        data-testid={`button-delete-flight-${flight.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}

              <Dialog open={isFlightDialogOpen} onOpenChange={setIsFlightDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-add-flight">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addFlight')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('addFlight')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t('airline')}</Label>
                      <Input
                        value={flightForm.airline}
                        onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })}
                        data-testid="input-airline"
                      />
                    </div>
                    <div>
                      <Label>{t('flightNumber')}</Label>
                      <Input
                        value={flightForm.flightNumber}
                        onChange={(e) => setFlightForm({ ...flightForm, flightNumber: e.target.value })}
                        data-testid="input-flight-number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('departureAirport')}</Label>
                        <Input
                          value={flightForm.departureAirport}
                          onChange={(e) => setFlightForm({ ...flightForm, departureAirport: e.target.value })}
                          data-testid="input-departure-airport"
                        />
                      </div>
                      <div>
                        <Label>{t('arrivalAirport')}</Label>
                        <Input
                          value={flightForm.arrivalAirport}
                          onChange={(e) => setFlightForm({ ...flightForm, arrivalAirport: e.target.value })}
                          data-testid="input-arrival-airport"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('departureDateTime')}</Label>
                        <Input
                          type="datetime-local"
                          value={flightForm.departureDateTime}
                          onChange={(e) => setFlightForm({ ...flightForm, departureDateTime: e.target.value })}
                          data-testid="input-departure-datetime"
                        />
                      </div>
                      <div>
                        <Label>{t('arrivalDateTime')}</Label>
                        <Input
                          type="datetime-local"
                          value={flightForm.arrivalDateTime}
                          onChange={(e) => setFlightForm({ ...flightForm, arrivalDateTime: e.target.value })}
                          data-testid="input-arrival-datetime"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t('notes')}</Label>
                      <Textarea
                        value={flightForm.notes}
                        onChange={(e) => setFlightForm({ ...flightForm, notes: e.target.value })}
                        data-testid="input-flight-notes"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        {t('flightCertificate')}
                      </Label>
                      <div>
                        <input
                          ref={(el) => {
                            if (el) el.setAttribute('data-testid', 'input-flight-certificate');
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="flight-certificate-input"
                        />
                        <label
                          htmlFor="flight-certificate-input"
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          {selectedFile ? selectedFile.name : t('uploadPhoto')}
                        </label>
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          let certificateUrl = '';
                          if (selectedFile) {
                            const tempId = Date.now().toString();
                            certificateUrl = await uploadCertificate(selectedFile, tempId);
                          }
                          createFlightMutation.mutate(
                            { tripId, ...flightForm, certificateUrl },
                            {
                              onSuccess: () => {
                                setFlightForm({ airline: '', flightNumber: '', departureAirport: '', arrivalAirport: '', departureDateTime: '', arrivalDateTime: '', notes: '' });
                                setSelectedFile(null);
                                setIsFlightDialogOpen(false);
                                toast({ title: t('success'), description: t('flightAdded') });
                              },
                            }
                          );
                        } catch (error) {
                          toast({ title: t('error'), description: 'Error al subir la foto', variant: 'destructive' });
                        }
                      }}
                      disabled={createFlightMutation.isPending || uploading || !flightForm.airline || !flightForm.flightNumber || !flightForm.departureDateTime}
                      className="w-full"
                      data-testid="button-save-flight"
                    >
                      {uploading ? 'Subiendo foto...' : t('save')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <Collapsible defaultOpen>
        <Card className="p-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Hotel className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotels')}</h3>
              <span className="text-sm text-muted-foreground">({hotels.length})</span>
            </div>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              {hotels.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noHotels')}</p>
              ) : (
                hotels.map((hotel) => (
                  <Card key={hotel.id} className="p-4" data-testid={`hotel-card-${hotel.id}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{hotel.name}</h4>
                        <p className="text-sm text-muted-foreground">{hotel.address}</p>
                        <p className="text-sm">
                          {t('checkIn')}: {new Date(hotel.checkInDate).toLocaleDateString()} - 
                          {t('checkOut')}: {new Date(hotel.checkOutDate).toLocaleDateString()}
                        </p>
                        {hotel.reservationLink && (
                          <a href={hotel.reservationLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            {t('reservationLink')}
                          </a>
                        )}
                        {hotel.notes && <p className="text-sm text-muted-foreground">{hotel.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHotelMutation.mutate(
                          { id: hotel.id, tripId },
                          {
                            onSuccess: () => {
                              toast({ title: t('success'), description: t('hotelDeleted') || 'Hotel eliminado' });
                            },
                          }
                        )}
                        data-testid={`button-delete-hotel-${hotel.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}

              <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-add-hotel">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addHotel')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('addHotel')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t('hotelName')}</Label>
                      <Input
                        value={hotelForm.name}
                        onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                        data-testid="input-hotel-name"
                      />
                    </div>
                    <div>
                      <Label>{t('address')}</Label>
                      <Input
                        value={hotelForm.address}
                        onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                        data-testid="input-hotel-address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('checkIn')}</Label>
                        <Input
                          type="date"
                          value={hotelForm.checkInDate}
                          onChange={(e) => setHotelForm({ ...hotelForm, checkInDate: e.target.value })}
                          data-testid="input-check-in"
                        />
                      </div>
                      <div>
                        <Label>{t('checkOut')}</Label>
                        <Input
                          type="date"
                          value={hotelForm.checkOutDate}
                          onChange={(e) => setHotelForm({ ...hotelForm, checkOutDate: e.target.value })}
                          data-testid="input-check-out"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t('reservationLink')}</Label>
                      <Input
                        value={hotelForm.reservationLink}
                        onChange={(e) => setHotelForm({ ...hotelForm, reservationLink: e.target.value })}
                        data-testid="input-reservation-link"
                      />
                    </div>
                    <div>
                      <Label>{t('notes')}</Label>
                      <Textarea
                        value={hotelForm.notes}
                        onChange={(e) => setHotelForm({ ...hotelForm, notes: e.target.value })}
                        data-testid="input-hotel-notes"
                      />
                    </div>
                    <Button
                      onClick={() => createHotelMutation.mutate(
                        { tripId, ...hotelForm },
                        {
                          onSuccess: () => {
                            setHotelForm({ name: '', address: '', checkInDate: '', checkOutDate: '', reservationLink: '', notes: '' });
                            setIsHotelDialogOpen(false);
                            toast({ title: t('success'), description: t('hotelAdded') || 'Hotel agregado' });
                          },
                        }
                      )}
                      disabled={createHotelMutation.isPending || !hotelForm.name || !hotelForm.address || !hotelForm.checkInDate || !hotelForm.checkOutDate}
                      className="w-full"
                      data-testid="button-save-hotel"
                    >
                      {t('save')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen>
        <Card className="p-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Train className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{t('transport')}</h3>
              <span className="text-sm text-muted-foreground">({transport.length})</span>
            </div>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              {transport.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noTransport')}</p>
              ) : (
                transport.map((item) => (
                  <Card key={item.id} className="p-4" data-testid={`transport-card-${item.id}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{item.company} ({t(item.type)})</h4>
                        <p className="text-sm text-muted-foreground">{item.route}</p>
                        <p className="text-sm">{formatDateTime(item.departureDateTime)}</p>
                        {item.arrivalDateTime && <p className="text-sm">{formatDateTime(item.arrivalDateTime)}</p>}
                        {item.ticketNumber && <p className="text-sm">Ticket: {item.ticketNumber}</p>}
                        {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTransportMutation.mutate(
                          { id: item.id, tripId },
                          {
                            onSuccess: () => {
                              toast({ title: t('success'), description: t('transportDeleted') || 'Transporte eliminado' });
                            },
                          }
                        )}
                        data-testid={`button-delete-transport-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}

              <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-add-transport">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addTransport')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('addTransport')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t('transportType')}</Label>
                      <Select value={transportForm.type} onValueChange={(value: 'train' | 'bus' | 'ferry') => setTransportForm({ ...transportForm, type: value })}>
                        <SelectTrigger data-testid="select-transport-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="train">{t('train')}</SelectItem>
                          <SelectItem value="bus">{t('bus')}</SelectItem>
                          <SelectItem value="ferry">{t('ferry')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('company')}</Label>
                      <Input
                        value={transportForm.company}
                        onChange={(e) => setTransportForm({ ...transportForm, company: e.target.value })}
                        data-testid="input-transport-company"
                      />
                    </div>
                    <div>
                      <Label>{t('route')}</Label>
                      <Input
                        value={transportForm.route}
                        onChange={(e) => setTransportForm({ ...transportForm, route: e.target.value })}
                        placeholder="Madrid - Barcelona"
                        data-testid="input-transport-route"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('departureDateTime')}</Label>
                        <Input
                          type="datetime-local"
                          value={transportForm.departureDateTime}
                          onChange={(e) => setTransportForm({ ...transportForm, departureDateTime: e.target.value })}
                          data-testid="input-transport-departure"
                        />
                      </div>
                      <div>
                        <Label>{t('arrivalDateTime')}</Label>
                        <Input
                          type="datetime-local"
                          value={transportForm.arrivalDateTime}
                          onChange={(e) => setTransportForm({ ...transportForm, arrivalDateTime: e.target.value })}
                          data-testid="input-transport-arrival"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t('ticketNumber')}</Label>
                      <Input
                        value={transportForm.ticketNumber}
                        onChange={(e) => setTransportForm({ ...transportForm, ticketNumber: e.target.value })}
                        data-testid="input-ticket-number"
                      />
                    </div>
                    <div>
                      <Label>{t('notes')}</Label>
                      <Textarea
                        value={transportForm.notes}
                        onChange={(e) => setTransportForm({ ...transportForm, notes: e.target.value })}
                        data-testid="input-transport-notes"
                      />
                    </div>
                    <Button
                      onClick={() => createTransportMutation.mutate(
                        { tripId, ...transportForm },
                        {
                          onSuccess: () => {
                            setTransportForm({ type: 'train', company: '', route: '', departureDateTime: '', arrivalDateTime: '', ticketNumber: '', notes: '' });
                            setIsTransportDialogOpen(false);
                            toast({ title: t('success'), description: t('transportAdded') || 'Transporte agregado' });
                          },
                        }
                      )}
                      disabled={createTransportMutation.isPending || !transportForm.company || !transportForm.route || !transportForm.departureDateTime}
                      className="w-full"
                      data-testid="button-save-transport"
                    >
                      {t('save')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <Collapsible defaultOpen>
        <Card className="p-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{t('restaurants')}</h3>
              <span className="text-sm text-muted-foreground">({restaurants.length})</span>
            </div>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              {restaurants.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noRestaurants')}</p>
              ) : (
                restaurants.map((restaurant) => (
                  <Card key={restaurant.id} className="p-4" data-testid={`restaurant-card-${restaurant.id}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{restaurant.name}</h4>
                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                        <p className="text-sm">{formatDateTime(restaurant.reservationDateTime)}</p>
                        {restaurant.placeLink && (
                          <a href={restaurant.placeLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            {t('placeLink')}
                          </a>
                        )}
                        {restaurant.notes && <p className="text-sm text-muted-foreground">{restaurant.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRestaurantMutation.mutate(
                          { id: restaurant.id, tripId },
                          {
                            onSuccess: () => {
                              toast({ title: t('success'), description: t('restaurantDeleted') || 'Restaurante eliminado' });
                            },
                          }
                        )}
                        data-testid={`button-delete-restaurant-${restaurant.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}

              <Dialog open={isRestaurantDialogOpen} onOpenChange={setIsRestaurantDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-add-restaurant">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addRestaurant')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('addRestaurant')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t('restaurantName')}</Label>
                      <Input
                        value={restaurantForm.name}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                        data-testid="input-restaurant-name"
                      />
                    </div>
                    <div>
                      <Label>{t('address')}</Label>
                      <Input
                        value={restaurantForm.address}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                        data-testid="input-restaurant-address"
                      />
                    </div>
                    <div>
                      <Label>{t('reservationTime')}</Label>
                      <Input
                        type="datetime-local"
                        value={restaurantForm.reservationDateTime}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, reservationDateTime: e.target.value })}
                        data-testid="input-reservation-datetime"
                      />
                    </div>
                    <div>
                      <Label>{t('placeLink')}</Label>
                      <Input
                        value={restaurantForm.placeLink}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, placeLink: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        data-testid="input-place-link"
                      />
                    </div>
                    <div>
                      <Label>{t('notes')}</Label>
                      <Textarea
                        value={restaurantForm.notes}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, notes: e.target.value })}
                        data-testid="input-restaurant-notes"
                      />
                    </div>
                    <Button
                      onClick={() => createRestaurantMutation.mutate(
                        { tripId, ...restaurantForm },
                        {
                          onSuccess: () => {
                            setRestaurantForm({ name: '', address: '', reservationDateTime: '', placeLink: '', notes: '' });
                            setIsRestaurantDialogOpen(false);
                            toast({ title: t('success'), description: t('restaurantAdded') || 'Restaurante agregado' });
                          },
                        }
                      )}
                      disabled={createRestaurantMutation.isPending || !restaurantForm.name || !restaurantForm.address || !restaurantForm.reservationDateTime}
                      className="w-full"
                      data-testid="button-save-restaurant"
                    >
                      {t('save')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <Collapsible defaultOpen>
              <Card className="p-6">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold">{t('activities')}</h3>
                    <span className="text-sm text-muted-foreground">({activities.length})</span>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4">
                    {activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noActivities')}</p>
                    ) : (
                      activities.map((activity) => (
                        <Card key={activity.id} className="p-4" data-testid={`activity-card-${activity.id}`}>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-semibold">{activity.name}</h4>
                              <p className="text-sm text-muted-foreground">{activity.location}</p>
                              <p className="text-sm">{formatDateTime(activity.activityDateTime)}</p>
                              {activity.notes && <p className="text-sm text-muted-foreground">{activity.notes}</p>}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteActivityMutation.mutate(
                                { id: activity.id, tripId },
                                {
                                  onSuccess: () => {
                                    toast({ title: t('success'), description: t('activityDeleted') || 'Actividad eliminada' });
                                  },
                                }
                              )}
                              data-testid={`button-delete-activity-${activity.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}

                    <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" data-testid="button-add-activity">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('addActivity')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('addActivity')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{t('activityName')}</Label>
                            <Input
                              value={activityForm.name}
                              onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                              data-testid="input-activity-name"
                            />
                          </div>
                          <div>
                            <Label>{t('location')}</Label>
                            <Input
                              value={activityForm.location}
                              onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                              data-testid="input-activity-location"
                            />
                          </div>
                          <div>
                            <Label>{t('activityTime')}</Label>
                            <Input
                              type="datetime-local"
                              value={activityForm.activityDateTime}
                              onChange={(e) => setActivityForm({ ...activityForm, activityDateTime: e.target.value })}
                              data-testid="input-activity-datetime"
                            />
                          </div>
                          <div>
                            <Label>{t('notes')}</Label>
                            <Textarea
                              value={activityForm.notes}
                              onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                              data-testid="input-activity-notes"
                            />
                          </div>
                          <Button
                            onClick={() => createActivityMutation.mutate(
                              { tripId, ...activityForm },
                              {
                                onSuccess: () => {
                                  setActivityForm({ name: '', location: '', activityDateTime: '', notes: '' });
                                  setIsActivityDialogOpen(false);
                                  toast({ title: t('success'), description: t('activityAdded') || 'Actividad agregada' });
                                },
                              }
                            )}
                            disabled={createActivityMutation.isPending || !activityForm.name || !activityForm.location || !activityForm.activityDateTime}
                            className="w-full"
                            data-testid="button-save-activity"
                          >
                            {t('save')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        );
      }