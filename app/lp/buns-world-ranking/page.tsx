"use client";

import { useEffect, useMemo, useState } from "react";

import { bunsWorldRankingPoll } from "@/lib/polls/bunsWorldRankingCampaign";

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

const voteStorageKey = (pollId: string) => `poll-voted:${pollId}`;

const COUNTRY_FLAGS: Record<string, string> = {
  Portugal: "🇵🇹",
  Germany: "🇩🇪",
  France: "🇫🇷",
  "United Kingdom": "🇬🇧",
  Netherlands: "🇳🇱",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  "United States": "🇺🇸",
  Brazil: "🇧🇷",
  Ireland: "🇮🇪",
  Belgium: "🇧🇪",
  Sweden: "🇸🇪",
  Denmark: "🇩🇰",
  Australia: "🇦🇺",
  Other: "🌍",
};

function normalizeResults(results: PollResultsPayload | null | undefined) {
  return bunsWorldRankingPoll.pollOptions.map((option) => {
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

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    let rafId: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return value;
}

export default function BunsWorldRankingPage() {
  const pollId = useMemo(() => bunsWorldRankingPoll.slug, []);
  const [results, setResults] = useState<PollResultsPayload | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [voteStatus, setVoteStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    "idle"
  );
  const [voteMessage, setVoteMessage] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [votedOption, setVotedOption] = useState("");

  useEffect(() => {
    try {
      const storedVote = window.localStorage.getItem(voteStorageKey(pollId));

      if (storedVote) {
        setAlreadyVoted(true);
        setVoteStatus("submitted");
        setVoteMessage("You already voted on this device.");
        setVotedOption(storedVote);
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
          poll_options: bunsWorldRankingPoll.pollOptions,
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
      setVotedOption(selectedOption);
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

  const rankedRows = [...rows].sort((a, b) => b.votes - a.votes);
  const countriesRepresented = rows.filter((r) => r.votes > 0).length;
  const animatedVotes = useCountUp(totalVotes);
  const animatedCountries = useCountUp(countriesRepresented);

  return (
    <main className="min-h-screen bg-[#050404] text-stone-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.24),transparent_28%),radial-gradient(circle_at_bottom,rgba(0,240,255,0.10),transparent_32%),radial-gradient(ellipse_at_78%_16%,rgba(255,80,0,0.07),transparent_42%),linear-gradient(180deg,rgba(5,3,3,0.9),rgba(3,2,2,0.99))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,209,102,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,102,0.18)_1px,transparent_1px)] [background-size:22px_22px]" />
      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16 sm:px-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2 rounded-sm border border-[#00f0ff]/55 bg-[#00f0ff]/10 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.42em] text-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.22),0_8px_24px_rgba(0,0,0,0.5)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,1)]" />
              Live
            </span>
            <span className="text-[0.62rem] font-black uppercase tracking-[0.3em] text-white/28">
              Since April 2026
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl font-black uppercase tracking-[0.03em] text-[#ffd166] [text-shadow:0_0_55px_rgba(255,209,102,0.55),0_10px_30px_rgba(0,0,0,0.65)] sm:text-6xl">
            {bunsWorldRankingPoll.headline}
          </h1>
          <p className="max-w-3xl text-lg uppercase tracking-[0.1em] text-[#b8ad94] sm:text-xl">
            Join the global BUNS ranking and represent your country
          </p>

          <div className="flex flex-wrap items-stretch gap-x-6 gap-y-4 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[0.58rem] font-black uppercase tracking-[0.32em] text-white/32">
                Votes counted
              </span>
              <span className="tabular-nums text-3xl font-black leading-none text-[#ffd166] [text-shadow:0_0_22px_rgba(255,209,102,0.45)] sm:text-4xl">
                {animatedVotes.toLocaleString()}
              </span>
            </div>

            <div className="hidden w-px self-stretch bg-white/8 sm:block" />

            <div className="flex flex-col gap-1">
              <span className="text-[0.58rem] font-black uppercase tracking-[0.32em] text-white/32">
                Countries
              </span>
              <span className="tabular-nums text-3xl font-black leading-none text-[#00f0ff] [text-shadow:0_0_22px_rgba(0,240,255,0.35)] sm:text-4xl">
                {animatedCountries}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border-2 border-[#ffd166]/32 bg-[linear-gradient(180deg,rgba(8,6,4,0.96),rgba(3,2,1,0.99))] p-6 shadow-[0_0_0_1px_rgba(255,209,102,0.05),0_30px_72px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,209,102,0.10)] backdrop-blur-md">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.42em] text-[#ffd166]">
              Poll Question
            </p>
            <p className="mt-3 text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-[2rem]">
              {bunsWorldRankingPoll.pollQuestion}
            </p>

            <div className="mt-6 space-y-3">
              {rankedRows.map((row, rankIdx) => {
                const isTop = rankIdx === 0 && totalVotes > 0;
                const isVoted = votedOption === row.option;
                return (
                  <div
                    key={row.option}
                    className={`space-y-2 rounded-lg px-3 py-2.5 transition-all ${
                      isTop
                        ? "border border-[#ffd166]/28 bg-[rgba(255,209,102,0.06)] shadow-[0_0_18px_rgba(255,209,102,0.07)]"
                        : "border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm text-[#fff6db] sm:text-base">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[0.58rem] font-black leading-none tracking-wider ${
                            isTop
                              ? "border-[#ffd166]/55 bg-[#ffd166]/12 text-[#ffd166]"
                              : "border-white/10 bg-white/4 text-white/30"
                          }`}
                        >
                          {isTop ? "🏆" : `#${rankIdx + 1}`}
                        </span>
                        <span className={`truncate font-medium ${isTop ? "text-white" : "text-[#d4ccb8]"}`}>
                          {COUNTRY_FLAGS[row.option] ?? ""} {row.option}
                        </span>
                        {isVoted ? (
                          <span className="shrink-0 rounded-sm border border-[#00f0ff]/45 bg-[#00f0ff]/10 px-1.5 py-0.5 font-mono text-[0.56rem] font-black uppercase tracking-wider text-[#00f0ff]">
                            you
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 rounded-sm border border-[#00f0ff]/42 bg-[#00f0ff]/10 px-3 py-1 font-bold text-[#00f0ff]">
                        {row.votes} · {row.percent}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-sm bg-black/80 ring-1 ring-white/6">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          isTop
                            ? "bg-gradient-to-r from-[#ffd166] via-[#ffb800] to-[#00f0ff]"
                            : "bg-gradient-to-r from-[#ff6400] via-[#ffd166] to-[#00f0ff] opacity-60"
                        }`}
                        style={{ width: `${Math.min(Math.max(row.percent, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-[0.65rem] font-black uppercase tracking-[0.35em] text-[#ffd166]">
              Total votes: {totalVotes}
            </p>
          </div>

          <aside className="relative overflow-hidden rounded-[1.5rem] border-2 border-[#ffd166]/48 bg-[linear-gradient(160deg,rgba(16,10,4,0.97),rgba(5,3,2,0.99))] p-6 shadow-[0_0_0_1px_rgba(255,209,102,0.10),0_0_55px_rgba(255,209,102,0.08),0_36px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,209,102,0.22)] backdrop-blur-md">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#ffd166] to-transparent opacity-80" />

            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffd166] shadow-[0_0_8px_rgba(255,209,102,1)]" />
              <p className="text-[0.65rem] font-black uppercase tracking-[0.42em] text-[#ffd166]">
                {alreadyVoted ? "Your vote" : "Options"}
              </p>
            </div>

            {alreadyVoted ? (
              <div className="mt-5 flex flex-col gap-4">
                {votedOption ? (
                  <div className="relative overflow-hidden rounded-xl border-2 border-[#00f0ff]/45 bg-[linear-gradient(135deg,rgba(0,240,255,0.09),rgba(0,180,200,0.03))] px-5 py-5 shadow-[0_0_0_1px_rgba(0,240,255,0.07),0_0_28px_rgba(0,240,255,0.14),0_10px_28px_rgba(0,0,0,0.55)]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-70" />
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.4em] text-[#00f0ff]/65">
                      Representing
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="text-4xl leading-none">{COUNTRY_FLAGS[votedOption] ?? "🌍"}</span>
                      <span className="text-xl font-black uppercase tracking-[0.04em] text-white">
                        {votedOption}
                      </span>
                    </div>
                    <p className="mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#00f0ff]/70">
                      Your vote has been counted
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-[#00f0ff]/40 bg-[#00f0ff]/8 px-5 py-4 shadow-[0_0_18px_rgba(0,240,255,0.10)]">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#00f0ff]">
                      Already voted
                    </p>
                    <p className="mt-1 text-[0.68rem] text-[#b8ad94]">One vote per device.</p>
                  </div>
                )}

                <div className="rounded-xl border border-[#ffd166]/20 bg-[rgba(255,209,102,0.04)] px-4 py-4">
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.34em] text-[#ffd166]/75">
                    Live on screen
                  </p>
                  <p className="mt-1.5 text-[0.68rem] leading-relaxed text-[#b8ad94]">
                    See live results on the BUNS screen inside the restaurant.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-2.5">
                  {bunsWorldRankingPoll.pollOptions.map((option, idx) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedOption(option)}
                      disabled={alreadyVoted}
                      className={`group relative w-full overflow-hidden rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-150 ${
                        selectedOption === option
                          ? "border-[#ffd166] bg-[linear-gradient(135deg,rgba(255,209,102,0.16),rgba(255,180,40,0.05))] text-[#ffd166] shadow-[0_0_0_1px_rgba(255,209,102,0.10),0_0_26px_rgba(255,209,102,0.22),0_8px_24px_rgba(0,0,0,0.55)]"
                          : "border-white/10 bg-black/55 text-[#c8bfa0] hover:border-[#ffd166]/45 hover:bg-[rgba(255,209,102,0.05)] hover:text-white"
                      }`}
                    >
                      {selectedOption === option ? (
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-gradient-to-b from-[#ffd166] to-[#ff9900] shadow-[0_0_10px_rgba(255,209,102,0.75)]" />
                      ) : null}
                      <span className="flex items-center gap-3">
                        <span
                          className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[0.58rem] font-black leading-none tracking-wider transition-all ${
                            selectedOption === option
                              ? "border-[#ffd166]/55 bg-[#ffd166]/12 text-[#ffd166]"
                              : "border-white/12 bg-white/4 text-white/35 group-hover:border-[#ffd166]/30 group-hover:text-[#ffd166]/55"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-bold uppercase tracking-[0.08em]">
                          {COUNTRY_FLAGS[option] ?? ""} {option}
                        </span>
                        {selectedOption === option ? (
                          <span className="ml-auto shrink-0 text-[0.7rem] text-[#ffd166]">◆</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {selectedOption ? (
                    <div className="flex items-center gap-2.5 rounded-lg border border-[#ffd166]/28 bg-[#ffd166]/6 px-3.5 py-2.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffd166] shadow-[0_0_7px_rgba(255,209,102,0.9)]" />
                      <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#ffd166]">
                        {COUNTRY_FLAGS[selectedOption] ?? ""} {selectedOption}
                      </span>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={submitVote}
                    disabled={!selectedOption || voteStatus === "submitting" || alreadyVoted}
                    className={`w-full rounded-xl border-2 py-4 text-sm font-black uppercase tracking-[0.22em] transition-all duration-200 ${
                      !selectedOption || voteStatus === "submitting"
                        ? "cursor-not-allowed border-white/10 bg-white/5 text-white/28"
                        : "border-[#ffd166] bg-[#ffd166] text-[#0c0900] shadow-[0_0_30px_rgba(255,209,102,0.42),0_12px_28px_rgba(0,0,0,0.55)] hover:bg-[#ffe580] hover:shadow-[0_0_45px_rgba(255,209,102,0.62)]"
                    }`}
                  >
                    {voteStatus === "submitting" ? "Submitting..." : "Submit vote"}
                  </button>
                </div>
              </>
            )}

            {voteMessage && voteStatus === "error" ? (
              <div className="mt-4 rounded-xl border-2 border-rose-500/40 bg-rose-900/30 px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-rose-300">
                {voteMessage}
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
