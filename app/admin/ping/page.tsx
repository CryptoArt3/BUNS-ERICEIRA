"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function PingPage() {
  const [message, setMessage] = useState("");

  const testSelect = async () => {
    const { data, error } = await supabase.from("orders").select("*").limit(1);
    if (error) setMessage(`❌ SELECT erro: ${error.message}`);
    else setMessage(`✅ SELECT ok: ${data?.length || 0} linhas`);
  };

  const testInsert = async () => {
    const payload = {
      name: "Teste Local",
      phone: "911111111",
      address: "Rua XPTO 123",
      zone: "Ericeira",
      order_type: "delivery",
      items: [{ id: "test", name: "BUNS Classic", qty: 1, price: 7.9 }],
      subtotal: 7.9,
      delivery_fee: 2.5,
      total: 10.4,
      payment_method: "cash",
      status: "pending",
    };
    const { error, data } = await supabase.from("orders").insert([payload]).select("id");
    if (error) setMessage(`❌ INSERT erro: ${error.message}`);
    else setMessage(`✅ INSERT ok, id=${data?.[0]?.id}`);
  };

  return (
    <main className="p-6 text-white">
      <h1 className="text-3xl font-display mb-6">Ping Supabase</h1>
      <div className="flex gap-3 mb-6">
        <button onClick={testSelect} className="btn btn-primary">Testar SELECT</button>
        <button onClick={testInsert} className="btn btn-ghost">Testar INSERT</button>
      </div>
      <pre className="card p-4 text-sm whitespace-pre-wrap">{message}</pre>
    </main>
  );
}
