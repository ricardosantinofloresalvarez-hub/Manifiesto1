import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc, 
  doc,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import type { Luggage, InsertLuggage } from "@shared/schema";

export function useLuggage(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/luggage", tripId],
    queryFn: async () => {
      if (!tripId) return [];

      const luggageRef = collection(db, "luggage");
      const q = query(luggageRef, where("tripId", "==", tripId));

      const snapshot = await getDocs(q);
      const luggage = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Luggage[];

      return luggage;
    },
    enabled: !!tripId,
  });
}

export function useLuggageById(luggageId: string | null) {
  return useQuery({
    queryKey: ["/api/luggage", luggageId],
    queryFn: async () => {
      if (!luggageId) return null;

      const luggageDoc = await getDoc(doc(db, "luggage", luggageId));
      if (!luggageDoc.exists()) return null;

      return {
        id: luggageDoc.id,
        ...luggageDoc.data(),
        createdAt: luggageDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Luggage;
    },
    enabled: !!luggageId,
  });
}

export function useCreateLuggage() {
  return useMutation({
    mutationFn: async (data: InsertLuggage) => {
      const luggageRef = collection(db, "luggage");
      const docRef = await addDoc(luggageRef, {
        ...data,
        createdAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
      } as Luggage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", variables.tripId] });
    },
  });
}

export function useUpdateLuggage() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLuggage> }) => {
      const luggageRef = doc(db, "luggage", id);
      await updateDoc(luggageRef, data);

      const updated = await getDoc(luggageRef);
      return {
        id: updated.id,
        ...updated.data(),
        createdAt: updated.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Luggage;
    },
    onSuccess: (luggage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.id] });
    },
  });
}

export function useDeleteLuggage() {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      // First delete all items in this luggage
      const itemsRef = collection(db, "manifestItems");
      const itemsQuery = query(itemsRef, where("luggageId", "==", id));
      const itemsSnapshot = await getDocs(itemsQuery);
      await Promise.all(itemsSnapshot.docs.map(d => deleteDoc(d.ref)));

      // Then delete the luggage
      await deleteDoc(doc(db, "luggage", id));
      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems"] });
    },
  });
}

export function useUpdateLuggagePhotos() {
  return useMutation({
    mutationFn: async ({
      luggageId,
      tripId,
      openPhotoUrl,
      closedPhotoUrl,
    }: {
      luggageId: string;
      tripId: string;
      openPhotoUrl?: string;
      closedPhotoUrl?: string;
    }) => {
      const luggageRef = doc(db, "luggage", luggageId);

      const updateData: Record<string, string> = {};
      if (openPhotoUrl !== undefined) updateData.openPhotoUrl = openPhotoUrl;
      if (closedPhotoUrl !== undefined) updateData.closedPhotoUrl = closedPhotoUrl;

      await updateDoc(luggageRef, updateData);

      const updated = await getDoc(luggageRef);
      return {
        id: updated.id,
        ...updated.data(),
        createdAt: updated.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Luggage;
    },
    onSuccess: (luggage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.id] });
    },
  });
}