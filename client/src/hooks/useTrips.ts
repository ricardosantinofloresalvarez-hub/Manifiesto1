import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Trip, InsertTrip } from "@shared/schema";

export function useTrips(userId: string | null) {
  return useQuery({
    queryKey: ["/api/trips", userId],
    queryFn: async () => {
      if (!userId) return [];

      const res = await fetch(`/api/trips?userId=${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useTrip(tripId: string | null, userId?: string | null) {
  return useQuery({
    queryKey: ["/api/trips", tripId, userId],
    queryFn: async () => {
      if (!tripId) return null;

      const url = userId ? `/api/trips/${tripId}?userId=${userId}` : `/api/trips/${tripId}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  return useMutation({
    mutationFn: async (data: InsertTrip) => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error creating trip");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/trips", variables.userId],
      });
    },
  });
}

export function useUpdateTrip() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTrip> }) => {
      const res = await fetch(`/api/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error updating trip");
      return res.json();
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
      const res = await fetch(`/api/trips/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Error deleting trip");
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
          userId,
          closedPhotoUrl,
        }: {
          tripId: string;
          openPhotoUrl?: string;
          userId?: string;
          closedPhotoUrl?: string;
        }) => {
          const updateData: any = {};
          if (openPhotoUrl !== undefined) updateData.openPhotoUrl = openPhotoUrl;
          if (userId !== undefined) updateData.userId = userId;
          if (closedPhotoUrl !== undefined) updateData.closedPhotoUrl = closedPhotoUrl;

          const res = await fetch(`/api/trips/${tripId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          });

          if (!res.ok) throw new Error("Error updating trip photos");
          return res.json();
        },
        onSuccess: (trip) => {
          queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.userId] });
          queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id] });
        },
      });
    }