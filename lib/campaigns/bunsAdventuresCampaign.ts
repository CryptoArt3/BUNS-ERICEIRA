export type BunsAdventuresEpisode = {
  id: string;
  number: string;
  title: string;
  overlayLabel: string;
  videoSrc: string;
  linkedUrl?: string;
};

export const bunsAdventuresCampaign = {
  id: "buns-adventures",
  title: "BUNS ADVENTURES",
  subtitle: "ERICEIRA STORIES",
  qrLabel: "SCAN TO FOLLOW THE STORY",
  episodes: [
    {
      id: "episode-01",
      number: "01",
      title: "Jogo da Bola",
      overlayLabel: "Episódio 01 — Jogo da Bola",
      videoSrc: "/videos/buns-episode-01.mp4",
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
