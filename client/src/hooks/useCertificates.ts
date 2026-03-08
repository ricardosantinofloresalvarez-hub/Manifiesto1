import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from 'react-i18next';
/* ==============================================
   1. GENERAR CERTIFICADO (DESCARGA REAL)
   ============================================== */
export function useGenerateLuggageCertificate() {
  const { toast } = useToast();
  const { i18n } = useTranslation(); // ← AGREGAR

  return useMutation({
    mutationFn: async ({ luggage, user }: any) => {
      try {
        const cleanId = String(luggage.id).trim();
        const userName = user?.name || 'Usuario';

        // Usar i18n directamente
        const lang = i18n.language.startsWith('en') ? 'en' : 'es';
        // Detectar idioma actual
        

        const link = document.createElement('a');
        link.href = `/api/luggage/${cleanId}/certificate?userName=${encodeURIComponent(userName)}&lang=${lang}&t=${Date.now()}`;
        link.setAttribute('download', `Certificate_${cleanId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        queryClient.invalidateQueries({ queryKey: ["/api/luggage"] });
        return true;
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo descargar el certificado.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });
}
/* ==============================================
   2. VERIFICAR CERTIFICADO POR HASH
   ============================================== */
export function useCertificateByHash(hash: string | null) {
  return useQuery({
    queryKey: ["verify-certificate", hash],
    enabled: Boolean(hash && hash.trim().length > 0),
    queryFn: async () => {
      const cleanHash = hash?.trim();
      const res = await fetch(`/api/luggage/verify/${cleanHash}`);
      if (res.status === 404) {
        return { valid: false, message: "Certificado no encontrado" };
      }
      if (!res.ok) {
        throw new Error("Error en el servidor");
      }
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });
}

/* ==============================================
   3. LISTAR CERTIFICADOS (SIMPLIFICADO)
   ============================================== */
export function useCertificatesByLuggage(luggageId: string | null) {
  return useQuery({
    queryKey: ["luggage-certificates", luggageId],
    queryFn: async () => {
      if (!luggageId) return [];
      const res = await fetch(`/api/luggage/${luggageId}/certificate`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!luggageId,
  });
}