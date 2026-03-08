import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { 
  Flight, Hotel, Transport, Restaurant, Activity,
  InsertFlight, InsertHotel, InsertTransport, InsertRestaurant, InsertActivity 
} from "@shared/schema";

type ItineraryType = "flights" | "hotels" | "transport" | "restaurants" | "activities";
type ItineraryItem = Flight | Hotel | Transport | Restaurant | Activity;
type InsertItineraryItem = InsertFlight | InsertHotel | InsertTransport | InsertRestaurant | InsertActivity;

export function useItineraryItems<T extends ItineraryItem>(
  tripId: string | null, 
  type: ItineraryType
) {
  return useQuery({
    queryKey: ["/api/trips", tripId, type],
    queryFn: async () => {
      if (!tripId) return [];

      const response = await fetch(`/api/${type}?tripId=${tripId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }

      return response.json() as Promise<T[]>;
    },
    enabled: !!tripId,
  });
}

export function useFlights(tripId: string | null) {
  return useItineraryItems<Flight>(tripId, "flights");
}

export function useHotels(tripId: string | null) {
  return useItineraryItems<Hotel>(tripId, "hotels");
}

export function useTransport(tripId: string | null) {
  return useItineraryItems<Transport>(tripId, "transport");
}

export function useRestaurants(tripId: string | null) {
  return useItineraryItems<Restaurant>(tripId, "restaurants");
}

export function useActivities(tripId: string | null) {
  return useItineraryItems<Activity>(tripId, "activities");
}

export function useCreateItineraryItem(type: ItineraryType) {
  return useMutation({
    mutationFn: async (data: InsertItineraryItem) => {
      const response = await fetch(`/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${type}`);
      }

      return response.json() as Promise<ItineraryItem>;
    },
    onSuccess: (item: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId, type] });
    },
  });
}

export function useUpdateItineraryItem(type: ItineraryType) {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertItineraryItem> }) => {
      const response = await fetch(`/api/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${type}`);
      }

      return response.json() as Promise<ItineraryItem>;
    },
    onSuccess: (item: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", item.tripId, type] });
    },
  });
}

export function useDeleteItineraryItem(type: ItineraryType) {
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const response = await fetch(`/api/${type}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      return { id, tripId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", variables.tripId, type] });
    },
  });
}

// Specific hooks for Flights
export function useCreateFlight() {
  return useCreateItineraryItem("flights");
}

export function useUpdateFlight() {
  return useUpdateItineraryItem("flights");
}

export function useDeleteFlight() {
  return useDeleteItineraryItem("flights");
}

// Specific hooks for Hotels
export function useCreateHotel() {
  return useCreateItineraryItem("hotels");
}

export function useUpdateHotel() {
  return useUpdateItineraryItem("hotels");
}

export function useDeleteHotel() {
  return useDeleteItineraryItem("hotels");
}

// Specific hooks for Transport
export function useCreateTransport() {
  return useCreateItineraryItem("transport");
}

export function useUpdateTransport() {
  return useUpdateItineraryItem("transport");
}

export function useDeleteTransport() {
  return useDeleteItineraryItem("transport");
}

// Specific hooks for Restaurants
export function useCreateRestaurant() {
  return useCreateItineraryItem("restaurants");
}

export function useUpdateRestaurant() {
  return useUpdateItineraryItem("restaurants");
}

export function useDeleteRestaurant() {
  return useDeleteItineraryItem("restaurants");
}

// Specific hooks for Activities
export function useCreateActivity() {
  return useCreateItineraryItem("activities");
}

export function useUpdateActivity() {
  return useUpdateItineraryItem("activities");
}

export function useDeleteActivity() {
  return useDeleteItineraryItem("activities");
}