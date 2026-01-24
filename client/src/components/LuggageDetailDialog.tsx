import { useRoute, useLocation } from "wouter";
import { useTrip } from "@/hooks/useTrips";
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

  // Usamos el hook de Firebase que me pasaste
  const { data: trip, isLoading: loadingTrip } = useTrip(params?.id || null);

  if (loadingTrip) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <Skeleton className="h-64 w-full rounded-[32px] bg-white/5" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Header Premium: ONTARIO CANADA */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <img 
          src={trip.imageUrl} 
          alt={trip.destination}
          className="w-full h-full object-cover opacity-50 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

        <div className="absolute top-8 left-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/")}
            className="bg-black/40 backdrop-blur-xl text-white hover:bg-white/10 rounded-full border border-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute bottom-12 left-10">
          <p className="text-blue-500 font-black tracking-[0.3em] text-[10px] uppercase mb-3 drop-shadow-lg">
            Travel Documentation System
          </p>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8]">
            {trip.destination}
          </h1>
        </div>
      </div>

      {/* Contenido de Maletas */}
      <div className="px-10 -mt-10 relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold italic uppercase tracking-tight">Equipaje</h2>
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-1">Gestión de inventario y precintos</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-12 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Plus className="h-5 w-5 mr-2" /> Registrar Maleta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trip.luggage?.map((item: any) => (
            <Card 
              key={item.id}
              className="bg-[#121417] border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group overflow-hidden rounded-[38px] shadow-2xl"
              onClick={() => {
                setSelectedLuggage(item);
                setIsDialogOpen(true);
              }}
            >
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-blue-500/20 transition-colors border border-white/5">
                    <LuggageIcon className="h-7 w-7 text-white/60 group-hover:text-blue-400" />
                  </div>
                  {item.certificateHash && (
                    <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck className="h-4 w-4" /> Certificada
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">
                    {item.nickname || item.brand || "Sin Nombre"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      {item.type || "Estándar"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      Size {item.size || "M"}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
                     Detalles del Manifiesto →
                   </span>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500 text-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Aquí iría tu lógica de delete
                    }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Diálogo que recuperamos antes */}
      {selectedLuggage && (
        <LuggageDetailDialog 
          luggage={selectedLuggage}
          trip={trip}
          user={{ name: "Ricardo E. Flores", email: "ricardo@example.com" }}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
}