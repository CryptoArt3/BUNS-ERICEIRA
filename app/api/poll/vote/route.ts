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

export async function POST(request: Request) {
  if (!POLL_API_BASE_URL) {
    return NextResponse.json({ error: "Missing poll API base URL." }, { status: 500 });
  }

  const body = await request.text();

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
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach upstream poll vote API." },
      { status: 502 }
    );
  }
}
