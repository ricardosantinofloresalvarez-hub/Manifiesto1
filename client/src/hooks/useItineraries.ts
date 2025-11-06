import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import type { 
  Flight, Hotel, Transport, Restaurant, Activity,
  InsertFlight, InsertHotel, InsertTransport, InsertRestaurant, InsertActivity 
} from "@shared/schema";

type ItineraryType = "flights" | "hotels" | "transport" | "restaurants" | "activities";
type ItineraryItem = Flight | Hotel | Transport | Restaurant | Activity;
type InsertItineraryItem = InsertFlight | InsertHotel | InsertTransport | InsertRestaurant | InsertActivity;

export function useItineraryItems<T extends ItineraryItem>(
  tripId: string | null, 
  type: ItineraryType
) {
  return useQuery({
    queryKey: ["/api/trips", tripId, type],
    queryFn: async () => {
      if (!tripId) return [];
      
      const itemsRef = collection(db, type);
      const q = query(
        itemsRef, 
        where("tripId", "==", tripId),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as T[];
    },
    enabled: !!tripId,
  });
}

export function useFlights(tripId: string | null) {
  return useItineraryItems<Flight>(tripId, "flights");
}

export function useHotels(tripId: string | null) {
  return useItineraryItems<Hotel>(tripId, "hotels");
}

export function useTransport(tripId: string | null) {
  return useItineraryItems<Transport>(tripId, "transport");
}

export function useRestaurants(tripId: string | null) {
  return useItineraryItems<Restaurant>(tripId, "restaurants");
}

export function useActivities(tripId: string | null) {
  return useItineraryItems<Activity>(tripId, "activities");
}

export function useCreateItineraryItem(type: ItineraryType) {
  return useMutation({
    mutationFn: async (data: InsertItineraryItem) => {
      const itemsRef = collection(db, type);
      const docRef = await addDoc(itemsRef, {
        ...data,
        createdAt: Timestamp.now(),
      });
      
      return {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
      } as unknown as ItineraryItem;
    },
    onSuccess: (item: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId, type] });
    },
  });
}

export function useUpdateItineraryItem(type: ItineraryType) {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertItineraryItem> }) => {
      const itemRef = doc(db, type, id);
      await updateDoc(itemRef, data);
      
      // Fetch the updated document
      const snapshot = await getDocs(
        query(collection(db, type), where("__name__", "==", id))
      );
      const updated = snapshot.docs[0];
      const itemData = updated.data();
      
      return {
        id: updated.id,
        ...itemData,
        createdAt: itemData.createdAt?.toDate?.() || new Date(),
      } as unknown as ItineraryItem;
    },
    onSuccess: (item: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId, type] });
    },
  });
}

export function useDeleteItineraryItem(type: ItineraryType) {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      await deleteDoc(doc(db, type, id));
      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", variables.tripId, type] });
    },
  });
}

// Specific hooks for Flights
export function useCreateFlight() {
  return useCreateItineraryItem("flights");
}

export function useUpdateFlight() {
  return useUpdateItineraryItem("flights");
}

export function useDeleteFlight() {
  return useDeleteItineraryItem("flights");
}

// Specific hooks for Hotels
export function useCreateHotel() {
  return useCreateItineraryItem("hotels");
}

export function useUpdateHotel() {
  return useUpdateItineraryItem("hotels");
}

export function useDeleteHotel() {
  return useDeleteItineraryItem("hotels");
}

// Specific hooks for Transport
export function useCreateTransport() {
  return useCreateItineraryItem("transport");
}

export function useUpdateTransport() {
  return useUpdateItineraryItem("transport");
}

export function useDeleteTransport() {
  return useDeleteItineraryItem("transport");
}

// Specific hooks for Restaurants
export function useCreateRestaurant() {
  return useCreateItineraryItem("restaurants");
}

export function useUpdateRestaurant() {
  return useUpdateItineraryItem("restaurants");
}

export function useDeleteRestaurant() {
  return useDeleteItineraryItem("restaurants");
}

// Specific hooks for Activities
export function useCreateActivity() {
  return useCreateItineraryItem("activities");
}

export function useUpdateActivity() {
  return useUpdateItineraryItem("activities");
}

export function useDeleteActivity() {
  return useDeleteItineraryItem("activities");
}
