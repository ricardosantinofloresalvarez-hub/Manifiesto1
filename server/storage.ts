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
import { db } from "./firebase";

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

export class FirestoreStorage implements IStorage {
  private usersCollection = db.collection('users');
  private tripsCollection = db.collection('trips');
  private manifestItemsCollection = db.collection('manifestItems');
  private certificatesCollection = db.collection('certificates');
  private flightsCollection = db.collection('flights');
  private hotelsCollection = db.collection('hotels');
  private transportCollection = db.collection('transport');
  private restaurantsCollection = db.collection('restaurants');
  private activitiesCollection = db.collection('activities');

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.usersCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await this.usersCollection
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const docRef = await this.usersCollection.add(insertUser);
    const user: User = { id: docRef.id, ...insertUser };
    return user;
  }

  // Trip methods
  async getTrip(id: string): Promise<Trip | undefined> {
    const doc = await this.tripsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Trip;
  }

  async getTripsByUserId(userId: string): Promise<Trip[]> {
    const snapshot = await this.tripsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Trip));
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const tripData = {
      ...insertTrip,
      createdAt: new Date().toISOString()
    };
    const docRef = await this.tripsCollection.add(tripData);
    return { id: docRef.id, ...tripData } as any as Trip;
  }

  async updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    const docRef = this.tripsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(trip);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Trip;
  }

  async deleteTrip(id: string): Promise<boolean> {
    try {
      await this.tripsCollection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  // Manifest Item methods
  async getManifestItem(id: string): Promise<ManifestItem | undefined> {
    const doc = await this.manifestItemsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as ManifestItem;
  }

  async getManifestItemsByTripId(tripId: string): Promise<ManifestItem[]> {
    const snapshot = await this.manifestItemsCollection
      .where('tripId', '==', tripId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ManifestItem));
  }

  async createManifestItem(insertItem: InsertManifestItem): Promise<ManifestItem> {
    const itemData = {
      ...insertItem,
      createdAt: new Date().toISOString()
    };
    const docRef = await this.manifestItemsCollection.add(itemData);
    return { id: docRef.id, ...itemData } as any as ManifestItem;
  }

  async updateManifestItem(id: string, item: Partial<InsertManifestItem>): Promise<ManifestItem | undefined> {
    const docRef = this.manifestItemsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(item);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as ManifestItem;
  }

  async deleteManifestItem(id: string): Promise<boolean> {
    try {
      await this.manifestItemsCollection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  // Certificate methods
  async createCertificate(insertCert: InsertManifestCertificate): Promise<ManifestCertificate> {
    const certData = {
      ...insertCert,
      createdAt: new Date().toISOString(),
      verified: false
    };
    const docRef = await this.certificatesCollection.add(certData);
    return { id: docRef.id, ...certData } as any as ManifestCertificate;
  }

  async getCertificateByHash(hash: string): Promise<ManifestCertificate | undefined> {
    const snapshot = await this.certificatesCollection
      .where('hash', '==', hash)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ManifestCertificate;
  }

  async getCertificatesByTripId(tripId: string): Promise<ManifestCertificate[]> {
    const snapshot = await this.certificatesCollection
      .where('tripId', '==', tripId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ManifestCertificate));
  }

  // Flight methods
  async getFlight(id: string): Promise<Flight | undefined> {
    const doc = await this.flightsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Flight;
  }

  async getFlightsByTripId(tripId: string): Promise<Flight[]> {
    const snapshot = await this.flightsCollection
      .where('tripId', '==', tripId)
      .orderBy('departureDateTime', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Flight));
  }

  async createFlight(insertFlight: InsertFlight): Promise<Flight> {
    const docRef = await this.flightsCollection.add(insertFlight);
    return { id: docRef.id, ...insertFlight } as Flight;
  }

  async updateFlight(id: string, flight: Partial<InsertFlight>): Promise<Flight | undefined> {
    const docRef = this.flightsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(flight);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Flight;
  }

  async deleteFlight(id: string): Promise<boolean> {
    try {
      await this.flightsCollection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  // Hotel methods
  async getHotel(id: string): Promise<Hotel | undefined> {
    const doc = await this.hotelsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Hotel;
  }

  async getHotelsByTripId(tripId: string): Promise<Hotel[]> {
    const snapshot = await this.hotelsCollection
      .where('tripId', '==', tripId)
      .orderBy('checkInDate', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Hotel));
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const docRef = await this.hotelsCollection.add(insertHotel);
    return { id: docRef.id, ...insertHotel } as Hotel;
  }

  async updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const docRef = this.hotelsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(hotel);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Hotel;
  }

  async deleteHotel(id: string): Promise<boolean> {
    try {
      await this.hotelsCollection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  // Transport methods
  async getTransport(id: string): Promise<Transport | undefined> {
    const doc = await this.transportCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Transport;
  }

  async getTransportByTripId(tripId: string): Promise<Transport[]> {
    const snapshot = await this.transportCollection
      .where('tripId', '==', tripId)
      .orderBy('departureDateTime', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transport));
  }

  async createTransport(insertTransport: InsertTransport): Promise<Transport> {
    const docRef = await this.transportCollection.add(insertTransport);
    return { id: docRef.id, ...insertTransport } as Transport;
  }

  async updateTransport(id: string, transport: Partial<InsertTransport>): Promise<Transport | undefined> {
    const docRef = this.transportCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(transport);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Transport;
  }

  async deleteTransport(id: string): Promise<boolean> {
    try {
      await this.transportCollection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  // Restaurant methods
  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const doc = await this.restaurantsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Restaurant;
  }

  async getRestaurantsByTripId(tripId: string): Promise<Restaurant[]> {
    const snapshot = await this.restaurantsCollection
      .where('tripId', '==', tripId)
      .orderBy('reservationDateTime', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Restaurant));
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const docRef = await this.restaurantsCollection.add(insertRestaurant);
    return { id: docRef.id, ...insertRestaurant } as Restaurant;
  }

  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const docRef = this.restaurantsCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(restaurant);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Restaurant;
  }

  async deleteRestaurant(id: string): Promise<boolean> {
    try {
      await this.restaurantsCollection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  // Activity methods
  async getActivity(id: string): Promise<Activity | undefined> {
    const doc = await this.activitiesCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Activity;
  }

  async getActivitiesByTripId(tripId: string): Promise<Activity[]> {
    const snapshot = await this.activitiesCollection
      .where('tripId', '==', tripId)
      .orderBy('activityDateTime', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const docRef = await this.activitiesCollection.add(insertActivity);
    return { id: docRef.id, ...insertActivity } as Activity;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const docRef = this.activitiesCollection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(activity);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Activity;
  }

  async deleteActivity(id: string): Promise<boolean> {
    try {
      await this.activitiesCollection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }
}

// Use Firestore storage
export const storage = new FirestoreStorage();
