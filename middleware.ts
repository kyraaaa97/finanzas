import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, tokenFor } from "@/lib/auth";

// Protege toda la app con una sola contraseña.
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLogin = path.startsWith("/login");

  const pw = process.env.APP_PASSWORD;
  const expected = pw ? await tokenFor(pw) : null;
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const authed = !!expected && cookie === expected;

  if (!authed && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authed && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
