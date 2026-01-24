import { useRoute, useLocation } from "wouter";
import { useTrip } from "@/hooks/useTrips";
import { useManifestItems } from "@/hooks/useManifestItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Luggage as LuggageIcon, Trash2, ShieldCheck } from "lucide-react";
import LuggageDetailDialog from "@/components/LuggageDetailDialog";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TripDetail() {
  const [, params] = useRoute("/trip/:id");
  const [, setLocation] = useLocation();
  const [selectedLuggage, setSelectedLuggage] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: trip, isLoading: loadingTrip } = useTrip(params?.id || null);

  if (loadingTrip) {
    return <div className="p-8"><Skeleton className="h-64 w-full rounded-3xl" /></div>;
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Header con diseño Premium */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img 
          src={trip.imageUrl} 
          alt={trip.destination}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        <div className="absolute top-6 left-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/")}
            className="bg-black/20 backdrop-blur-md text-white hover:bg-black/40 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-8 left-8">
          <p className="text-blue-400 font-bold tracking-[0.2em] text-xs uppercase mb-2">Destino Seleccionado</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
            {trip.destination}
          </h1>
        </div>
      </div>

      <div className="px-8 -mt-6 relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold italic uppercase tracking-tight">Equipaje Registrado</h2>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-bold text-xs uppercase tracking-widest">
            <Plus className="h-4 w-4 mr-2" /> Nueva Maleta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trip.luggage?.map((item: any) => (
            <Card 
              key={item.id}
              className="bg-[#121417] border-white/5 hover:border-blue-500/50 transition-all cursor-pointer group overflow-hidden rounded-[32px]"
              onClick={() => {
                setSelectedLuggage(item);
                setIsDialogOpen(true);
              }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-blue-500/10 transition-colors">
                    <LuggageIcon className="h-6 w-6 text-white/70 group-hover:text-blue-400" />
                  </div>
                  {item.certificateHash && (
                    <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3" /> Certificada
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 uppercase italic">{item.nickname || item.brand}</h3>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-widest">{item.type} • {item.size}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                   <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Ver Detalles</span>
                   <Trash2 className="h-4 w-4 text-white/10 hover:text-red-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <LuggageDetailDialog 
        luggage={selectedLuggage}
        trip={trip}
        user={{ name: "Ricardo E. Flores", email: "ricardo@example.com" }}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}