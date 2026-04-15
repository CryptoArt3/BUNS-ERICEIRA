export type BunsAdventuresEpisode = {
  id: string;
  number: string;
  title: string;
  overlayLabel: string;
  videoSrc: string;
  linkedUrl?: string;
};

const BUNS_ADVENTURES_VIDEO_VERSION = "adventures-v1";

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
      linkedUrl: "https://buns-ericeira.pt/",
    },
    {
      id: "episode-02",
      number: "02",
      title: "Ribeira D'Ilhas",
      overlayLabel: "Episode 02 — Ribeira D'Ilhas",
      videoSrc: withVideoVersion("/videos/buns-episode-02.mp4"),
      linkedUrl: "https://buns-ericeira.pt/",
    },
    {
      id: "episode-03",
      number: "03",
      title: "Skatepark",
      overlayLabel: "Episode 03 — Skatepark",
      videoSrc: withVideoVersion("/videos/buns-episode-03.mp4"),
      linkedUrl: "https://buns-ericeira.pt/",
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
