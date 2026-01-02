import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { ManifestItem, InsertManifestItem } from "@shared/schema";

// Get items by luggage ID
export function useManifestItems(luggageId: string | null) {
  return useQuery({
    queryKey: ["/api/manifestItems", luggageId],
    queryFn: async () => {
      if (!luggageId) return [];

      const response = await fetch(`/api/manifestItems?luggageId=${luggageId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error fetching manifest items: ${response.statusText}`);
      }

      return response.json() as Promise<ManifestItem[]>;
    },
    enabled: !!luggageId,
  });
}

// Get ALL items for a trip (across all luggage)
export function useAllManifestItemsForTrip(tripId: string | null) {
  return useQuery({
    queryKey: ["/api/manifestItems/trip", tripId],
    queryFn: async () => {
      if (!tripId) return [];

      const response = await fetch(`/api/manifestItems/trip/${tripId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error fetching trip items: ${response.statusText}`);
      }

      return response.json() as Promise<ManifestItem[]>;
    },
    enabled: !!tripId,
  });
}

export function useCreateManifestItem() {
  return useMutation({
    mutationFn: async (data: InsertManifestItem) => {
      const response = await fetch("/api/manifestItems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error creating manifest item");
      }

      return response.json() as Promise<ManifestItem>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems", variables.luggageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems/trip"] });
    },
  });
}

export function useUpdateManifestItem() {
  return useMutation({
    mutationFn: async ({ 
      id, 
      data, 
      luggageId 
    }: { 
      id: string; 
      data: Partial<InsertManifestItem>; 
      luggageId: string;
    }) => {
      const response = await fetch(`/api/manifestItems/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error updating manifest item");
      }

      return response.json() as Promise<ManifestItem>;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems", variables.luggageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems/trip"] });
    },
  });
}

export function useDeleteManifestItem() {
  return useMutation({
    mutationFn: async ({ id, luggageId }: { id: string; luggageId: string }) => {
      const response = await fetch(`/api/manifestItems/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error deleting manifest item");
      }

      return { id, luggageId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems", variables.luggageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manifestItems/trip"] });
    },
  });
}