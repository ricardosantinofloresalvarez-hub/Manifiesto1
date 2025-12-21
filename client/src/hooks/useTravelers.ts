import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import type { Traveler, InsertTraveler } from "@shared/schema";

export function useTravelers(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/travelers", tripId],
    queryFn: async () => {
      if (!tripId) return [];

      const travelersRef = collection(db, "travelers");
      const q = query(travelersRef, where("tripId", "==", tripId));
      const snapshot = await getDocs(q);

      const travelers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Traveler[];

      return travelers;
    },
    enabled: !!tripId,
  });
}

export function useCreateTraveler() {
  return useMutation({
    mutationFn: async (data: InsertTraveler) => {
      const travelersRef = collection(db, "travelers");
      const docRef = await addDoc(travelersRef, {
        ...data,
        createdAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/travelers", variables.tripId] });
    },
  });
}

export function useDeleteTraveler() {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      await deleteDoc(doc(db, "travelers", id));
      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/travelers", variables.tripId] });
    },
  });
}