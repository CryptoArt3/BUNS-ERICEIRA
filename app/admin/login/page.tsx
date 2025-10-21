"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/admin/orders");
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleLogin}
        className="bg-white/10 p-8 rounded-xl flex flex-col gap-4 w-[320px]"
      >
        <h1 className="text-2xl font-display text-center">BUNS Admin</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 rounded bg-white/10 text-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-3 py-2 rounded bg-white/10 text-white"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-buns-yellow text-black py-2 rounded hover:opacity-80"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </form>
    </main>
  );
}
