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
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import type { Trip, InsertTrip } from "@shared/schema";

export function useTrips(userId: string | null) {
  return useQuery({
    queryKey: ["/api/trips", userId],
    queryFn: async () => {
      if (!userId) return [];

      const tripsRef = collection(db, "trips");
      const q = query(
        tripsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const trips = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        startDate: doc.data().startDate || "",
        endDate: doc.data().endDate || "",
      })) as Trip[];

      // Get item counts for each trip
      const tripsWithCounts = await Promise.all(
        trips.map(async (trip) => {
          const itemsRef = collection(db, "manifestItems");
          const itemsQuery = query(itemsRef, where("tripId", "==", trip.id));
          const itemsSnapshot = await getDocs(itemsQuery);

          const certsRef = collection(db, "certificates");
          const certsQuery = query(certsRef, where("tripId", "==", trip.id));
          const certsSnapshot = await getDocs(certsQuery);

          return {
            ...trip,
            itemCount: itemsSnapshot.size,
            verified: certsSnapshot.size > 0,
          };
        }),
      );

      return tripsWithCounts;
    },
    enabled: !!userId,
  });
}

export function useTrip(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/trips", tripId],
    queryFn: async () => {
      if (!tripId) return null;

      const tripDoc = await getDoc(doc(db, "trips", tripId));
      if (!tripDoc.exists()) return null;

      return {
        id: tripDoc.id,
        ...tripDoc.data(),
        createdAt:
          tripDoc.data().createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        startDate: tripDoc.data().startDate || "",
        endDate: tripDoc.data().endDate || "",
      } as Trip;
    },
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  return useMutation({
    mutationFn: async (data: InsertTrip) => {
      console.log("📤 Data received in useCreateTrip:", data);

      const tripsRef = collection(db, "trips");
      console.log("📁 Collection reference:", tripsRef.path);

      try {
        const docRef = await addDoc(tripsRef, {
          ...data,
          createdAt: Timestamp.now(),
        });

        console.log("✅ Document created with ID:", docRef.id);

        return {
          id: docRef.id,
          ...data,
          createdAt: new Date().toISOString(),
        } as Trip;
      } catch (error) {
        console.error("❌ Error creating trip:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.log("🎉 Trip created successfully, invalidating queries...");
      queryClient.invalidateQueries({
        queryKey: ["/api/trips", variables.userId],
      });
    },
  });
}

export function useUpdateTrip() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InsertTrip>;
    }) => {
      const tripRef = doc(db, "trips", id);
      await updateDoc(tripRef, data);

      const updated = await getDoc(tripRef);
      const tripData = updated.data();
      return {
        id: updated.id,
        userId: tripData?.userId || "",
        title: tripData?.title || "",
        destination: tripData?.destination || "",
        startDate: tripData?.startDate || "",
        endDate: tripData?.endDate || "",
        notes: tripData?.notes || null,
        imageUrl: tripData?.imageUrl || null,
        createdAt: tripData?.createdAt?.toDate?.() || new Date(),
      } as Trip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id] });
    },
  });
}

export function useDeleteTrip() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Delete all manifest items first
      const itemsRef = collection(db, "manifestItems");
      const itemsQuery = query(itemsRef, where("tripId", "==", id));
      const itemsSnapshot = await getDocs(itemsQuery);
      await Promise.all(itemsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      // Delete all certificates
      const certsRef = collection(db, "certificates");
      const certsQuery = query(certsRef, where("tripId", "==", id));
      const certsSnapshot = await getDocs(certsQuery);
      await Promise.all(certsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      // Delete all itinerary items (flights, hotels, etc.)
      const collections = [
        "flights",
        "hotels",
        "transport",
        "restaurants",
        "activities",
      ];
      await Promise.all(
        collections.map(async (collectionName) => {
          const ref = collection(db, collectionName);
          const q = query(ref, where("tripId", "==", id));
          const snapshot = await getDocs(q);
          await Promise.all(snapshot.docs.map((doc) => deleteDoc(doc.ref)));
        }),
      );

      // Finally delete the trip
      await deleteDoc(doc(db, "trips", id));

      return { id, userId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/trips", variables.userId],
      });
    },
  });
}

export function useUpdateTripPhotos() {
  return useMutation({
    mutationFn: async ({
      tripId,
      openPhotoUrl,
      closedPhotoUrl,
    }: {
      tripId: string;
      openPhotoUrl?: string;
      closedPhotoUrl?: string;
    }) => {
      const tripRef = doc(db, "trips", tripId);

      const updateData: any = {};
      if (openPhotoUrl !== undefined) updateData.openPhotoUrl = openPhotoUrl;
      if (closedPhotoUrl !== undefined)
        updateData.closedPhotoUrl = closedPhotoUrl;

      await updateDoc(tripRef, updateData);

      const updated = await getDoc(tripRef);
      return {
        id: updated.id,
        ...updated.data(),
      } as Trip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id] });
    },
  });
}
