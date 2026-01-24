import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useTrip(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/trips", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const tripDoc = await getDoc(doc(db, "trips", tripId));
      if (!tripDoc.exists()) return null;

      const data = tripDoc.data();
      const luggageRef = collection(db, "luggage");
      const q = query(luggageRef, where("tripId", "==", tripId));
      const luggageSnap = await getDocs(q);

      // Mapeamos las maletas de Firebase para que el frontend las entienda
      const luggage = luggageSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Aseguramos que existan los campos que pide tu LuggageDetailDialog
        isSealed: doc.data().isSealed || false,
        isLocked: doc.data().isLocked || false
      }));

      return { 
        id: tripDoc.id, 
        ...data, 
        luggage,
        imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
      };
    },
    enabled: !!tripId,
  });
}