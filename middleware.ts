import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Lista de cookies possíveis do NextAuth v5 (JWT strategy)
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — não precisa de auth
  if (
    pathname === "/" ||
    pathname === "/landing.html" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icon-")
  ) {
    return NextResponse.next()
  }

  const hasToken = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value
  )

  if (!hasToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
