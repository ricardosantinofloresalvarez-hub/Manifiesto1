import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

const ADMIN_EMAIL = "ricardosantino.floresalvarez@gmail.com";

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
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newCredits, setNewCredits] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const adminId = JSON.parse(localStorage.getItem("user") || "{}").id;

  useEffect(() => {
    if (!isLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/dashboard");
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/admin/users?userId=${adminId}`).then(r => r.json()),
      fetch(`/api/admin/stats?userId=${adminId}`).then(r => r.json()),
    ]).then(([usersData, statsData]) => {
      setUsers(usersData);
      setStats(statsData);
      setLoading(false);
    });
  }, [user]);

  const handleUpdateCredits = async () => {
    if (!editingUser) return;
    setSaving(true);
    await fetch(`/api/admin/users/${editingUser.id}/credits?userId=${adminId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credits: newCredits }),
    });
    setUsers(users.map(u => u.id === editingUser.id ? { ...u, manifestCredits: newCredits } : u));
    setEditingUser(null);
    setSaving(false);
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      Cargando panel...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-1">🛠️ Panel de Administrador</h1>
      <p className="text-gray-400 mb-6 text-sm">Manifiesto App</p>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Usuarios", value: stats.totalUsers, icon: "👤" },
            { label: "Viajes", value: stats.totalTrips, icon: "✈️" },
            { label: "Compras", value: stats.totalPurchases, icon: "💳" },
            { label: "Ingresos", value: `$${Number(stats.totalRevenue).toFixed(2)}`, icon: "💰" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-4">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Usuarios ({filtered.length})</h2>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 w-64 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Créditos</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="p-3 flex items-center gap-2">
                  {u.photoUrl && <img src={u.photoUrl} className="w-6 h-6 rounded-full" />}
                  {u.name}
                </td>
                <td className="p-3 text-gray-400 text-xs">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    u.planType === "annual" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-600 text-gray-300"
                  }`}>
                    {u.planType || "free"}
                  </span>
                </td>
                <td className="p-3 font-bold">{u.manifestCredits ?? 4}</td>
                <td className="p-3">
                  <button
                    onClick={() => { setEditingUser(u); setNewCredits(u.manifestCredits ?? 4); }}
                    className="text-xs px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-1">Ajustar créditos</h3>
            <p className="text-gray-400 text-sm mb-4">{editingUser.name} — {editingUser.email}</p>
            <input
              type="number"
              value={newCredits}
              onChange={e => setNewCredits(Number(e.target.value))}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg mb-4 text-center text-xl font-bold focus:outline-none"
              min={0}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 rounded-xl text-sm text-gray-400 border border-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateCredits}
                disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
