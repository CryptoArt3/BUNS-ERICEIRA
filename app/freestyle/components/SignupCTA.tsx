"use client";

import { useMemo, useState } from "react";

const ADMIN_WHATSAPP = "351912607829";

function buildWhatsAppLink(message: string) {
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default function SignupCTA() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && phone.trim().length >= 6 && !loading;
  }, [name, phone, loading]);

  function submit() {
    setOkMsg("");
    setErrMsg("");

    const n = name.trim();
    const ig = instagram.trim();
    const p = phone.trim();
    const c = city.trim();
    const nt = note.trim();

    if (n.length < 2) {
      setErrMsg("Nome/AKA é obrigatório.");
      return;
    }
    if (p.length < 6) {
      setErrMsg("Telemóvel é obrigatório (mínimo 6 dígitos).");
      return;
    }

    setLoading(true);

    try {
      const message = [
        "BUNS FREESTYLE — Pedido de participação",
        "",
        `Nome / AKA: ${n}`,
        `Telemóvel: ${p}`,
        `Instagram: ${ig || "-"}`,
        `Cidade: ${c || "-"}`,
        `Nota: ${nt || "-"}`,
      ].join("\n");

      window.open(buildWhatsAppLink(message), "_blank", "noopener,noreferrer");

      setOkMsg("A abrir WhatsApp para enviar o pedido ao admin.");
      setName("");
      setInstagram("");
      setPhone("");
      setCity("");
      setNote("");
    } catch {
      setErrMsg("Não foi possível abrir o WhatsApp neste dispositivo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setOkMsg("");
          setErrMsg("");
        }}
        className="btn btn-primary"
      >
        Quero Participar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/80 p-6 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-buns-yellow">
                Entrar na Roda
              </h3>
              <button
                type="button"
                className="text-white/60 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-white/70 text-sm">
              O pedido será enviado diretamente para o WhatsApp do admin.
            </p>

            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3"
                placeholder="Nome / AKA *"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3"
                placeholder="Instagram (opcional)"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />

              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3"
                placeholder="Telemóvel *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
              <div className="text-xs text-white/50 -mt-1">
                Obrigatório para validação de presença.
              </div>

              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3"
                placeholder="Cidade (opcional)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <textarea
                className="w-full min-h-[90px] rounded-xl bg-black/40 border border-white/10 px-4 py-3"
                placeholder="Nota (ex: estilo, experiência, links...)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {okMsg && <div className="mt-3 text-sm text-green-300">{okMsg}</div>}
            {errMsg && <div className="mt-3 text-sm text-red-300">{errMsg}</div>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canSubmit}
                onClick={submit}
                title={!canSubmit ? "Preenche Nome/AKA e Telemóvel" : undefined}
              >
                {loading ? "A abrir..." : "Enviar"}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
