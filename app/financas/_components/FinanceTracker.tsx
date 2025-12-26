"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Download,
  Upload,
  Calculator,
  ShieldCheck,
} from "lucide-react";

type Row = {
  id: string;
  date: string; // YYYY-MM-DD
  ericeiraEats: number;
  uberEats: number;
  boltFood: number;
  mb: number;
  cash: number;
  notes: string;
};

const STORAGE_KEY = "buns_financas_2025_v1";
const PASS = "Buns2025";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function n(v: unknown) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function money(v: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);
}

function sumRow(r: Row) {
  return r.ericeiraEats + r.uberEats + r.boltFood + r.mb + r.cash;
}

// aceita "63,55" ou "63.55" e até "1 234,50"
function parseMoney(input: string) {
  const cleaned = input
    .replace(/\s/g, "")
    .replace(/\./g, ".")
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "");

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export default function FinanceTracker() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false); // <- chave para não “apagar” no refresh

  // inputs como string (para permitir escrever vírgulas/pontos sem bloquear)
  const [form, setForm] = useState({
    date: todayISO(),
    ericeiraEats: "0",
    uberEats: "0",
    boltFood: "0",
    mb: "0",
    cash: "0",
    notes: "",
  });

  // LOAD (1x)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRows(parsed as Row[]);
    } catch (err) {
      console.error("FinanceTracker load error:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  // SAVE (só depois do loaded === true)
  useEffect(() => {
    if (!loaded) return;
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (err) {
      console.error("FinanceTracker save error:", err);
    }
  }, [rows, loaded]);

  const ordered = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (a.date < b.date ? 1 : -1)); // mais recente em cima
    return copy;
  }, [rows]);

  const totals = useMemo(() => {
    const t = {
      ericeiraEats: 0,
      uberEats: 0,
      boltFood: 0,
      mb: 0,
      cash: 0,
      grand: 0,
      days: rows.length,
    };
    for (const r of rows) {
      t.ericeiraEats += n(r.ericeiraEats);
      t.uberEats += n(r.uberEats);
      t.boltFood += n(r.boltFood);
      t.mb += n(r.mb);
      t.cash += n(r.cash);
      t.grand += sumRow(r);
    }
    return t;
  }, [rows]);

  const dayTotal = useMemo(() => {
    const fakeRow: Row = {
      id: "-",
      date: form.date,
      ericeiraEats: parseMoney(form.ericeiraEats),
      uberEats: parseMoney(form.uberEats),
      boltFood: parseMoney(form.boltFood),
      mb: parseMoney(form.mb),
      cash: parseMoney(form.cash),
      notes: form.notes,
    };
    return sumRow(fakeRow);
  }, [form]);

  function login() {
    if (pass === PASS) {
      setAuthed(true);
      setPass("");
    }
  }

  function addRow() {
    if (!form.date) return;

    const newRow: Row = {
      id: uid(),
      date: form.date,
      ericeiraEats: parseMoney(form.ericeiraEats),
      uberEats: parseMoney(form.uberEats),
      boltFood: parseMoney(form.boltFood),
      mb: parseMoney(form.mb),
      cash: parseMoney(form.cash),
      notes: String(form.notes ?? ""),
    };

    setRows((prev) => [newRow, ...prev]);

    setForm((p) => ({
      ...p,
      ericeiraEats: "0",
      uberEats: "0",
      boltFood: "0",
      mb: "0",
      cash: "0",
      notes: "",
    }));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buns-financas-2025.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const header = ["date", "ericeira_eats", "uber_eats", "bolt_food", "mb", "cash", "total", "notes"];
    const lines = [header.join(",")];

    const toCell = (v: unknown) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replaceAll('"', '""')}"`;
      }
      return s;
    };

    for (const r of [...rows].sort((a, b) => (a.date < b.date ? -1 : 1))) {
      lines.push(
        [
          r.date,
          r.ericeiraEats,
          r.uberEats,
          r.boltFood,
          r.mb,
          r.cash,
          sumRow(r),
          toCell(r.notes),
        ].join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buns-financas-2025.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJSON(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return;

    const cleaned: Row[] = parsed
      .filter((x) => x && typeof x === "object")
      .map((x: any) => ({
        id: String(x.id ?? uid()),
        date: String(x.date ?? ""),
        ericeiraEats: n(x.ericeiraEats),
        uberEats: n(x.uberEats),
        boltFood: n(x.boltFood),
        mb: n(x.mb),
        cash: n(x.cash),
        notes: String(x.notes ?? ""),
      }))
      .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));

    setRows(cleaned);
  }

  if (!authed) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-buns-yellow" />
          <h1 className="font-display text-2xl text-white">Finanças (Privado)</h1>
          <span className="ml-auto text-xs text-white/50 tracking-[0.18em]">LOCAL VAULT</span>
        </div>

        <p className="mt-3 text-white/75 text-sm leading-relaxed max-w-2xl">
          Esta página guarda os dados <span className="text-white">no teu browser</span>.
          Faz export JSON/CSV para backup quando quiseres.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            className="w-full sm:max-w-xs rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none focus:border-buns-yellow/40"
          />
          <button
            type="button"
            onClick={login}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-buns-yellow/30 bg-buns-yellow/15 px-4 py-3 text-amber-100 hover:bg-buns-yellow/20 transition"
          >
            <Unlock className="h-4 w-4" />
            Entrar
          </button>

          <Link href="/" className="btn btn-ghost sm:ml-auto">
            Voltar ao site
          </Link>
        </div>

        <div className="mt-4 text-xs text-white/45">
          Nota: isto é uma proteção simples. Se alguém tiver acesso ao teu browser/PC, consegue ver os dados.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-buns-yellow" />
        <h1 className="font-display text-2xl text-white">BUNS Finanças 2025</h1>
        <span className="ml-auto text-xs text-white/50 tracking-[0.18em]">FATURAÇÃO DIÁRIA</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <KPI label="Ericeira Eats" value={money(totals.ericeiraEats)} />
        <KPI label="Uber Eats" value={money(totals.uberEats)} />
        <KPI label="Bolt Food" value={money(totals.boltFood)} />
        <KPI label="MB" value={money(totals.mb)} />
        <KPI label="Cash" value={money(totals.cash)} />
        <KPI label="Total" value={money(totals.grand)} strong />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
        <div className="flex items-center gap-2 text-white">
          <Calculator className="h-5 w-5 text-amber-300" />
          <div className="font-semibold">Inserir dia</div>
          <div className="ml-auto text-xs text-white/50">
            Total do dia: <span className="text-white">{money(dayTotal)}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Data">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <MoneyField
            label="Ericeira Eats"
            value={form.ericeiraEats}
            onChange={(v) => setForm((p) => ({ ...p, ericeiraEats: v }))}
          />
          <MoneyField
            label="Uber Eats"
            value={form.uberEats}
            onChange={(v) => setForm((p) => ({ ...p, uberEats: v }))}
          />
          <MoneyField
            label="Bolt Food"
            value={form.boltFood}
            onChange={(v) => setForm((p) => ({ ...p, boltFood: v }))}
          />
          <MoneyField
            label="MB"
            value={form.mb}
            onChange={(v) => setForm((p) => ({ ...p, mb: v }))}
          />
          <MoneyField
            label="Cash"
            value={form.cash}
            onChange={(v) => setForm((p) => ({ ...p, cash: v }))}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <Field label="Notas">
            <input
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="ex: chuva, evento, dia forte..."
              className={inputCls}
            />
          </Field>

          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-buns-yellow/30 bg-buns-yellow/15 px-4 py-3 text-amber-100 hover:bg-buns-yellow/20 transition"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportJSON}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/75 hover:bg-black/40 transition"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/75 hover:bg-black/40 transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/75 hover:bg-black/40 transition cursor-pointer">
            <Upload className="h-4 w-4" />
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJSON(f);
                e.currentTarget.value = "";
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => setAuthed(false)}
            className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/75 hover:bg-black/40 transition"
          >
            <Lock className="h-4 w-4" />
            Bloquear
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center">
          <div className="text-sm text-white/80">
            Registos: <span className="text-white font-semibold">{rows.length}</span>
          </div>
          <div className="ml-auto text-xs text-white/50">
            Dica: exporta JSON de vez em quando (backup).
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="text-white/60">
              <tr className="border-b border-white/10">
                <Th>Data</Th>
                <Th align="right">Ericeira</Th>
                <Th align="right">Uber</Th>
                <Th align="right">Bolt</Th>
                <Th align="right">MB</Th>
                <Th align="right">Cash</Th>
                <Th align="right">Total</Th>
                <Th>Notas</Th>
                <Th align="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((r) => (
                <tr key={r.id} className="border-b border-white/10 text-white/80">
                  <Td>{r.date}</Td>
                  <Td align="right">{money(r.ericeiraEats)}</Td>
                  <Td align="right">{money(r.uberEats)}</Td>
                  <Td align="right">{money(r.boltFood)}</Td>
                  <Td align="right">{money(r.mb)}</Td>
                  <Td align="right">{money(r.cash)}</Td>
                  <Td align="right" className="text-white font-semibold">
                    {money(sumRow(r))}
                  </Td>
                  <Td className="max-w-[360px] truncate text-white/65">
                    {r.notes || "—"}
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 hover:bg-black/40 transition"
                      title="Apagar"
                    >
                      <Trash2 className="h-4 w-4" />
                      Apagar
                    </button>
                  </Td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-white/50">
                    Ainda não há registos. Adiciona o primeiro dia acima.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-white/45">
        Guardado localmente no teu browser. Se mudares de PC, usa{" "}
        <span className="text-white">Export JSON</span> e depois{" "}
        <span className="text-white">Import JSON</span>.
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none focus:border-buns-yellow/40";

function KPI({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
      <div className="text-[10px] tracking-[0.22em] text-white/50">{label}</div>
      <div className={cx("mt-1 font-display text-lg", strong ? "text-amber-200" : "text-white")}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[10px] tracking-[0.22em] text-white/55">{label}</div>
      {children}
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        placeholder="0,00"
      />
    </Field>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" | "left" }) {
  return (
    <th className={cx("px-5 py-3 font-semibold", align === "right" ? "text-right" : "text-left")}>
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align?: "right" | "left";
  className?: string;
}) {
  return (
    <td
      className={cx(
        "px-5 py-3",
        align === "right" ? "text-right tabular-nums" : "text-left",
        className
      )}
    >
      {children}
    </td>
  );
}
