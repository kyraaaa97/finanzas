import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  cookies().delete(AUTH_COOKIE);
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 302,
  });
}
