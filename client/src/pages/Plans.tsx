import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import TopAppBar from "@/components/TopAppBar";
import BottomNavigation from "@/components/BottomNavigation";

function ManifestCard({ accentColor, icon }: { accentColor: string; icon: string }) {
  return (
    <div className="relative w-36 h-48 mx-auto mb-4">
      <div className="absolute inset-0 rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.05)", transform: "rotate(-6deg) translateY(6px)" }}/>
      <div className="absolute inset-0 rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.07)", transform: "rotate(-3deg) translateY(3px)" }}/>
      <div className="absolute inset-0 rounded-xl overflow-hidden border border-white/20" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-10 flex items-center justify-center font-bold text-sm tracking-widest text-white" style={{ background: accentColor }}>MANIFIESTO</div>
        <div className="text-center pt-2 text-2xl">{icon}</div>
        <div className="px-3 pt-1 space-y-1">
          <div className="h-1.5 rounded-full bg-white/20 w-3/4"/>
          <div className="h-1.5 rounded-full bg-white/15 w-full"/>
          <div className="h-1.5 rounded-full bg-white/15 w-5/6"/>
        </div>
        <div className="px-3 pt-2 space-y-1.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }}/>
              <div className="h-1.5 rounded-full bg-white/20 flex-1"/>
              <div className="w-5 h-3 rounded bg-white/15"/>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-6 flex items-center justify-center">
          <span className="text-white/30 text-xs tracking-widest">CERTIFICADO VERIFICABLE</span>
        </div>
      </div>
    </div>
  );
}

const plans = [
  { id: "free", bg: "from-[#0d1b2e] to-[#0a1628]", accentColor: "#4FC3F7", icon: "📋", nameKey: "GRATIS", priceDisplay: "$0", period: "para siempre", bigNumber: "4", bigLabel: "Manifiestos", badge: null, badgeBg: "", features: ["1 viaje completo", "Hasta 4 manifiestos", "Certificado PDF con QR", "Verificación pública"], productId: null },
  { id: "pack3", bg: "from-[#0d1b2e] to-[#0f2540]", accentColor: "#29B6F6", icon: "✈️", nameKey: "PAQUETE 3", priceDisplay: "$2.99", period: "pago único", bigNumber: "3", bigLabel: "Manifiestos", badge: null, badgeBg: "", features: ["3 manifiestos adicionales", "PDF con QR verificable", "Clima en tiempo real", "Fotos por destino", "Compartir con familia"], productId: "pack3" },
  { id: "pack10", bg: "from-[#0d1f1a] to-[#0a1f15]", accentColor: "#66BB6A", icon: "🌍", nameKey: "PAQUETE 10", priceDisplay: "$6.99", period: "pago único", bigNumber: "10", bigLabel: "Manifiestos", badge: "MÁS POPULAR", badgeBg: "#66BB6A", features: ["10 manifiestos adicionales", "PDF con QR verificable", "Clima en tiempo real", "Fotos por destino", "Compartir con familia", "Ahorra vs paquete 3"], productId: "pack10" },
  { id: "annual", bg: "from-[#1a1020] to-[#140d1c]", accentColor: "#FFB300", icon: "⭐", nameKey: "PLAN ANUAL", priceDisplay: "$12.99", period: "por año · cancela cuando quieras", bigNumber: "∞", bigLabel: "Manifiestos / año", badge: "PLAN ANUAL", badgeBg: "#FFB300", features: ["Manifiestos ilimitados", "PDF con QR verificable", "Clima en tiempo real", "Fotos por destino", "Soporte prioritario"], productId: "annual" },
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
      if (data.url) { window.location.href = data.url; }
      else { toast({ title: "Error", description: "No se pudo iniciar el pago", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error de conexión", variant: "destructive" }); }
    finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <TopAppBar title={t('viewPlans')} />
      <div className="px-4 pt-6 pb-2 text-center">
        <h1 className="text-2xl font-bold">Empieza gratis.</h1>
        <p className="text-gray-400 mt-1 text-sm">Escala cuando lo necesites.</p>
      </div>
      <div className="px-4 space-y-4 mt-4 max-w-lg mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className={`rounded-2xl overflow-hidden bg-gradient-to-br ${plan.bg} border border-white/10`} style={{ boxShadow: `0 4px 24px ${plan.accentColor}22` }}>
            <div className="p-5 flex gap-4">
              <div className="flex-shrink-0 w-36">
                <ManifestCard accentColor={plan.accentColor} icon={plan.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs tracking-widest opacity-50 mb-1">{plan.nameKey}</p>
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-4xl font-black" style={{ color: plan.accentColor }}>{plan.bigNumber}</span>
                </div>
                <p className="text-sm text-white/70 mb-2">{plan.bigLabel}</p>
                {plan.badge && <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 text-gray-900" style={{ background: plan.badgeBg }}>{plan.badge}</span>}
                <ul className="space-y-0.5 mb-3">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-white/60 flex items-center gap-1">
                      <span style={{ color: plan.accentColor }}>+</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="mb-3">
                  <span className="text-2xl font-black" style={{ color: plan.accentColor }}>{plan.priceDisplay}</span>
                  <span className="text-xs text-white/40 ml-1">{plan.period}</span>
                </div>
                {plan.productId ? (
                  <button onClick={() => handlePurchase(plan.productId!)} disabled={loading === plan.productId} className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50" style={{ background: "linear-gradient(135deg, #003087, #0070BA)" }}>
                    {loading === plan.productId ? "Procesando..." : (<><svg width="50" height="14" viewBox="0 0 50 14"><text x="0" y="11" fontFamily="Arial" fontWeight="bold" fontSize="12" fill="white">Pay</text><text x="22" y="11" fontFamily="Arial" fontWeight="bold" fontSize="12" fill="#00B4E6">Pal</text></svg> · {plan.priceDisplay}</>)}
                  </button>
                ) : (
                  <button onClick={() => navigate("/dashboard")} className="w-full py-2.5 rounded-xl text-sm font-bold text-white/70 border border-white/20 hover:border-white/40 transition-colors">{t('startFree')}</button>
                )}
              </div>
            </div>
            <div className="text-center pb-2"><span className="text-white/20 text-xs tracking-widest">MANIFIESTO.APP</span></div>
          </div>
        ))}
      </div>
      <BottomNavigation />
    </div>
  );
}
