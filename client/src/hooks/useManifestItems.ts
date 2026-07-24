import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export function useManifestItems(luggageId: string | null, userId?: string | null) {
  return useQuery({
    queryKey: ["manifestItems", luggageId, userId],
    queryFn: async () => {
      const url = userId
        ? `/api/manifestItems?luggageId=${luggageId}&userId=${userId}`
        : `/api/manifestItems?luggageId=${luggageId}`;
      const res = await fetch(url);
      return res.json();
    },
    enabled: !!luggageId,
  });
}

export function useCreateManifestItem() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/manifestItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["manifestItems", vars.luggageId] }),
  });
}

// ESTA FUNCIÓN ES VITAL PARA QUITAR EL ERROR DE PANTALLA NEGRA
export function useUpdateManifestItem() {
  return useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await fetch(`/api/manifestItems/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (_, vars: any) => queryClient.invalidateQueries({ queryKey: ["manifestItems", vars.luggageId] }),
  });
}

export function useDeleteManifestItem() {
  return useMutation({
    mutationFn: async ({ id }: any) => {
      await fetch(`/api/manifestItems/${id}`, { method: "DELETE" });
    },
    onSuccess: (_, vars: any) => queryClient.invalidateQueries({ queryKey: ["manifestItems", vars.luggageId] }),
  });
}