import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

const ADMIN_EMAIL = "ricardosantino.floresalvarez@gmail.com"; // cambia esto por tu email

interface Stats {
  totalUsers: number;
  totalTrips: number;
  totalPurchases: number;
  totalRevenue: number;
}

export default function Admin() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/dashboard");
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/admin/users", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
    ]).then(([usersData, statsData]) => {
      setUsers(usersData);
      setStats(statsData);
      setLoading(false);
    });
  }, [user]);

  if (isLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      Cargando panel...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">🛠️ Panel de Administrador</h1>
      <p className="text-gray-400 mb-8">Manifiesto App</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Usuarios", value: stats.totalUsers, icon: "👤" },
            { label: "Viajes", value: stats.totalTrips, icon: "✈️" },
            { label: "Compras", value: stats.totalPurchases, icon: "💳" },
            { label: "Ingresos", value: `$${(stats.totalRevenue / 100).toFixed(2)}`, icon: "💰" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Usuarios */}
      <h2 className="text-xl font-semibold mb-4">Usuarios registrados</h2>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Créditos</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="p-3 flex items-center gap-2">
                  {u.photoUrl && <img src={u.photoUrl} className="w-6 h-6 rounded-full" />}
                  {u.name}
                </td>
                <td className="p-3 text-gray-400">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    u.planType === "annual" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-600 text-gray-300"
                  }`}>
                    {u.planType || "free"}
                  </span>
                </td>
                <td className="p-3">{u.manifestCredits ?? 4}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
