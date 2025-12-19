"use client";

import { useEffect, useState } from "react";

type Signup = {
  id: string;
  created_at: string;
  name: string;
  instagram: string | null;
  phone: string | null;
  city: string | null;
  note: string | null;
  status: string;
};

export default function SignupsPanel() {
  const [rows, setRows] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/freestyle/signups", { cache: "no-store" });
    const json = await res.json();
    setRows(json?.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">Freestyle Signups</h2>
        <button className="btn btn-ghost" onClick={load}>
          {loading ? "A carregar..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 && !loading && (
          <div className="text-white/60 text-sm">Ainda sem pedidos.</div>
        )}

        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-white/50">
                {new Date(r.created_at).toLocaleString()}
              </div>
            </div>

            <div className="mt-2 text-sm text-white/75 grid gap-1">
              {r.instagram && <div>IG: {r.instagram}</div>}
              {r.phone && <div>Tel: {r.phone}</div>}
              {r.city && <div>Cidade: {r.city}</div>}
              {r.note && <div className="text-white/60">Nota: {r.note}</div>}
              <div className="text-white/50 text-xs">Status: {r.status}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
