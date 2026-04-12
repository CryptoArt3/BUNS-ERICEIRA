"use client";

import { useEffect, useMemo, useState } from "react";

type PollResultRow = {
  option: string;
  votes: number;
  percent: number;
};

type PollResultsPayload = {
  total_votes?: number | null;
  options?: PollResultRow[] | null;
};

const landingPage = {
  slug: "bacon-bun-menu-poll",
  headline: "Vote for the next Bacon Bun Menu",
  subheadline: "Scan from the screen and help choose the winner.",
  pollQuestion: "Which version of Bacon Bun Menu should launch next?",
  pollOptions: [
    "Bacon Bun Menu Classic",
    "Bacon Bun Menu Deluxe",
    "Bacon Bun Menu Takeaway Combo",
  ],
};

function buildApiUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  const { hostname, protocol, port } = window.location;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.");

  if (isLocalHost && port === "3000") {
    return `${protocol}//${hostname}:8000${path}`;
  }

  return path;
}

function normalizeResults(results: PollResultsPayload | null | undefined) {
  return landingPage.pollOptions.map((option) => {
    const match = results?.options?.find((item) => item.option === option);

    return {
      option,
      votes:
        typeof match?.votes === "number" && Number.isFinite(match.votes)
          ? Math.max(0, Math.round(match.votes))
          : 0,
      percent:
        typeof match?.percent === "number" && Number.isFinite(match.percent)
          ? Math.max(0, Math.round(match.percent))
          : 0,
    };
  });
}

export default function BaconBunMenuPollPage() {
  const pollId = useMemo(() => landingPage.slug, []);
  const [results, setResults] = useState<PollResultsPayload | null>(null);

  useEffect(() => {
    let active = true;

    const loadResults = async () => {
      try {
        const response = await fetch(
          `${buildApiUrl("/webdev/poll/results")}?poll_id=${encodeURIComponent(pollId)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json().catch(() => ({}))) as {
          results?: PollResultsPayload | null;
        };

        if (!response.ok) {
          throw new Error("Failed to load poll results.");
        }

        if (active) {
          setResults(payload.results ?? { total_votes: 0, options: [] });
        }
      } catch {
        if (active) {
          setResults({ total_votes: 0, options: [] });
        }
      }
    };

    void loadResults();

    return () => {
      active = false;
    };
  }, [pollId]);

  const rows = normalizeResults(results);
  const totalVotes =
    typeof results?.total_votes === "number" && Number.isFinite(results.total_votes)
      ? Math.max(0, Math.round(results.total_votes))
      : 0;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16 sm:px-10">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-400">Live Poll</p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
            {landingPage.headline}
          </h1>
          <p className="max-w-3xl text-xl text-stone-300 sm:text-2xl">
            {landingPage.subheadline}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-sky-500/30 bg-sky-500/10 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-sky-300">Poll Question</p>
            <p className="mt-3 text-2xl text-white">{landingPage.pollQuestion}</p>

            <div className="mt-6 space-y-4">
              {rows.map((row) => (
                <div key={row.option} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm text-white sm:text-base">
                    <span>{row.option}</span>
                    <span className="shrink-0">
                      {row.votes} votes · {row.percent}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-stone-900">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all"
                      style={{ width: `${Math.min(Math.max(row.percent, 0), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm uppercase tracking-[0.18em] text-sky-100/70">
              Total votes: {totalVotes}
            </p>
          </div>

          <aside className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Options</p>
            <div className="mt-4 space-y-3">
              {landingPage.pollOptions.map((option) => (
                <div
                  key={option}
                  className="rounded-2xl border border-amber-300/20 bg-stone-950/30 px-4 py-3 text-base text-amber-50/90"
                >
                  {option}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
