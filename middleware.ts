import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Rotas que precisam de autenticação
  const protectedRoutes = ['/dashboard', '/contacts', '/messages', '/projects', '/settings', '/prospection', '/goals', '/financial']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Rotas de auth (login, signup)
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Note: A verificação real de auth é feita no DashboardLayout
  // Este middleware apenas garante que as rotas corretas estejam acessíveis
  // A autenticação é verificada via localStorage no client-side

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
