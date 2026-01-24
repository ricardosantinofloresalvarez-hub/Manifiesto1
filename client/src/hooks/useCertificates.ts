import { useMutation, useQuery } from "@tanstack/react-query";

export function useGenerateLuggageCertificate() {
  return useMutation({
    mutationFn: async (payload: { luggage: { id: string }, items: any[], trip: any, user: any }) => {
      const res = await fetch(`/api/luggage/${payload.luggage.id}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), 
      });
      if (!res.ok) throw new Error("Error al generar");
      return await res.json(); 
    },
  });
}

export function useCertificateByHash(hash: string | null) {
  return useQuery({
    // IMPORTANTE: El primer elemento de la clave debe ser la ruta
    queryKey: ["/api/luggage/verify", hash], 
    queryFn: async () => {
      if (!hash) return null;
      const res = await fetch(`/api/luggage/verify/${hash}`);
      if (!res.ok) return { verified: false }; // Evita que el hook lance un error fatal
      return await res.json();
    },
    enabled: !!hash,
  });
}
