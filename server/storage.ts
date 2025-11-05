import { 
  type User, 
  type InsertUser,
  type Trip,
  type InsertTrip,
  type ManifestItem,
  type InsertManifestItem,
  type ManifestCertificate,
  type InsertManifestCertificate
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private trips: Map<string, Trip>;
  private manifestItems: Map<string, ManifestItem>;
  private certificates: Map<string, ManifestCertificate>;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.manifestItems = new Map();
    this.certificates = new Map();
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
}

export const storage = new MemStorage();
