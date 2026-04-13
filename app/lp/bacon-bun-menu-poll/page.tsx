"use client";

import { useEffect, useMemo, useState } from "react";

type PollResultRow = {
  option: string;
  votes: number;
  percent: number;
};

type PollResultsPayload = {
  ok?: boolean;
  error?: string;
  total_votes?: number | null;
  options?: PollResultRow[] | null;
};

const landingPage = {
  slug: "best-burger",
  headline: "Best Burger?",
  subheadline: "Vote and crown today's winner.",
  pollQuestion: "Best Burger?",
  pollOptions: [
    "Classic Bun",
    "Bacon Bun",
    "Epic Bun",
    "Veggie Bun",
    "Chicken Bun",
  ],
};

const voteStorageKey = (pollId: string) => `poll-voted:${pollId}`;

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
  const [selectedOption, setSelectedOption] = useState("");
  const [voteStatus, setVoteStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    "idle"
  );
  const [voteMessage, setVoteMessage] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    try {
      const storedVote = window.localStorage.getItem(voteStorageKey(pollId));

      if (storedVote) {
        setAlreadyVoted(true);
        setVoteStatus("submitted");
        setVoteMessage("You already voted on this device.");
      }
    } catch {
      // Ignore localStorage access errors and keep voting available.
    }
  }, [pollId]);

  useEffect(() => {
    let active = true;

    const loadResults = async () => {
      try {
        const response = await fetch(`/api/poll/results?poll_id=${encodeURIComponent(pollId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          results?: PollResultsPayload | null;
        };

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

  const submitVote = async () => {
    if (!selectedOption || voteStatus === "submitting" || alreadyVoted) {
      return;
    }

    setVoteStatus("submitting");
    setVoteMessage("");

    try {
      const response = await fetch("/api/poll/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poll_id: pollId,
          option: selectedOption,
          poll_options: landingPage.pollOptions,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        results?: PollResultsPayload | null;
      };

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "Vote failed.");
      }

      setResults(payload.results ?? { total_votes: 0, options: [] });
      try {
        window.localStorage.setItem(voteStorageKey(pollId), selectedOption);
      } catch {
        // Ignore localStorage write errors after a successful vote.
      }

      setAlreadyVoted(true);
      setVoteStatus("submitted");
      setVoteMessage("Thanks for voting.");
    } catch (error) {
      setVoteStatus("error");
      setVoteMessage(error instanceof Error ? error.message : "Vote failed.");
    }
  };

  const rows = normalizeResults(results);
  const totalVotes =
    typeof results?.total_votes === "number" && Number.isFinite(results.total_votes)
      ? Math.max(0, Math.round(results.total_votes))
      : 0;

  return (
    <main className="min-h-screen bg-[#050404] text-stone-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.24),transparent_28%),radial-gradient(circle_at_bottom,rgba(0,240,255,0.10),transparent_32%),radial-gradient(ellipse_at_78%_16%,rgba(255,80,0,0.07),transparent_42%),linear-gradient(180deg,rgba(5,3,3,0.9),rgba(3,2,2,0.99))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,209,102,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,102,0.18)_1px,transparent_1px)] [background-size:22px_22px]" />
      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16 sm:px-10">
        <div className="space-y-4">
          <p className="inline-flex rounded-sm border border-[#00f0ff]/55 bg-[#00f0ff]/10 px-4 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.42em] text-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.22),0_8px_24px_rgba(0,0,0,0.5)]">Live Poll</p>
          <h1 className="max-w-4xl text-5xl font-black uppercase tracking-[0.03em] text-[#ffd166] [text-shadow:0_0_55px_rgba(255,209,102,0.55),0_10px_30px_rgba(0,0,0,0.65)] sm:text-6xl">
            {landingPage.headline}
          </h1>
          <p className="max-w-3xl text-lg uppercase tracking-[0.1em] text-[#b8ad94] sm:text-xl">
            {landingPage.subheadline}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border-2 border-[#ffd166]/32 bg-[linear-gradient(180deg,rgba(8,6,4,0.96),rgba(3,2,1,0.99))] p-6 shadow-[0_0_0_1px_rgba(255,209,102,0.05),0_30px_72px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,209,102,0.10)] backdrop-blur-md">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.42em] text-[#ffd166]">Poll Question</p>
            <p className="mt-3 text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-[2rem]">{landingPage.pollQuestion}</p>

            <div className="mt-6 space-y-4">
              {rows.map((row) => (
                <div key={row.option} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm text-[#fff6db] sm:text-base">
                    <span className="font-medium">{row.option}</span>
                    <span className="shrink-0 rounded-sm border border-[#00f0ff]/42 bg-[#00f0ff]/10 px-3 py-1 font-bold text-[#00f0ff]">
                      {row.votes} votes · {row.percent}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-sm bg-black/80 ring-1 ring-white/6">
                    <div
                      className="h-full rounded-sm bg-gradient-to-r from-[#ff6400] via-[#ffd166] to-[#00f0ff] transition-all"
                      style={{ width: `${Math.min(Math.max(row.percent, 0), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[0.65rem] font-black uppercase tracking-[0.35em] text-[#ffd166]">
              Total votes: {totalVotes}
            </p>
          </div>

          <aside className="rounded-[1.5rem] border-2 border-[#ffd166]/38 bg-[linear-gradient(180deg,rgba(12,8,4,0.96),rgba(5,3,2,0.99))] p-6 shadow-[0_0_0_1px_rgba(255,209,102,0.07),0_28px_70px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,209,102,0.13)] backdrop-blur-md">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.42em] text-[#ffd166]">Options</p>
            <div className="mt-4 space-y-3">
              {landingPage.pollOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  disabled={alreadyVoted}
                  className={`w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-semibold uppercase tracking-[0.08em] transition ${
                    selectedOption === option
                      ? "border-[#ffd166] bg-[#ffd166]/14 text-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.18),0_10px_24px_rgba(0,0,0,0.45)]"
                      : "border-white/10 bg-black/60 text-[#c8bfa0] hover:border-[#ffd166]/55 hover:bg-[#ffd166]/8 hover:text-white"
                  } ${alreadyVoted ? "cursor-not-allowed opacity-55" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={submitVote}
                disabled={!selectedOption || voteStatus === "submitting" || alreadyVoted}
                className="rounded-sm border-2 border-[#ffd166] bg-[#ffd166] px-7 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-[#0c0900] shadow-[0_0_28px_rgba(255,209,102,0.38),0_12px_28px_rgba(0,0,0,0.5)] transition hover:bg-[#ffe580] hover:shadow-[0_0_40px_rgba(255,209,102,0.55)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/55 disabled:opacity-100 disabled:shadow-none"
              >
                {alreadyVoted
                  ? "Already voted"
                  : voteStatus === "submitting"
                    ? "Submitting..."
                    : "Submit vote"}
              </button>
              {selectedOption ? (
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#ffd166]">Selected: {selectedOption}</span>
              ) : null}
            </div>

            {voteMessage ? (
              <div
                className={`mt-4 rounded-xl border-2 px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] ${
                  voteStatus === "error"
                    ? "border-rose-500/40 bg-rose-900/30 text-rose-300"
                    : "border-[#ffd166]/35 bg-[#ffd166]/8 text-[#ffd166]"
                }`}
              >
                {voteMessage}
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
