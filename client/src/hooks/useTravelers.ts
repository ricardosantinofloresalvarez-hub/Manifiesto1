import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Traveler, InsertTraveler } from "@shared/schema";

export function useTravelers(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/travelers", tripId],
    queryFn: async () => {
      if (!tripId) return [];

      const response = await fetch(`/api/travelers?tripId=${tripId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch travelers");
      }

      return response.json() as Promise<Traveler[]>;
    },
    enabled: !!tripId,
  });
}

export function useCreateTraveler() {
  return useMutation({
    mutationFn: async (data: InsertTraveler) => {
      const response = await fetch("/api/travelers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create traveler");
      }

      return response.json() as Promise<Traveler>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/travelers", variables.tripId] });
    },
  });
}

export function useDeleteTraveler() {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const response = await fetch(`/api/travelers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete traveler");
      }

      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/travelers", variables.tripId] });
    },
  });
}