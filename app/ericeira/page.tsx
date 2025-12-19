// app/ericeira/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Trash2, Save, RotateCcw } from "lucide-react";

// Preview 1:1 do que o público vê
import MCCard from "../freestyle/components/MCCard";

type SessionStatus = "LIVE" | "NEXT" | "ARCHIVE";
type Tier = "Rookie" | "Challenger" | "Veteran" | "Champion";

type AdminMC = {
  id: string;
  name: string;
  city: string;
  style: string;
  tier: Tier;
  battles: number;
  wins: number;
  finals: number;
  badges: string[];
  photo?: string;
};

type AdminState = {
  sessionName: string;
  status: SessionStatus;
  champion: string;
  mcs: AdminMC[];
  selectedId: string;
};

const STORAGE_KEY = "ericeira_admin_state_v1";

const DEFAULT_STATE: AdminState = {
  sessionName: "Session 0",
  status: "LIVE",
  champion: "MC Neon",
  selectedId: "mc_neon",
  mcs: [
    {
      id: "mc_neon",
      name: "MC Neon",
      city: "Ericeira",
      style: "Flow",
      tier: "Challenger",
      battles: 6,
      wins: 4,
      finals: 1,
      badges: ["SESSION 0", "FIRST WIN", "FINALIST"],
    },
  ],
};

function safeIdFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function clampInt(v: any) {
  const n = Number(v);
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function EriceiraAdminPage() {
  const [state, setState] = useState<AdminState>(DEFAULT_STATE);
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AdminState;
      if (parsed?.mcs?.length) setState(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedMC = useMemo(() => {
    return state.mcs.find((m) => m.id === state.selectedId) ?? state.mcs[0];
  }, [state.mcs, state.selectedId]);

  // EXPORT compatível com app/freestyle/data/mc.mock.ts (aka + stats)
  const exportMCs = useMemo(() => {
    const mapped = state.mcs.map((m) => ({
      id: m.id,
      aka: m.name,
      city: m.city,
      style: m.style,
      tier: m.tier,
      stats: { battles: m.battles, wins: m.wins, finals: m.finals },
      badges: m.badges,
      // se quiseres evoluir: photo: m.photo,
    }));
    return `export const MC_POOL = ${JSON.stringify(mapped, null, 2)};\n`;
  }, [state.mcs]);

  const exportSessions = useMemo(() => {
    const sid = safeIdFromName(state.sessionName || "session");
    return `export const SESSIONS = [
  {
    id: "${sid}",
    name: "${state.sessionName}",
    status: "${state.status}",
    champion: "${state.champion}",
  },
];\n`;
  }, [state.sessionName, state.status, state.champion]);

  const exportAll = useMemo(() => {
    return `${exportMCs}\n${exportSessions}`;
  }, [exportMCs, exportSessions]);

  function updateSelected(patch: Partial<AdminMC>) {
    setState((prev) => ({
      ...prev,
      mcs: prev.mcs.map((m) =>
        m.id === prev.selectedId ? { ...m, ...patch } : m
      ),
    }));
  }

  function addMC() {
    setState((prev) => {
      const newId = `mc_${Date.now()}`;
      const next: AdminMC = {
        id: newId,
        name: "New MC",
        city: "Ericeira",
        style: "Flow",
        tier: "Rookie",
        battles: 0,
        wins: 0,
        finals: 0,
        badges: ["SESSION 0"],
      };
      return { ...prev, mcs: [next, ...prev.mcs], selectedId: newId };
    });
  }

  function removeSelected() {
    setState((prev) => {
      if (prev.mcs.length <= 1) return prev;
      const nextList = prev.mcs.filter((m) => m.id !== prev.selectedId);
      return { ...prev, mcs: nextList, selectedId: nextList[0].id };
    });
  }

  function resetAll() {
    setState(DEFAULT_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setToast("Reset feito.");
  }

  async function onCopy(text: string, label: string) {
    const ok = await copyToClipboard(text);
    setToast(ok ? `${label} copiado.` : `Falhou copiar ${label}.`);
  }

  // Preview para o MCCard (formato “compatível”)
  const previewMC = useMemo(() => {
    if (!selectedMC) return null;
    return {
      id: selectedMC.id,
      aka: selectedMC.name,
      city: selectedMC.city,
      style: selectedMC.style,
      tier: selectedMC.tier,
      stats: {
        battles: selectedMC.battles,
        wins: selectedMC.wins,
        finals: selectedMC.finals,
      },
      badges: selectedMC.badges,
      photo: selectedMC.photo,
    };
  }, [selectedMC]);

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 space-y-8 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-[-20%] h-[60vh] w-[130vw] -translate-x-1/2 rounded-[999px] blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(255,200,0,0.75) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
      </div>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-buns-yellow">
            ERICEIRA · ADMIN CONTROL
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Admin manual (local). Export → colar nos mocks (agora 100% compatível).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCopy(exportAll, "Tudo")}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar tudo
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="btn btn-ghost inline-flex items-center gap-2"
            title="Reset total"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Session Control</h2>
              <div className="text-xs text-white/50">autosave ativo</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-white/60 mb-1">
                  Nome da sessão
                </label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={state.sessionName}
                  onChange={(e) =>
                    setState((p) => ({ ...p, sessionName: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Estado</label>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={state.status}
                  onChange={(e) =>
                    setState((p) => ({
                      ...p,
                      status: e.target.value as SessionStatus,
                    }))
                  }
                >
                  <option value="LIVE">LIVE</option>
                  <option value="NEXT">NEXT</option>
                  <option value="ARCHIVE">ARCHIVE</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs text-white/60 mb-1">
                  Champion (texto)
                </label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  placeholder="Champion"
                  value={state.champion}
                  onChange={(e) =>
                    setState((p) => ({ ...p, champion: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">MC Control</h2>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addMC}
                  className="btn btn-ghost inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add MC
                </button>

                <button
                  type="button"
                  onClick={removeSelected}
                  className="btn btn-ghost inline-flex items-center gap-2"
                  disabled={state.mcs.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="block text-xs text-white/60 mb-1">
                  Selecionar MC
                </label>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={state.selectedId}
                  onChange={(e) =>
                    setState((p) => ({ ...p, selectedId: e.target.value }))
                  }
                >
                  {state.mcs.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.city} · {m.tier}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-white/60 mb-1">Nome</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={selectedMC?.name ?? ""}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Tier</label>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={(selectedMC?.tier ?? "Rookie") as Tier}
                  onChange={(e) => updateSelected({ tier: e.target.value as Tier })}
                >
                  <option value="Rookie">Rookie</option>
                  <option value="Challenger">Challenger</option>
                  <option value="Veteran">Veteran</option>
                  <option value="Champion">Champion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Cidade</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={selectedMC?.city ?? ""}
                  onChange={(e) => updateSelected({ city: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Style</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={selectedMC?.style ?? ""}
                  onChange={(e) => updateSelected({ style: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Battles</label>
                  <input
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                    value={selectedMC?.battles ?? 0}
                    onChange={(e) => updateSelected({ battles: clampInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Wins</label>
                  <input
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                    value={selectedMC?.wins ?? 0}
                    onChange={(e) => updateSelected({ wins: clampInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Finals</label>
                  <input
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                    value={selectedMC?.finals ?? 0}
                    onChange={(e) => updateSelected({ finals: clampInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs text-white/60 mb-1">
                  Badges (separar por vírgula)
                </label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2"
                  value={(selectedMC?.badges ?? []).join(", ")}
                  onChange={(e) =>
                    updateSelected({
                      badges: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs text-white/60 mb-1">
                  ID (fixo)
                </label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white/70"
                  value={selectedMC?.id ?? ""}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Export (colar nos mocks)</h2>
              <div className="text-xs text-white/50 inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                pronto a copiar
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">mc.mock.ts</div>
                  <button
                    type="button"
                    onClick={() => onCopy(exportMCs, "MC_POOL")}
                    className="btn btn-ghost inline-flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar MC_POOL
                  </button>
                </div>

                <textarea
                  readOnly
                  className="w-full min-h-[240px] rounded-2xl bg-black/60 border border-white/10 p-4 text-xs"
                  value={exportMCs}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">sessions.mock.ts</div>
                  <button
                    type="button"
                    onClick={() => onCopy(exportSessions, "SESSIONS")}
                    className="btn btn-ghost inline-flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar SESSIONS
                  </button>
                </div>

                <textarea
                  readOnly
                  className="w-full min-h-[240px] rounded-2xl bg-black/60 border border-white/10 p-4 text-xs"
                  value={exportSessions}
                />
              </div>
            </div>

            <div className="text-xs text-white/50">
              Depois de colares nos mocks, faz refresh do /freestyle.
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="text-sm text-white/60">Preview</div>
            <div className="mt-2 text-lg font-semibold">
              {state.sessionName} ·{" "}
              <span className="text-buns-yellow">{state.status}</span>
            </div>
            <div className="mt-1 text-sm text-white/70">
              Champion: <span className="text-white">{state.champion}</span>
            </div>

            <div className="mt-5">
              {previewMC ? <MCCard mc={previewMC as any} /> : null}
            </div>

            <div className="mt-4 text-xs text-white/50">
              Preview usa o mesmo formato do mc.mock.ts.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="text-sm font-semibold">Checklist mensal</div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>1) Atualizar stats do vencedor e finalistas</li>
              <li>2) Trocar status LIVE/NEXT/ARCHIVE</li>
              <li>3) Copiar exports e colar nos mocks</li>
              <li>4) Confirmar /freestyle no mobile</li>
            </ul>
          </div>
        </aside>
      </section>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      ) : null}

      <footer className="pt-2 text-center text-xs text-white/40">
        ericeira é admin manual · freestyle é código estável
      </footer>
    </main>
  );
}
