// app/freestyle/components/CardRaritiesInfo.tsx
import { ShieldCheck, Users, Flame, Crown, Sparkles } from "lucide-react";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function toneTheme(tone: "classic" | "rare" | "epic" | "legendary") {
  switch (tone) {
    case "legendary":
      return {
        ring: "border-[#ffcc33]/65",
        bg: "bg-[radial-gradient(circle_at_18%_12%,rgba(255,204,51,0.42),transparent_45%),radial-gradient(circle_at_84%_42%,rgba(255,120,0,0.22),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.40))]",
        glow: "shadow-[0_0_40px_rgba(255,204,51,0.20)]",
        icon: "text-[#ffcc33]",
        bullet: "bg-[#ffcc33]/70",
        tag: "border-[#ffcc33]/55 bg-[#ffcc33]/12 text-[#ffe7a1]",
      };
    case "epic":
      return {
        ring: "border-[#a855f7]/60",
        bg: "bg-[radial-gradient(circle_at_18%_12%,rgba(168,85,247,0.38),transparent_48%),radial-gradient(circle_at_84%_44%,rgba(99,102,241,0.20),transparent_62%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.42))]",
        glow: "shadow-[0_0_40px_rgba(168,85,247,0.18)]",
        icon: "text-[#d8b4fe]",
        bullet: "bg-[#a855f7]/70",
        tag: "border-[#a855f7]/55 bg-[#a855f7]/12 text-[#f1ddff]",
      };
    case "rare":
      return {
        ring: "border-[#22d3ee]/60",
        bg: "bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.36),transparent_50%),radial-gradient(circle_at_84%_44%,rgba(59,130,246,0.18),transparent_64%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.42))]",
        glow: "shadow-[0_0_40px_rgba(34,211,238,0.16)]",
        icon: "text-[#67e8f9]",
        bullet: "bg-[#22d3ee]/75",
        tag: "border-[#22d3ee]/55 bg-[#22d3ee]/12 text-[#d6fbff]",
      };
    default:
      return {
        ring: "border-white/16",
        bg: "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.10),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.46))]",
        glow: "shadow-[0_0_0_1px_rgba(255,255,255,0.10)]",
        icon: "text-white/80",
        bullet: "bg-white/45",
        tag: "border-white/16 bg-black/35 text-white/80",
      };
  }
}

function RarityCard({
  title,
  subtitle,
  perks,
  tone,
}: {
  title: string;
  subtitle: string;
  perks: string[];
  tone: "classic" | "rare" | "epic" | "legendary";
}) {
  const t = toneTheme(tone);

  return (
    <div className={cx("rounded-3xl border overflow-hidden", t.ring, t.glow)}>
      <div className={cx("p-5", t.bg)}>
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl border border-white/10 bg-black/35 grid place-items-center">
            <Sparkles className={cx("h-5 w-5", t.icon)} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-display text-lg text-white">{title}</div>
              <span className={cx("ml-auto rounded-full border px-2 py-0.5 text-[11px]", t.tag)}>
                {tone.toUpperCase()}
              </span>
            </div>
            <div className="mt-1 text-xs text-white/65 leading-relaxed">{subtitle}</div>
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-white/80">
          {perks.map((p) => (
            <li key={p} className="flex gap-2">
              <span className={cx("mt-[7px] h-1.5 w-1.5 rounded-full", t.bullet)} />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CardRaritiesInfo() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-buns-yellow" />
        <h3 className="font-display text-xl">Sistema de Cartas</h3>
        <span className="ml-auto text-xs text-white/50 tracking-[0.18em]">RARITY RULESET</span>
      </div>

      <p className="mt-3 text-white/75 text-sm sm:text-base leading-relaxed max-w-3xl">
        As cartas evoluem com desempenho e presença na Arena. Isto não é “pontos”: é reputação e prova real.
        Com apenas 8 spots por sessão, a carta ajuda a decidir quem entra quando a lista está cheia.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <RarityCard
          tone="classic"
          title="CLASSIC"
          subtitle="Entrada base. Começa a construir arquivo e consistência."
          perks={[
            "Elegível para seleção normal (quando há vagas).",
            "Ganha badges por presença e primeiras vitórias.",
            "Prioridade neutra em sessões cheias.",
          ]}
        />
        <RarityCard
          tone="rare"
          title="RARE"
          subtitle="Já provou na roda. Presença e estabilidade."
          perks={[
            "Tie-break favorável em sessões cheias.",
            "Convites para tryouts quando há dúvidas.",
            "Assiduidade alta desbloqueia badge ‘Reliable’.",
          ]}
        />
        <RarityCard
          tone="epic"
          title="EPIC"
          subtitle="Impacto real. Entra forte e mantém consistência."
          perks={[
            "Prioridade clara em lista de espera.",
            "Mais probabilidade de entrar em match-ups grandes.",
            "Acesso a ‘Highlight Slot’ quando existir arquivo.",
          ]}
        />
        <RarityCard
          tone="legendary"
          title="LEGENDARY"
          subtitle="Topo da cadeia. Puxa o nível do evento."
          perks={[
            "Pré-seleção para main battles (quando existir).",
            "Presença garantida em sessões críticas (se confirmar).",
            "Destaque na TV/Leaderboard (Arena Face).",
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
          <div className="flex items-center gap-2 text-white">
            <Flame className="h-5 w-5 text-amber-300" />
            <div className="font-semibold">Como evolui</div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Vitórias e finais sobem reputação (prova em palco).</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Assiduidade (presença confirmada) acelera evolução.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Badges desbloqueiam com marcos (sem grind artificial).</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
          <div className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-buns-yellow" />
            <div className="font-semibold">Seleção (8 spots)</div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Confirmados primeiro. Depois lista de espera.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Em empate: raridade + assiduidade + performance recente.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>Objetivo: roda justa, evento forte, nível alto.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
          <div className="flex items-center gap-2 text-white">
            <Crown className="h-5 w-5 text-buns-yellow" />
            <div className="font-semibold">Badges (exemplos)</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "FIRST BLOOD",
              "FINALIST",
              "CROWD FAVORITE",
              "NO CHOKE",
              "2X WIN",
              "ARENA READY",
              "RELIABLE",
              "HIGHLIGHT",
            ].map((b) => (
              <span
                key={b}
                className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/75"
              >
                {b}
              </span>
            ))}
          </div>

          <p className="mt-3 text-xs text-white/50">
            Badges servem para identidade e arquivo — não para “farmar”.
          </p>
        </div>
      </div>
    </div>
  );
}
