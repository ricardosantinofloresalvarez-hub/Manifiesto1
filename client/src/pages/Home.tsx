import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: trips, isLoading } = useQuery({
    queryKey: ["/api/trips"],
    queryFn: async () => {
      const tripsCol = collection(db, "trips");
      const tripSnapshot = await getDocs(tripsCol);
      return tripSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <header className="mb-12 mt-8">
        <p className="text-blue-500 font-black tracking-[0.3em] text-[10px] uppercase mb-2">
          Global Logistics Panel
        </p>
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">
          Mis Viajes
        </h1>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[32px] bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips?.map((trip: any) => (
            <Link key={trip.id} href={`/trip/${trip.id}`}>
              <Card className="bg-[#121417] border-white/5 hover:border-blue-500/40 transition-all cursor-pointer group overflow-hidden rounded-[32px] relative shadow-2xl">
                <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                  <img src={trip.imageUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <MapPin className="h-5 w-5 text-blue-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
                      {trip.destination}
                    </h3>
                    <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {trip.startDate}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}