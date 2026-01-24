import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  doc,
  updateDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import type { ManifestCertificate, Luggage, ManifestItem } from "@shared/schema";

export function useCertificatesByTrip(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/trips", tripId, "certificates"],
    queryFn: async () => {
      if (!tripId) return [];
      
      const certsRef = collection(db, "certificates");
      const q = query(
        certsRef, 
        where("tripId", "==", tripId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as ManifestCertificate[];
    },
    enabled: !!tripId,
  });
}

export function useCertificatesByLuggage(luggageId: string | null) {
  return useQuery({
    queryKey: ["/api/luggage", luggageId, "certificates"],
    queryFn: async () => {
      if (!luggageId) return [];
      
      const certsRef = collection(db, "certificates");
      const q = query(
        certsRef, 
        where("luggageId", "==", luggageId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as ManifestCertificate[];
    },
    enabled: !!luggageId,
  });
}

export function useCertificateByHash(hash: string | null) {
  return useQuery({
    queryKey: ["/api/verify", hash],
    queryFn: async () => {
      if (!hash) return null;
      
      const certsRef = collection(db, "certificates");
      const q = query(certsRef, where("hash", "==", hash));
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const certDoc = snapshot.docs[0];
      return {
        id: certDoc.id,
        ...certDoc.data(),
        createdAt: certDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as ManifestCertificate;
    },
    enabled: !!hash,
  });
}

export function useGenerateCertificate() {
  return useMutation({
    mutationFn: async ({ trip, items, user }: { trip: any; items: any[]; user: any }) => {
      const response = await fetch(`/api/trips/${trip.id}/certificate`, {
        method: "POST",
        body: JSON.stringify({ trip, items, user }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate certificate");
      }

      const { pdf, certificate } = await response.json();

      const certsRef = collection(db, "certificates");
      const docRef = await addDoc(certsRef, {
        ...certificate,
        createdAt: Timestamp.now(),
      });

      return {
        certificateId: docRef.id,
        pdf,
        hash: certificate.hash,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", variables.trip.id, "certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", variables.trip.userId] });
    },
  });
}

interface GenerateLuggageCertificateParams {
  luggage: Luggage;
  items: ManifestItem[];
  trip: { id: string; title: string; destination: string; startDate: string; endDate: string };
  user: { name: string; email: string };
}

export function useGenerateLuggageCertificate() {
  return useMutation({
    mutationFn: async ({ luggage, items, trip, user }: GenerateLuggageCertificateParams) => {
      const response = await fetch(`/api/luggage/${luggage.id}/certificate`, {
        method: "POST",
        body: JSON.stringify({ luggage, items, trip, user }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate luggage certificate");
      }

      const { pdf, certificate } = await response.json();

      const certsRef = collection(db, "certificates");
      const docRef = await addDoc(certsRef, {
        ...certificate,
        luggageId: luggage.id,
        tripId: trip.id,
        createdAt: Timestamp.now(),
      });

      try {
        const luggageRef = doc(db, "luggage", luggage.id);
        await updateDoc(luggageRef, {
          certificateHash: certificate.hash,
          certificatePdfUrl: pdf,
        });
      } catch (updateError) {
        console.warn("Could not update luggage document (may not exist yet):", updateError);
      }

      return {
        certificateId: docRef.id,
        pdf,
        hash: certificate.hash,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", variables.luggage.id, "certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", variables.luggage.tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", variables.trip.id, "certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/luggage"] });
    },
  });
}
