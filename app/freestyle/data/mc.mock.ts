// app/freestyle/data/mc.mock.ts

export type MCStyle = "Punch" | "Flow" | "Tech" | "Crowd";
export type MCTier = "Rookie" | "Challenger" | "Veteran" | "Champion";

export type MCCardModel = {
  id: string;
  aka: string;
  city: string;
  style: MCStyle;
  tier: MCTier;
  stats: {
    battles: number;
    wins: number;
    finals: number;
  };
  badges: string[];
  photo?: string; // ✅ caminho manual (ex: "/freestyle/mcs/mc_neon.jpg")
  rarity?: "CLASSIC" | "RARE" | "EPIC" | "LEGENDARY"; // opcional (se quiseres forçar raridade)
};

export const MC_POOL: MCCardModel[] = [
  {
    id: "mc_neon",
    aka: "MC NEON",
    city: "Ericeira",
    style: "Flow",
    tier: "Challenger",
    stats: { battles: 6, wins: 4, finals: 1 },
    badges: ["SESSION 0", "FIRST WIN", "FINALIST"],
    photo: "/freestyle/mcs/mc_neon.jpg",
    rarity: "RARE",
  },
  {
    id: "mc_rift",
    aka: "MC RIFT",
    city: "Lisboa",
    style: "Punch",
    tier: "Rookie",
    stats: { battles: 2, wins: 1, finals: 0 },
    badges: ["SESSION 0"],
    photo: "/freestyle/mcs/mc_rift.jpg",
    rarity: "CLASSIC",
  },
  {
    id: "mc_static",
    aka: "MC STATIC",
    city: "Sintra",
    style: "Tech",
    tier: "Veteran",
    stats: { battles: 10, wins: 6, finals: 2 },
    badges: ["SESSION 0", "STREAK x3", "FINALIST"],
    photo: "/freestyle/mcs/mc_static.jpg",
    rarity: "EPIC",
  },
  {
    id: "mc_noise",
    aka: "MC NOISE",
    city: "Mafra",
    style: "Crowd",
    tier: "Rookie",
    stats: { battles: 3, wins: 1, finals: 0 },
    badges: ["SESSION 0"],
    photo: "/freestyle/mcs/mc_noise.jpg",
    rarity: "CLASSIC",
  },
  {
    id: "mc_vandal",
    aka: "MC VANDAL",
    city: "Cascais",
    style: "Punch",
    tier: "Challenger",
    stats: { battles: 7, wins: 4, finals: 1 },
    badges: ["SESSION 0", "CROWD PICK"],
    photo: "/freestyle/mcs/mc_vandal.jpg",
    rarity: "RARE",
  },
  {
    id: "mc_kernel",
    aka: "MC KERNEL",
    city: "Porto",
    style: "Tech",
    tier: "Rookie",
    stats: { battles: 1, wins: 0, finals: 0 },
    badges: ["SESSION 0"],
    photo: "/freestyle/mcs/mc_kernel.jpg",
    rarity: "CLASSIC",
  },
  {
    id: "mc_flux",
    aka: "MC FLUX",
    city: "Setúbal",
    style: "Flow",
    tier: "Veteran",
    stats: { battles: 9, wins: 5, finals: 2 },
    badges: ["SESSION 0", "FINALIST"],
    photo: "/freestyle/mcs/mc_flux.jpg",
    rarity: "EPIC",
  },
  {
    id: "mc_shadow",
    aka: "MC SHADOW",
    city: "Amadora",
    style: "Crowd",
    tier: "Champion",
    stats: { battles: 12, wins: 9, finals: 3 },
    badges: ["SESSION 0", "CHAMPION", "HALL OF FLAME"],
    photo: "/freestyle/mcs/mc_shadow.jpg",
    rarity: "LEGENDARY",
  },
];
