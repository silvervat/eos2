import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/invoices',
  '/employees',
  '/documents',
  '/file-vault',
  '/reports',
  '/notifications',
  '/trash',
  '/settings',
  '/admin',
]

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password']

export async function middleware(request: NextRequest) {
  // Update session first
  const response = await updateSession(request)

  const { pathname } = request.nextUrl

  // Skip auth checks if Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured, allow all routes
    return response
  }

  try {
    // Create supabase client to check auth
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(
      (route) => pathname.startsWith(route) || pathname === route
    )

    // Check if route is auth route
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Redirect to dashboard if accessing auth routes while authenticated
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    // Log error but don't fail the request
    console.error('Middleware auth check error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
