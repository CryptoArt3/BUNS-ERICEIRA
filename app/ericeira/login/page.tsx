'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "BUNS-2025";

export default function EriceiraLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const typed = password.trim();

    if (typed === ADMIN_PASSWORD) {
      // Cookie compatível com middleware (value=1 é o mais simples)
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = [
        "ericeira_admin=1",
        "Path=/",
        "Max-Age=31536000",
        "SameSite=Lax",
        isHttps ? "Secure" : "",
      ].filter(Boolean).join("; ");

      // Força a atualização e evita histórico estranho
      router.replace("/ericeira");
      router.refresh();
      return;
    }

    setError("Password incorreta.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4"
      >
        <h1 className="font-display text-2xl text-center text-buns-yellow">
          ERICEIRA · ADMIN
        </h1>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2 text-white outline-none"
        />

        {error && (
          <div className="text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full">
          Entrar
        </button>

        <div className="text-xs text-white/40 text-center">
          acesso restrito · buns freestyle
        </div>
      </form>
    </main>
  );
}
