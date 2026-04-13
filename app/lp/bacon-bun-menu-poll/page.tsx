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
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  disabled={alreadyVoted}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-base transition ${
                    selectedOption === option
                      ? "border-sky-300 bg-sky-500/15 text-white"
                      : "border-amber-300/20 bg-stone-950/30 text-amber-50/90 hover:border-sky-400/50 hover:bg-sky-500/10"
                  } ${alreadyVoted ? "cursor-not-allowed opacity-70" : ""}`}
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
                className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {alreadyVoted
                  ? "Already voted"
                  : voteStatus === "submitting"
                    ? "Submitting..."
                    : "Submit vote"}
              </button>
              {selectedOption ? (
                <span className="text-sm text-amber-50/80">Selected: {selectedOption}</span>
              ) : null}
            </div>

            {voteMessage ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  voteStatus === "error"
                    ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
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
