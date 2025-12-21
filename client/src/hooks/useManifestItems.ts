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
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import type { ManifestItem, InsertManifestItem } from "@shared/schema";

// Get items by luggage ID
export function useManifestItems(luggageId: string | null) {
  return useQuery({
    queryKey: ["/api/manifestItems", luggageId],
    queryFn: async () => {
      if (!luggageId) return [];

      const itemsRef = collection(db, "manifestItems");
      const q = query(itemsRef, where("luggageId", "==", luggageId));

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as ManifestItem[];

      return items;
    },
    enabled: !!luggageId,
  });
}

// Get ALL items for a trip (across all luggage)
export function useAllManifestItemsForTrip(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/manifestItems/trip", tripId],
    queryFn: async () => {
      if (!tripId) return [];

      // First get all luggage for this trip
      const luggageRef = collection(db, "luggage");
      const luggageQuery = query(luggageRef, where("tripId", "==", tripId));
      const luggageSnapshot = await getDocs(luggageQuery);
      const luggageIds = luggageSnapshot.docs.map(doc => doc.id);

      if (luggageIds.length === 0) return [];

      // Then get all items for those luggage pieces
      const itemsRef = collection(db, "manifestItems");
      const allItems: ManifestItem[] = [];

      for (const luggageId of luggageIds) {
        const itemsQuery = query(itemsRef, where("luggageId", "==", luggageId));
        const itemsSnapshot = await getDocs(itemsQuery);
        const items = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as ManifestItem[];
        allItems.push(...items);
      }

      return allItems;
    },
    enabled: !!tripId,
  });
}

export function useCreateManifestItem() {
  return useMutation({
    mutationFn: async (data: InsertManifestItem) => {
      const itemsRef = collection(db, "manifestItems");
      const docRef = await addDoc(itemsRef, {
        ...data,
        createdAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
      } as ManifestItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems", variables.luggageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems/trip"] });
    },
  });
}

export function useUpdateManifestItem() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertManifestItem> }) => {
      const itemRef = doc(db, "manifestItems", id);
      await updateDoc(itemRef, data);
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems"] });
    },
  });
}

export function useDeleteManifestItem() {
  return useMutation({
    mutationFn: async ({ id, luggageId }: { id: string; luggageId: string }) => {
      await deleteDoc(doc(db, "manifestItems", id));
      return { id, luggageId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems", variables.luggageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems/trip"] });
    },
  });
}