import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import TopAppBar from "@/components/TopAppBar";
import BottomNavigation from "@/components/BottomNavigation";

const plans = [
  {
    id: "free",
    nameKey: "GRATIS",
    price: "$0",
    periodKey: "para siempre",
    features: ["1 viaje completo", "Hasta 4 manifiestos", "Certificado PDF con QR", "Verificación pública"],
    color: "border-gray-600",
    buttonStyle: "bg-gray-700 hover:bg-gray-600 text-white",
    productId: null,
  },
  {
    id: "pack3",
    nameKey: "PAQUETE 3",
    price: "$2.99",
    periodKey: "pago único",
    features: ["3 manifiestos adicionales", "Certificado PDF con QR", "Clima en tiempo real", "Fotos por destino"],
    color: "border-blue-500",
    buttonStyle: "bg-[#0070BA] hover:bg-[#005ea6] text-white",
    productId: "pack3",
    badge: null,
  },
  {
    id: "pack10",
    nameKey: "PAQUETE 10",
    price: "$6.99",
    periodKey: "pago único",
    features: ["10 manifiestos adicionales", "Certificado PDF con QR", "Clima en tiempo real", "Fotos por destino", "Ahorra vs paquete 3"],
    color: "border-green-500",
    buttonStyle: "bg-[#0070BA] hover:bg-[#005ea6] text-white",
    productId: "pack10",
    badge: "MÁS POPULAR",
  },
  {
    id: "annual",
    nameKey: "PLAN ANUAL",
    price: "$12.99",
    periodKey: "por año",
    features: ["Manifiestos ilimitados", "Certificado PDF con QR", "Clima en tiempo real", "Fotos por destino", "Soporte prioritario"],
    color: "border-yellow-500",
    buttonStyle: "bg-[#0070BA] hover:bg-[#005ea6] text-white",
    productId: "annual",
    badge: "MEJOR VALOR",
  },
];

export default function Plans() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (productId: string) => {
    if (!user) return navigate("/login");
    setLoading(productId);
    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const res = await fetch(`/api/paypal/checkout/${productId}?userId=${userData?.id}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: "No se pudo iniciar el pago", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <TopAppBar title={t('viewPlans')} />
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-center">{t('plansTitle')}</h1>
        <p className="text-gray-400 text-center mt-1">{t('plansSubtitle')}</p>
      </div>

      <div className="px-4 grid grid-cols-1 gap-4 max-w-lg mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className={`rounded-2xl border-2 ${plan.color} bg-gray-900 p-5 relative`}>
            {plan.badge && (
              <span className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            <div className="mb-3">
              <p className="text-gray-400 text-sm uppercase tracking-wide">{plan.nameKey}</p>
              <p className="text-3xl font-bold">{plan.price}</p>
              <p className="text-gray-500 text-sm">{plan.periodKey}</p>
            </div>
            <ul className="mb-4 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            {plan.productId ? (
              <button
                onClick={() => handlePurchase(plan.productId!)}
                disabled={loading === plan.productId}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.buttonStyle} disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {loading === plan.productId ? (
                  t('processing')
                ) : (
                  <>
                    <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <text x="0" y="15" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="white">Pay</text>
                      <text x="28" y="15" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="#00B4E6">Pal</text>
                    </svg>
                    · {plan.price}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.buttonStyle}`}
              >
                {t('startFree')}
              </button>
            )}
          </div>
        ))}
      </div>
      <BottomNavigation />
    </div>
  );
}
