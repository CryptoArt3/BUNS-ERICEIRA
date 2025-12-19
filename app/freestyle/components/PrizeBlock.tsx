// app/freestyle/components/PrizeBlock.tsx
import { Crown, Trophy, Ticket, Sparkles, Share2, Youtube, Instagram } from "lucide-react";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function PerkRow({
  icon,
  title,
  desc,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone?: "winner" | "neutral";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-4",
        tone === "winner"
          ? "border-buns-yellow/35 bg-buns-yellow/10"
          : "border-white/10 bg-black/25"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "h-10 w-10 rounded-2xl border grid place-items-center",
            tone === "winner"
              ? "border-buns-yellow/30 bg-black/35 text-buns-yellow"
              : "border-white/10 bg-black/35 text-white/75"
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-white">{title}</div>
            {tone === "winner" ? (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-buns-yellow/35 bg-buns-yellow/10 px-2 py-0.5 text-[11px] text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                WINNER
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-white/70 leading-relaxed">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function PrizeBlock() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 overflow-hidden">
      {/* subtle backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-64 -z-10 blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(255,200,0,0.65) 0%, rgba(255,80,0,0.35) 35%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-300" />
        <h3 className="font-display text-2xl sm:text-3xl">Prémios da Arena</h3>
        <span className="ml-auto text-xs text-white/50 tracking-[0.18em]">PRIZE POOL</span>
      </div>

      <p className="mt-3 text-white/75 text-sm sm:text-base leading-relaxed max-w-3xl">
        A BUNS Freestyle não é só batalha — é arquivo, exposição e progressão real.
        Quem entra na roda entra na história.
      </p>

      {/* Winner Hero */}
      <div className="mt-6 rounded-3xl border border-buns-yellow/30 bg-buns-yellow/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-buns-yellow/30 bg-black/30 px-3 py-1 text-xs text-amber-100">
              <Crown className="h-4 w-4 text-buns-yellow" />
              VENCEDOR DA SESSÃO
            </div>

            <div className="mt-3 flex items-end gap-3">
              <div className="font-display text-4xl sm:text-5xl text-white leading-none">
                50 <span className="text-buns-yellow">BUNS</span>
              </div>
              <div className="text-white/60 text-sm pb-1">
                prémio direto · “BUNS PRÉMIO”
              </div>
            </div>

            <div className="mt-3 text-white/70 text-sm leading-relaxed max-w-xl">
              O campeão leva o prémio, a carta da vitória e destaque total. A arena
              regista — e o público vê.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div className="text-xs tracking-[0.22em] text-white/55">PACK DO CAMPEÃO</div>
            <div className="mt-1 text-white/80 text-sm">
              dinheiro · NFT · exposição · topo do ranking
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <PerkRow
            tone="winner"
            icon={<Ticket className="h-5 w-5" />}
            title="Carta NFT da Vitória"
            desc="Uma carta única do campeão (prova de vitória) para o arquivo da BUNS."
          />
          <PerkRow
            tone="winner"
            icon={<Share2 className="h-5 w-5" />}
            title="Exposição total"
            desc="Destaque no site e reels/clipes: YouTube, TikTok e Instagram."
          />
        </div>
      </div>

      {/* Everyone gets */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-buns-yellow" />
            <div className="font-semibold">Para todos os participantes</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PerkRow
              icon={<Youtube className="h-5 w-5" />}
              title="Exposição (YouTube/TikTok)"
              desc="Clipes, highlights e arquivo de sessões para promover o teu nome."
            />
            <PerkRow
              icon={<Instagram className="h-5 w-5" />}
              title="Exposição (Instagram + Site)"
              desc="Recaps, cards e presença no site para quem quer crescer e ser visto."
            />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs tracking-[0.22em] text-white/55">REGRA BASE</div>
            <div className="mt-1 text-white/75 text-sm leading-relaxed">
              Entraste na roda = entraste no arquivo. Cada battle conta para o ranking e
              para as seleções futuras.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
          <div className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-amber-300" />
            <div className="font-semibold">Ranking anual</div>
          </div>

          <p className="mt-3 text-white/75 text-sm leading-relaxed">
            Todos entram no <span className="text-white">Ranking BUNS Freestyle</span> — base para
            entrega de prémios anuais.
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs tracking-[0.22em] text-white/55">CRITÉRIOS (DEMO)</div>
            <ul className="mt-2 space-y-2 text-sm text-white/75">
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/40" />
                <span>Vitórias + finais + participação.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/40" />
                <span>Assiduidade e consistência aumentam peso.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/40" />
                <span>Objetivo: elevar nível e manter justiça.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Nota: regras e prémios podem evoluir por temporada, mantendo transparência.
          </div>
        </div>
      </div>
    </section>
  );
}
