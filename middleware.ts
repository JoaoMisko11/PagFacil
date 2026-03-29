import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
]

export function middleware(request: NextRequest) {
  const hasToken = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value
  )

  if (!hasToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// Só protege rotas autenticadas — login, api, assets ficam fora
export const config = {
  matcher: ["/", "/bills/:path*", "/onboarding/:path*"],
}
