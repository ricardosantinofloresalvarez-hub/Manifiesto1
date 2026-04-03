import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();

  useEffect(() => {
    const seen = localStorage.getItem('onboarding_seen');
    if (!seen) setShow(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem('onboarding_seen', 'true');
    setShow(false);
  };

  const steps = [
    {
      emoji: "🧳",
      title: "¿Perdiste tu maleta alguna vez?",
      desc: "Con Manifiesto registras todo lo que llevas y generas un respaldo verificable. Si algo pasa, tienes prueba.",
    },
    {
      emoji: "📋",
      title: "Crea tu viaje y agrega tus maletas",
      desc: "Registra cada artículo con su valor estimado. Fotos, marcas, cantidades — todo en un solo lugar.",
    },
    {
      emoji: "📄",
      title: "Genera tu certificado PDF con QR",
      desc: "Un documento verificable que puedes mostrar a aerolíneas, aduanas o aseguradoras. Tu palabra respaldada.",
    },
  ];

  if (!show) return null;

  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm p-6 border border-white/10 text-white">
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-gray-600'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{steps[step].emoji}</div>
          <h2 className="text-xl font-bold mb-3">{steps[step].title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{steps[step].desc}</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {isLast ? (
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition"
            >
              ¡Crear mi primer viaje! 🚀
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition"
            >
              Siguiente →
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition"
          >
            Saltar
          </button>
        </div>
      </div>
    </div>
  );
}
