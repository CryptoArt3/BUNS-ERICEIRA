import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const DEFAULT_LOCAL_SCREEN_API_BASE_URL = "http://127.0.0.1:8000";

const POLL_API_BASE_URL =
  process.env.SCREEN_API_BASE_URL?.replace(/\/+$/, "") ||
  process.env.AGENT_API_BASE_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_AGENT_API_BASE_URL?.replace(/\/+$/, "") ||
  (process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_SCREEN_API_BASE_URL : "") ||
  "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pollId = searchParams.get("poll_id")?.trim();

  if (!POLL_API_BASE_URL || !pollId) {
    return NextResponse.json(
      { error: "Missing poll API base URL or poll_id." },
      { status: 400 }
    );
  }

  const upstreamUrl = `${POLL_API_BASE_URL}/webdev/poll/results?poll_id=${encodeURIComponent(pollId)}`;

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach upstream poll results API." },
      { status: 502 }
    );
  }
}
