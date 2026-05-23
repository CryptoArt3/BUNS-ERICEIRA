export type BunsAdventuresEpisode = {
  id: string;
  number: string;
  title: string;
  overlayLabel: string;
  videoSrc: string;
  linkedUrl?: string;
};

const BUNS_ADVENTURES_VIDEO_VERSION = "adventures-v1";
const BUNS_ADVENTURES_INSTAGRAM_URL = "https://www.instagram.com/buns.ericeira/";

function withVideoVersion(videoSrc: string) {
  const separator = videoSrc.includes("?") ? "&" : "?";
  return `${videoSrc}${separator}v=${BUNS_ADVENTURES_VIDEO_VERSION}`;
}

export const bunsAdventuresCampaign = {
  id: "buns-adventures",
  title: "BUNS ADVENTURES",
  subtitle: "ERICEIRA STORIES",
  qrLabel: "SCAN TO FOLLOW THE STORY",
  videoVersion: BUNS_ADVENTURES_VIDEO_VERSION,
  episodes: [
    {
      id: "episode-01",
      number: "01",
      title: "Jogo da Bola",
      overlayLabel: "Episódio 01 — Jogo da Bola",
      videoSrc: withVideoVersion("/videos/buns-episode-01.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-02",
      number: "02",
      title: "Ribeira D'Ilhas",
      overlayLabel: "Episode 02 — Ribeira D'Ilhas",
      videoSrc: withVideoVersion("/videos/buns-episode-02.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-03",
      number: "03",
      title: "Skatepark",
      overlayLabel: "Episode 03 — Skatepark",
      videoSrc: withVideoVersion("/videos/buns-episode-03.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-04",
      number: "4",
      title: "Ouriço",
      overlayLabel: "Episódio 04 — Ouriço",
      videoSrc: withVideoVersion("/videos/buns-episode-04.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-05",
      number: "5",
      title: "Dia de Pesca",
      overlayLabel: "Episódio 05 — Dia de Pesca",
      videoSrc: withVideoVersion("/videos/buns-episode-05.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-06",
      number: "6",
      title: "Inverno",
      overlayLabel: "Episódio 06 — Inverno",
      videoSrc: withVideoVersion("/videos/buns-episode-06.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-07",
      number: "7",
      title: "Carnaval",
      overlayLabel: "Episódio 07 — Carnaval",
      videoSrc: withVideoVersion("/videos/buns-episode-07.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-08",
      number: "8",
      title: "Páscoa",
      overlayLabel: "Episódio 08 — Páscoa",
      videoSrc: withVideoVersion("/videos/buns-episode-08.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-09",
      number: "09",
      title: "Praia do Sul",
      overlayLabel: "Episódio 09 — Praia do Sul",
      videoSrc: withVideoVersion("/videos/buns-episode-09.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-10",
      number: "10",
      title: "Parque de Sta Marta",
      overlayLabel: "Episódio 10 — Parque de Sta Marta",
      videoSrc: withVideoVersion("/videos/buns-episode-10.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-11",
      number: "11",
      title: "Furnas",
      overlayLabel: "Episódio 11 — Furnas",
      videoSrc: withVideoVersion("/videos/buns-episode-11.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-12",
      number: "12",
      title: "Fontes",
      overlayLabel: "Episódio 12 — Fontes",
      videoSrc: withVideoVersion("/videos/buns-episode-12.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-13",
      number: "13",
      title: "Ribas",
      overlayLabel: "Episódio 13 — Ribas",
      videoSrc: withVideoVersion("/videos/buns-episode-13.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-14",
      number: "14",
      title: "Palácio de Mafra",
      overlayLabel: "Episódio 14 — Palácio de Mafra",
      videoSrc: withVideoVersion("/videos/buns-episode-14.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-15",
      number: "15",
      title: "Praia do Algodio",
      overlayLabel: "Episódio 15 — Praia do Algodio",
      videoSrc: withVideoVersion("/videos/buns-episode-15.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-16",
      number: "16",
      title: "Espiga",
      overlayLabel: "Episódio 16 — Espiga",
      videoSrc: withVideoVersion("/videos/buns-episode-16.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-17",
      number: "17",
      title: "Forte",
      overlayLabel: "Episódio 17 — Forte",
      videoSrc: withVideoVersion("/videos/buns-episode-17.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
    {
      id: "episode-18",
      number: "18",
      title: "Parque Campismo",
      overlayLabel: "Episódio 18 — Parque Campismo",
      videoSrc: withVideoVersion("/videos/buns-episode-18.mp4"),
      linkedUrl: BUNS_ADVENTURES_INSTAGRAM_URL,
    },
  ] satisfies BunsAdventuresEpisode[],
} as const;

export function resolveBunsAdventuresEpisode(input?: {
  id?: string | null;
  number?: string | null;
  title?: string | null;
  videoSrc?: string | null;
}) {
  const fallbackEpisode = bunsAdventuresCampaign.episodes[0];

  const matchedEpisode =
    bunsAdventuresCampaign.episodes.find((episode) => episode.id === input?.id?.trim()) ??
    bunsAdventuresCampaign.episodes.find((episode) => episode.number === input?.number?.trim()) ??
    fallbackEpisode;

  const resolvedNumber = input?.number?.trim() || matchedEpisode.number;
  // Campaign config is the source of truth for episode titles.
  // The API slot headline is campaign-level copy, not an episode title,
  // so we never let it override the stored episode title.
  const resolvedTitle = matchedEpisode.title;

  return {
    ...matchedEpisode,
    number: resolvedNumber,
    title: resolvedTitle,
    overlayLabel: `Episode ${resolvedNumber} — ${resolvedTitle}`,
    videoSrc: input?.videoSrc?.trim() || matchedEpisode.videoSrc,
  };
}
