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
      let closed = false;

      const cleanup = () => {
        if (closed) return;
        closed = true;
        duelEmitter.off("update", listener);
        clearInterval(keepaliveInterval);
        try { controller.close(); } catch { /* already closed */ }
      };

      const send = (room: GameRoom) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(room)}\n\n`));
        } catch {
          // Write failed — client disconnected; tear down this stream
          cleanup();
        }
      };

      const listener = (room: GameRoom) => send(room);
      duelEmitter.on("update", listener);

      // Keepalive comment every 20 s prevents proxies from closing idle connections.
      // SSE comment lines (": ...") are ignored by EventSource but keep TCP alive.
      const keepaliveInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          cleanup();
        }
      }, 20_000);

      request.signal.addEventListener("abort", cleanup);

      // Send initial state last — all handlers are wired, nothing can be missed
      send(getRoom());
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
