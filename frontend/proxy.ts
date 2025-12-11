import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/admin/login'];
const ADMIN_COOKIE = 'adminSession';

// CHỈNH SỬA: Thay đổi tên hàm từ middleware thành proxy
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  // 1. BẢO MẬT: Thiết lập các Security Headers quan trọng
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  if (!pathname.startsWith('/admin')) {
    return response;
  }

  const adminCookie = request.cookies.get(ADMIN_COOKIE);
  const hasAdminCookie = Boolean(adminCookie?.value);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // 2. LOGIC ĐIỀU HƯỚNG BẢO MẬT
  if (!hasAdminCookie && !isPublicPath) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasAdminCookie && isPublicPath) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // 3. Cho phép đi tiếp (Nếu đã đăng nhập và đang ở trang Admin hợp lệ)
  const nextResponse = NextResponse.next();

  // Gán lại headers cho response cuối cùng đi qua
  nextResponse.headers.set('X-Frame-Options', 'DENY');
  nextResponse.headers.set('X-Content-Type-Options', 'nosniff');
  nextResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    nextResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return nextResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};