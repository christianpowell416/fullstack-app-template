import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  const subdomain = getSubdomain(hostname)

  // Skip middleware for API routes, auth callbacks, and static files
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Route admin subdomain to /admin routes
  if (subdomain === 'admin') {
    if (url.pathname.startsWith('/admin')) {
      return NextResponse.next()
    }
    url.pathname = `/admin${url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0]

  // Local development — no subdomain, use /admin path directly
  if (host === 'localhost' || host === '127.0.0.1') {
    return null
  }

  // Production: extract subdomain (e.g., admin.yourdomain.com -> admin)
  const parts = host.split('.')
  if (parts.length >= 3 && parts[0] === 'admin') {
    return 'admin'
  }

  return null
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
