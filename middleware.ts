import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  if (
    path.startsWith('/auth') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/_next') ||
    path.startsWith('/static')
  ) {
    return NextResponse.next()
  }

  // Get the token from the request
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Handle root path - redirect to login if not authenticated
  if (path === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    // If authenticated, redirect based on role
    const userRole = token.role as string
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/analytics', request.url))
    } else if (userRole === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
    // Unknown role - redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user is not authenticated and trying to access protected routes
  if (!token) {
    if (path.startsWith('/admin') || path.startsWith('/student')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  // Role-based access control
  const userRole = token.role as string

  // Admin routes - only admins can access
  if (path.startsWith('/admin')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Student routes - only students can access
  if (path.startsWith('/student')) {
    if (userRole !== 'student') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/student/:path*',
  ],
}


