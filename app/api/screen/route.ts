import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const DEFAULT_LOCAL_SCREEN_API_BASE_URL = "http://127.0.0.1:8000";
const CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

const FALLBACK_SCREEN_PAYLOAD = {
  ok: true,
  status: "live",
  source: "site_repo_fallback",
  updated_at: "2026-04-13T00:00:00.000Z",
  slides: [
    {
      id: "site-fallback-screen-1",
      type: "campaign_teaser",
      product_slug: "bacon_bun_menu",
      headline: "Vote for the next Bacon Bun Menu",
      subheadline: "Scan from the screen and help choose the winner.",
      cta: "Open the poll",
      duration: 6,
      image: null,
    },
    {
      id: "site-fallback-screen-2",
      type: "poll_results",
      product_slug: "bacon_bun_menu",
      headline: "Live results for Bacon Bun Menu",
      subtitle: "Poll is ready while the public API is being connected.",
      duration: 6,
      qr_enabled: false,
      qr_asset_path: null,
      total_votes: 0,
      poll_options: [
        "Bacon Bun Menu Classic",
        "Bacon Bun Menu Deluxe",
        "Bacon Bun Menu Takeaway Combo",
      ],
      poll_results_snapshot: {
        total_votes: 0,
        options: [
          { option: "Bacon Bun Menu Classic", votes: 0, percent: 0 },
          { option: "Bacon Bun Menu Deluxe", votes: 0, percent: 0 },
          { option: "Bacon Bun Menu Takeaway Combo", votes: 0, percent: 0 },
        ],
      },
    },
  ],
};

const CANDIDATE_SCREEN_API_BASE_URLS = [
  process.env.SCREEN_API_PUBLIC_BASE_URL,
  process.env.SCREEN_API_BASE_URL,
  process.env.AGENT_API_BASE_URL,
  process.env.NEXT_PUBLIC_AGENT_API_BASE_URL,
  process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_SCREEN_API_BASE_URL : "",
]
  .map((value) => value?.replace(/\/+$/, "") || "")
  .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);

const SCREEN_API_BASE_URL = resolveScreenApiBaseUrl();
const UPSTREAM_URL = SCREEN_API_BASE_URL ? `${SCREEN_API_BASE_URL}/webdev/screen` : "";

function resolveScreenApiBaseUrl() {
  for (const candidate of CANDIDATE_SCREEN_API_BASE_URLS) {
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

function createFallbackResponse(reason: string) {
  console.warn("[api/screen] Using structured fallback payload", { reason });

  return NextResponse.json(FALLBACK_SCREEN_PAYLOAD, {
    status: 200,
    headers: CACHE_HEADERS,
  });
}

export async function GET() {
  if (!UPSTREAM_URL) {
    console.error(
      "[api/screen] Missing valid SCREEN_API_PUBLIC_BASE_URL, SCREEN_API_BASE_URL, AGENT_API_BASE_URL and NEXT_PUBLIC_AGENT_API_BASE_URL"
    );
    return createFallbackResponse("missing_or_invalid_upstream_env");
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

      return createFallbackResponse(`upstream_status_${response.status}`);
    }

    const payload = await response.json();

    return NextResponse.json(payload, {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/screen] Upstream fetch failed", {
      url: UPSTREAM_URL,
      error,
    });

    return createFallbackResponse("upstream_fetch_failed");
  }
}
