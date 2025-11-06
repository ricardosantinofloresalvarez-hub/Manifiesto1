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
import type { ManifestItem, InsertManifestItem } from "@shared/schema";

export function useManifestItems(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/trips", tripId, "items"],
    queryFn: async () => {
      if (!tripId) return [];
      
      const itemsRef = collection(db, "manifestItems");
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
      })) as ManifestItem[];
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
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId] });
    },
  });
}

export function useUpdateManifestItem() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertManifestItem> }) => {
      const itemRef = doc(db, "manifestItems", id);
      await updateDoc(itemRef, data);
      
      // We need to return the tripId for cache invalidation
      // Fetch the updated document to get current tripId
      const snapshot = await getDocs(
        query(collection(db, "manifestItems"), where("__name__", "==", id))
      );
      const updated = snapshot.docs[0];
      const itemData = updated.data();
      
      return {
        id: updated.id,
        tripId: itemData.tripId,
        name: itemData.name,
        category: itemData.category,
        imageUrl: itemData.imageUrl || null,
        quantity: itemData.quantity || 1,
        estimatedValue: itemData.estimatedValue || null,
        serialNumber: itemData.serialNumber || null,
        luggageBrand: itemData.luggageBrand || null,
        luggageSize: itemData.luggageSize || null,
        isSealed: itemData.isSealed || null,
        isLocked: itemData.isLocked || null,
        createdAt: itemData.createdAt?.toDate?.() || new Date(),
      } as ManifestItem;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId] });
    },
  });
}

export function useDeleteManifestItem() {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      await deleteDoc(doc(db, "manifestItems", id));
      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", variables.tripId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", variables.tripId] });
    },
  });
}
