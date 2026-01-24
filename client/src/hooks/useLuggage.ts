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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import type { Luggage, InsertLuggage } from "@shared/schema";

/* ─────────────── LISTAR MALETAS ─────────────── */

export function useLuggage(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/luggage", tripId],
    queryFn: async () => {
      if (!tripId) return [];

      const luggageRef = collection(db, "luggage");
      const q = query(luggageRef, where("tripId", "==", tripId));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ??
          new Date().toISOString(),
      })) as Luggage[];
    },
    enabled: !!tripId,
  });
}

/* ─────────────── MALETA POR ID ─────────────── */

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
        createdAt:
          luggageDoc.data().createdAt?.toDate?.()?.toISOString() ??
          new Date().toISOString(),
      } as Luggage;
    },
    enabled: !!luggageId,
  });
}

/* ─────────────── CREAR MALETA (🔥 CLAVE) ─────────────── */

export function useCreateLuggage() {
  return useMutation({
    mutationFn: async (data: InsertLuggage) => {
      // 1️⃣ Crear en Firebase
      const luggageRef = collection(db, "luggage");
      const docRef = await addDoc(luggageRef, {
        ...data,
        createdAt: Timestamp.now(),
      });

      const luggageId = docRef.id;

      // 2️⃣ Avisar al backend (MISMO ID)
      await fetch("/api/luggage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: luggageId,
          ...data,
        }),
      });

      return {
        id: luggageId,
        ...data,
        createdAt: new Date().toISOString(),
      } as Luggage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/luggage", variables.tripId],
      });
    },
  });
}

/* ─────────────── ACTUALIZAR MALETA ─────────────── */

export function useUpdateLuggage() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InsertLuggage>;
    }) => {
      const luggageRef = doc(db, "luggage", id);
      await updateDoc(luggageRef, data);

      const updated = await getDoc(luggageRef);
      return {
        id: updated.id,
        ...updated.data(),
        createdAt:
          updated.data()?.createdAt?.toDate?.()?.toISOString() ??
          new Date().toISOString(),
      } as Luggage;
    },
    onSuccess: (luggage) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/luggage", luggage.tripId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/luggage", luggage.id],
      });
    },
  });
}

/* ─────────────── BORRAR MALETA ─────────────── */

export function useDeleteLuggage() {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const itemsRef = collection(db, "manifestItems");
      const itemsQuery = query(itemsRef, where("luggageId", "==", id));
      const itemsSnapshot = await getDocs(itemsQuery);

      await Promise.all(itemsSnapshot.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, "luggage", id));

      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/luggage", variables.tripId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/manifestItems"],
      });
    },
  });
}

/* ─────────────── ACTUALIZAR FOTOS ─────────────── */

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
      if (closedPhotoUrl !== undefined)
        updateData.closedPhotoUrl = closedPhotoUrl;

      await updateDoc(luggageRef, updateData);

      const updated = await getDoc(luggageRef);
      return {
        id: updated.id,
        ...updated.data(),
        createdAt:
          updated.data()?.createdAt?.toDate?.()?.toISOString() ??
          new Date().toISOString(),
      } as Luggage;
    },
    onSuccess: (luggage) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/luggage", luggage.tripId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/luggage", luggage.id],
      });
    },
  });
}
