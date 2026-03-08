import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Luggage, InsertLuggage } from "@shared/schema";

/* =========================
   OBTENER MALETAS
========================= */
export function useLuggage(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/luggage", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const res = await fetch(`/api/luggage?tripId=${tripId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!tripId,
  });
}

/* =========================
   OBTENER MALETA POR ID
========================= */
export function useLuggageById(luggageId: string | null) {
  return useQuery({
    queryKey: ["/api/luggage", luggageId],
    queryFn: async () => {
      if (!luggageId) return null;
      const res = await fetch(`/api/luggage/${luggageId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!luggageId,
  });
}

/* =========================
   CREAR MALETA
========================= */
export function useCreateLuggage() {
  return useMutation({
    mutationFn: async (data: InsertLuggage) => {
      const res = await fetch("/api/luggage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error creando maleta");
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", created.tripId] });
    },
  });
}

/* =========================
   ACTUALIZAR MALETA
========================= */
export function useUpdateLuggage() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLuggage> }) => {
      const res = await fetch(`/api/luggage/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error actualizando maleta");
      return res.json();
    },
    onSuccess: (luggage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.id] });
    },
  });
}

/* =========================
   ELIMINAR MALETA
========================= */
export function useDeleteLuggage() {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const res = await fetch(`/api/luggage/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error eliminando maleta");
      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", variables.tripId] });
    },
  });
}

/* =========================
   ACTUALIZAR FOTOS
========================= */
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
      const res = await fetch(`/api/luggage/${luggageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openPhotoUrl, closedPhotoUrl }),
      });
      if (!res.ok) throw new Error("Error actualizando fotos");
      return res.json();
    },
    onSuccess: (luggage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/luggage", luggage.id] });
    },
  });
}