import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ManifestCertificate } from "@shared/schema";

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
      // Call backend to generate PDF
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

      // Save certificate to Firestore
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
