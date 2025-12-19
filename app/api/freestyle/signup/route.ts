import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabasePublicServer = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const instagram = body?.instagram ? String(body.instagram).trim() : null;
    const phone = String(body?.phone ?? "").trim(); // obrigatório
    const city = body?.city ? String(body.city).trim() : null;
    const note = body?.note ? String(body.note).trim() : null;

    if (!name) {
      return NextResponse.json({ error: "Nome/AKA é obrigatório." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Telemóvel é obrigatório." }, { status: 400 });
    }

    const { data, error } = await supabasePublicServer
      .from("freestyle_signups")
      .insert([{ name, instagram, phone, city, note }])
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
}
