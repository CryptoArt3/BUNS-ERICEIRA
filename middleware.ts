import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Só protegemos /ericeira (admin)
  if (!pathname.startsWith("/ericeira")) {
    return NextResponse.next();
  }

  // IMPORTANTE: nunca bloquear a própria página de login
  if (pathname.startsWith("/ericeira/login")) {
    return NextResponse.next();
  }

  const isAdmin = req.cookies.get("ericeira_admin")?.value === "1";

  if (!isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/ericeira/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ericeira/:path*"],
};
