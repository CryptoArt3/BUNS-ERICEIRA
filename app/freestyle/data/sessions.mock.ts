// app/freestyle/data/sessions.mock.ts

export type FreestyleSession = {
  id: string;
  title: string;
  date: string;
  status: "LIVE" | "NEXT" | "ARCHIVE";
  championAKA?: string;
  notes?: string;

  // Media “TV”
  featuredVideoUrl?: string;   // mp4/webm (loop)
  featuredReplayUrl?: string;  // mp4/webm (loop)
  featuredTrailerUrl?: string; // mp4/webm (loop)
};

export const SESSIONS: FreestyleSession[] = [
  {
    id: "session_0",
    title: "SESSION 0",
    date: "24 Abril",
    status: "NEXT",
    championAKA: "TBD",
    notes: "Espaço pequeno. Pressão real. Sem palco.",
    featuredVideoUrl: "/media/video-loop.mp4",
    // featuredReplayUrl: "/media/highlights_loop.mp4",
    // featuredTrailerUrl: "/media/trailer_loop.mp4",
  },
  {
    id: "session_demo",
    title: "ARENA DEMO",
    date: "Arquivo",
    status: "ARCHIVE",
    championAKA: "MC SHADOW",
    notes: "Modo arquivo (demo). Highlights e evolução das cartas.",
    featuredReplayUrl: "/media/video-loop.mp4",
  },
];
