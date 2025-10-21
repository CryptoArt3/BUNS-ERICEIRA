"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase/client";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthed(true);
      } else {
        if (pathname !== "/admin/login") router.push("/admin/login");
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setAuthed(true);
      } else {
        setAuthed(false);
        if (pathname !== "/admin/login") router.push("/admin/login");
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        A verificar sessão…
      </div>
    );
  }

  // Se estiver autenticado, mostra conteúdo
  if (authed) return <>{children}</>;

  // Se não, mostra o login
  if (pathname === "/admin/login") return <>{children}</>;

  return null;
}
