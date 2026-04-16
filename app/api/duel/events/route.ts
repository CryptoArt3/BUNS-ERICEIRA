// SSE endpoint — TV screen and mobile players subscribe here for live updates.
// Each connected client receives the full GameRoom state on every change.
//
// ── PHASE 1 MVP — Production limitations ─────────────────────────────────────
//
// SSE LONG-LIVED CONNECTIONS
// Each subscriber (TV + 2 players = ~3 connections per game) holds an open
// HTTP connection for the duration of the session. Node.js handles this fine
// for a handful of concurrent connections, which is all an in-store single-TV
// setup ever needs.
//
// What this means in practice:
//   • Works correctly behind a standard reverse proxy (nginx, Caddy) as long as
//     proxy_read_timeout / proxy buffering are configured for SSE. The
//     X-Accel-Buffering: no header disables nginx buffering automatically.
//   • Does NOT work behind serverless runtimes (Vercel Edge, Lambda) because
//     those platforms kill idle connections and enforce request time limits.
//     Use `export const runtime = "nodejs"` (already set) to ensure Node.js
//     runtime — never the Edge runtime — handles this route.
//   • Reconnect logic is handled client-side (3 s retry). The server sends the
//     current room state immediately on connect, so a reconnect catches up
//     instantly without needing a separate polling fallback.
//
// When to upgrade: if spectator count grows (e.g. many TVs or a web audience),
// replace with Supabase Realtime broadcast channels — they scale fan-out
// independently of the Next.js process.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { duelEmitter, getRoom } from "@/lib/duel/gameState";
import type { GameRoom } from "@/lib/duel/types";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (room: GameRoom) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(room)}\n\n`)
          );
        } catch {
          // Client already disconnected — ignore write errors
        }
      };

      // Immediately push current state so the client doesn't wait
      send(getRoom());

      const listener = (room: GameRoom) => send(room);
      duelEmitter.on("update", listener);

      request.signal.addEventListener("abort", () => {
        duelEmitter.off("update", listener);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
