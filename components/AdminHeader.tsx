"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

type UserInfo = { email: string | null };

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setUser({ email: data.user?.email ?? null });
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push("/admin/login");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const isActive = (href: string) =>
    pathname.startsWith(href) ? "btn btn-primary" : "btn btn-ghost";

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl">
            <span className="text-buns-yellow">BUNS</span> Admin
          </span>
          <nav className="ml-4 flex gap-2">
            <a className={isActive("/admin/orders")} href="/admin/orders">
              Pedidos
            </a>
            <a className={isActive("/admin/ping")} href="/admin/ping">
              Ping
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user?.email && (
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
              {user.email}
            </span>
          )}
          <button className="btn btn-primary" onClick={logout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
