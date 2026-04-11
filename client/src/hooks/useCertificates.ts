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
        const lang = i18n.language.startsWith('en') ? 'en' : 'es';

        const url = `/api/luggage/${cleanId}/certificate?userName=${encodeURIComponent(userName)}&lang=${lang}&t=${Date.now()}`;
        const res = await fetch(url);

        if (res.status === 403) {
          const data = await res.json();
          toast({
            title: lang === 'en' ? 'No credits available' : 'Sin créditos disponibles',
            description: data.error || (lang === 'en' ? 'Purchase a plan to continue.' : 'Adquiere un plan para continuar.'),
            variant: "destructive",
          });
          throw new Error('No credits');
        }

        if (!res.ok) throw new Error('Error generando certificado');

        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `Certificate_${cleanId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);

        queryClient.invalidateQueries({ queryKey: ["/api/luggage"] });
        
        // Actualizar créditos en localStorage y notificar
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.manifestCredits !== undefined && userData.planType !== 'annual') {
            userData.manifestCredits = Math.max(0, (userData.manifestCredits || 0) - 1);
            localStorage.setItem('user', JSON.stringify(userData));
            window.dispatchEvent(new Event('storage'));
          }
        }
        
        return true;
      } catch (error: any) {
        if (error.message !== 'No credits') {
          toast({
            title: "Error",
            description: "No se pudo descargar el certificado.",
            variant: "destructive",
          });
        }
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