import { 
  type User, 
  type InsertUser,
  type Trip,
  type InsertTrip,
  type ManifestItem,
  type InsertManifestItem,
  type ManifestCertificate,
  type InsertManifestCertificate,
  type Flight,
  type InsertFlight,
  type Hotel,
  type InsertHotel,
  type Transport,
  type InsertTransport,
  type Restaurant,
  type InsertRestaurant,
  type Activity,
  type InsertActivity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trip methods
  getTrip(id: string): Promise<Trip | undefined>;
  getTripsByUserId(userId: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: string): Promise<boolean>;

  // Manifest Item methods
  getManifestItem(id: string): Promise<ManifestItem | undefined>;
  getManifestItemsByTripId(tripId: string): Promise<ManifestItem[]>;
  createManifestItem(item: InsertManifestItem): Promise<ManifestItem>;
  updateManifestItem(id: string, item: Partial<InsertManifestItem>): Promise<ManifestItem | undefined>;
  deleteManifestItem(id: string): Promise<boolean>;

  // Certificate methods
  createCertificate(cert: InsertManifestCertificate): Promise<ManifestCertificate>;
  getCertificateByHash(hash: string): Promise<ManifestCertificate | undefined>;
  getCertificatesByTripId(tripId: string): Promise<ManifestCertificate[]>;

  // Flight methods
  getFlight(id: string): Promise<Flight | undefined>;
  getFlightsByTripId(tripId: string): Promise<Flight[]>;
  createFlight(flight: InsertFlight): Promise<Flight>;
  updateFlight(id: string, flight: Partial<InsertFlight>): Promise<Flight | undefined>;
  deleteFlight(id: string): Promise<boolean>;

  // Hotel methods
  getHotel(id: string): Promise<Hotel | undefined>;
  getHotelsByTripId(tripId: string): Promise<Hotel[]>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: string): Promise<boolean>;

  // Transport methods
  getTransport(id: string): Promise<Transport | undefined>;
  getTransportByTripId(tripId: string): Promise<Transport[]>;
  createTransport(transport: InsertTransport): Promise<Transport>;
  updateTransport(id: string, transport: Partial<InsertTransport>): Promise<Transport | undefined>;
  deleteTransport(id: string): Promise<boolean>;

  // Restaurant methods
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantsByTripId(tripId: string): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: string): Promise<boolean>;

  // Activity methods
  getActivity(id: string): Promise<Activity | undefined>;
  getActivitiesByTripId(tripId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private trips: Map<string, Trip>;
  private manifestItems: Map<string, ManifestItem>;
  private certificates: Map<string, ManifestCertificate>;
  private flights: Map<string, Flight>;
  private hotels: Map<string, Hotel>;
  private transport: Map<string, Transport>;
  private restaurants: Map<string, Restaurant>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.manifestItems = new Map();
    this.certificates = new Map();
    this.flights = new Map();
    this.hotels = new Map();
    this.transport = new Map();
    this.restaurants = new Map();
    this.activities = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Trip methods
  async getTrip(id: string): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getTripsByUserId(userId: string): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .filter(trip => trip.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = randomUUID();
    const trip: Trip = { 
      ...insertTrip,
      id,
      imageUrl: insertTrip.imageUrl ?? null,
      notes: insertTrip.notes ?? null,
      createdAt: new Date()
    };
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: string, update: Partial<InsertTrip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updated = { ...trip, ...update };
    this.trips.set(id, updated);
    return updated;
  }

  async deleteTrip(id: string): Promise<boolean> {
    return this.trips.delete(id);
  }

  // Manifest Item methods
  async getManifestItem(id: string): Promise<ManifestItem | undefined> {
    return this.manifestItems.get(id);
  }

  async getManifestItemsByTripId(tripId: string): Promise<ManifestItem[]> {
    return Array.from(this.manifestItems.values())
      .filter(item => item.tripId === tripId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createManifestItem(insertItem: InsertManifestItem): Promise<ManifestItem> {
    const id = randomUUID();
    const item: ManifestItem = { 
      ...insertItem,
      id,
      quantity: insertItem.quantity ?? 1,
      estimatedValue: insertItem.estimatedValue ?? null,
      serialNumber: insertItem.serialNumber ?? null,
      imageUrl: insertItem.imageUrl ?? null,
      luggageBrand: insertItem.luggageBrand ?? null,
      luggageSize: insertItem.luggageSize ?? null,
      isSealed: insertItem.isSealed ?? false,
      isLocked: insertItem.isLocked ?? false,
      createdAt: new Date()
    };
    this.manifestItems.set(id, item);
    return item;
  }

  async updateManifestItem(id: string, update: Partial<InsertManifestItem>): Promise<ManifestItem | undefined> {
    const item = this.manifestItems.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...update };
    this.manifestItems.set(id, updated);
    return updated;
  }

  async deleteManifestItem(id: string): Promise<boolean> {
    return this.manifestItems.delete(id);
  }

  // Certificate methods
  async createCertificate(insertCert: InsertManifestCertificate): Promise<ManifestCertificate> {
    const id = randomUUID();
    const cert: ManifestCertificate = { 
      ...insertCert,
      id,
      totalValue: insertCert.totalValue ?? null,
      verified: insertCert.verified ?? true,
      createdAt: new Date()
    };
    this.certificates.set(id, cert);
    return cert;
  }

  async getCertificateByHash(hash: string): Promise<ManifestCertificate | undefined> {
    return Array.from(this.certificates.values()).find(cert => cert.hash === hash);
  }

  async getCertificatesByTripId(tripId: string): Promise<ManifestCertificate[]> {
    return Array.from(this.certificates.values())
      .filter(cert => cert.tripId === tripId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Flight methods
  async getFlight(id: string): Promise<Flight | undefined> {
    return this.flights.get(id);
  }

  async getFlightsByTripId(tripId: string): Promise<Flight[]> {
    return Array.from(this.flights.values())
      .filter(flight => flight.tripId === tripId)
      .sort((a, b) => new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime());
  }

  async createFlight(insertFlight: InsertFlight): Promise<Flight> {
    const id = randomUUID();
    const flight: Flight = { 
      ...insertFlight,
      id,
      notes: insertFlight.notes ?? null,
      createdAt: new Date()
    };
    this.flights.set(id, flight);
    return flight;
  }

  async updateFlight(id: string, update: Partial<InsertFlight>): Promise<Flight | undefined> {
    const flight = this.flights.get(id);
    if (!flight) return undefined;
    
    const updated = { ...flight, ...update };
    this.flights.set(id, updated);
    return updated;
  }

  async deleteFlight(id: string): Promise<boolean> {
    return this.flights.delete(id);
  }

  // Hotel methods
  async getHotel(id: string): Promise<Hotel | undefined> {
    return this.hotels.get(id);
  }

  async getHotelsByTripId(tripId: string): Promise<Hotel[]> {
    return Array.from(this.hotels.values())
      .filter(hotel => hotel.tripId === tripId)
      .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const id = randomUUID();
    const hotel: Hotel = { 
      ...insertHotel,
      id,
      reservationLink: insertHotel.reservationLink ?? null,
      notes: insertHotel.notes ?? null,
      createdAt: new Date()
    };
    this.hotels.set(id, hotel);
    return hotel;
  }

  async updateHotel(id: string, update: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const hotel = this.hotels.get(id);
    if (!hotel) return undefined;
    
    const updated = { ...hotel, ...update };
    this.hotels.set(id, updated);
    return updated;
  }

  async deleteHotel(id: string): Promise<boolean> {
    return this.hotels.delete(id);
  }

  // Transport methods
  async getTransport(id: string): Promise<Transport | undefined> {
    return this.transport.get(id);
  }

  async getTransportByTripId(tripId: string): Promise<Transport[]> {
    return Array.from(this.transport.values())
      .filter(t => t.tripId === tripId)
      .sort((a, b) => new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime());
  }

  async createTransport(insertTransport: InsertTransport): Promise<Transport> {
    const id = randomUUID();
    const transport: Transport = { 
      ...insertTransport,
      id,
      arrivalDateTime: insertTransport.arrivalDateTime ?? null,
      ticketNumber: insertTransport.ticketNumber ?? null,
      notes: insertTransport.notes ?? null,
      createdAt: new Date()
    };
    this.transport.set(id, transport);
    return transport;
  }

  async updateTransport(id: string, update: Partial<InsertTransport>): Promise<Transport | undefined> {
    const transport = this.transport.get(id);
    if (!transport) return undefined;
    
    const updated = { ...transport, ...update };
    this.transport.set(id, updated);
    return updated;
  }

  async deleteTransport(id: string): Promise<boolean> {
    return this.transport.delete(id);
  }

  // Restaurant methods
  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurantsByTripId(tripId: string): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values())
      .filter(r => r.tripId === tripId)
      .sort((a, b) => new Date(a.reservationDateTime).getTime() - new Date(b.reservationDateTime).getTime());
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = randomUUID();
    const restaurant: Restaurant = { 
      ...insertRestaurant,
      id,
      placeLink: insertRestaurant.placeLink ?? null,
      notes: insertRestaurant.notes ?? null,
      createdAt: new Date()
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: string, update: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;
    
    const updated = { ...restaurant, ...update };
    this.restaurants.set(id, updated);
    return updated;
  }

  async deleteRestaurant(id: string): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  // Activity methods
  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByTripId(tripId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.tripId === tripId)
      .sort((a, b) => new Date(a.activityDateTime).getTime() - new Date(b.activityDateTime).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity,
      id,
      notes: insertActivity.notes ?? null,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, update: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updated = { ...activity, ...update };
    this.activities.set(id, updated);
    return updated;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return this.activities.delete(id);
  }
}

export const storage = new MemStorage();
