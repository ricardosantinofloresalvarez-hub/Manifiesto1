import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { ManifestItem, InsertManifestItem } from "@shared/schema";

/* ===============================
   LISTAR ARTÍCULOS POR MALETA
================================ */
export function useManifestItems(luggageId: string | null) {
  return useQuery({
    queryKey: ["manifestItems", luggageId],
    queryFn: async () => {
      if (!luggageId) return [];

      const res = await fetch(
        `/api/manifestItems?luggageId=${luggageId}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Error cargando artículos");
      }

      return res.json() as Promise<ManifestItem[]>;
    },
    enabled: !!luggageId,
  });
}

/* ===============================
   CREAR ARTÍCULO
================================ */
export function useCreateManifestItem() {
  return useMutation({
    mutationFn: async (data: InsertManifestItem) => {
      const res = await fetch("/api/manifestItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Error creando artículo");
      }

      return res.json() as Promise<ManifestItem>;
    },

    onSuccess: (_createdItem, variables) => {
      // 🔥 ESTA ES LA CLAVE
      queryClient.invalidateQueries({
        queryKey: ["manifestItems", variables.luggageId],
      });
    },
  });
}

/* ===============================
   ACTUALIZAR ARTÍCULO
================================ */
export function useUpdateManifestItem() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
      luggageId,
    }: {
      id: string;
      data: Partial<InsertManifestItem>;
      luggageId: string;
    }) => {
      const res = await fetch(`/api/manifestItems/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Error actualizando artículo");
      }

      return res.json();
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["manifestItems", variables.luggageId],
      });
    },
  });
}

/* ===============================
   ELIMINAR ARTÍCULO
================================ */
export function useDeleteManifestItem() {
  return useMutation({
    mutationFn: async ({
      id,
      luggageId,
    }: {
      id: string;
      luggageId: string;
    }) => {
      const res = await fetch(`/api/manifestItems/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error eliminando artículo");
      }

      return { id, luggageId };
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["manifestItems", variables.luggageId],
      });
    },
  });
}
