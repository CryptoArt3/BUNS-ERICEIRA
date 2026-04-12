import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const DEFAULT_LOCAL_SCREEN_API_BASE_URL = "http://127.0.0.1:8000";
const CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

const CANDIDATE_POLL_API_BASE_URLS = [
  process.env.POLL_API_PUBLIC_BASE_URL,
  process.env.SCREEN_API_PUBLIC_BASE_URL,
  process.env.SCREEN_API_BASE_URL,
  process.env.AGENT_API_BASE_URL,
  process.env.NEXT_PUBLIC_AGENT_API_BASE_URL,
  process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_SCREEN_API_BASE_URL : "",
]
  .map((value) => value?.replace(/\/+$/, "") || "")
  .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);

const POLL_API_BASE_URL = resolvePollApiBaseUrl();

function resolvePollApiBaseUrl() {
  for (const candidate of CANDIDATE_POLL_API_BASE_URLS) {
    if (!isDisallowedProductionUrl(candidate)) {
      return candidate;
    }
  }

  return "";
}

function isDisallowedProductionUrl(candidate: string) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  try {
    const hostname = new URL(candidate).hostname.toLowerCase();

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.2") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.")
    );
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const parsedBody = JSON.parse(body || "{}") as {
    poll_id?: string;
    poll_options?: string[];
  };
  const pollId = parsedBody.poll_id?.trim() || "unknown-poll";
  const pollOptions = Array.isArray(parsedBody.poll_options) ? parsedBody.poll_options : [];

  const fallbackPayload = {
    ok: false,
    error: "Vote service is temporarily unavailable.",
    results: {
      poll_id: pollId,
      total_votes: 0,
      options: pollOptions.map((option) => ({
        option,
        votes: 0,
        percent: 0,
      })),
    },
  };

  if (!POLL_API_BASE_URL) {
    return NextResponse.json(fallbackPayload, {
      status: 200,
      headers: CACHE_HEADERS,
    });
  }

  try {
    const response = await fetch(`${POLL_API_BASE_URL}/webdev/poll/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        ...CACHE_HEADERS,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ...fallbackPayload,
        error: "Failed to reach upstream poll vote API.",
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      }
    );
  }
}
