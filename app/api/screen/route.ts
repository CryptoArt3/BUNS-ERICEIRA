import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const DEFAULT_LOCAL_SCREEN_API_BASE_URL = "http://127.0.0.1:8000";

const SCREEN_API_BASE_URL =
  process.env.SCREEN_API_BASE_URL?.replace(/\/+$/, "") ||
  process.env.AGENT_API_BASE_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_AGENT_API_BASE_URL?.replace(/\/+$/, "") ||
  (process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_SCREEN_API_BASE_URL : "") ||
  "";

const UPSTREAM_URL = SCREEN_API_BASE_URL ? `${SCREEN_API_BASE_URL}/webdev/screen` : "";

export async function GET() {
  if (!UPSTREAM_URL) {
    console.error(
      "[api/screen] Missing SCREEN_API_BASE_URL, AGENT_API_BASE_URL and NEXT_PUBLIC_AGENT_API_BASE_URL"
    );
    return NextResponse.json(
      { ok: false, status: "error", error: "Missing upstream screen API base URL." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  try {
    const response = await fetch(UPSTREAM_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[api/screen] Upstream returned non-OK response", {
        status: response.status,
        url: UPSTREAM_URL,
        body: errorText,
      });

      return NextResponse.json(
        {
          ok: false,
          status: "error",
          error: "Upstream screen API request failed.",
          upstreamStatus: response.status,
        },
        {
          status: 502,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    const payload = await response.json();

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("[api/screen] Upstream fetch failed", {
      url: UPSTREAM_URL,
      error,
    });

    return NextResponse.json(
      { ok: false, status: "error", error: "Failed to reach upstream screen API." },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
