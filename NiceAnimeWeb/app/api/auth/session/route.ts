import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

// CẤU HÌNH BẢO MẬT
const ALLOWED_ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const COOKIE_NAME = 'adminSession';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5; // 5 ngày

// --- RATE LIMITING (CHỐNG BRUTE FORCE) ---
// Giới hạn: 5 lần thử trong vòng 15 phút cho mỗi IP
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, lastAttempt: now });
        return true;
    }

    if (now - record.lastAttempt > RATE_LIMIT_WINDOW_MS) {
        // Đã qua thời gian cửa sổ, reset lại
        rateLimitMap.set(ip, { count: 1, lastAttempt: now });
        return true;
    }

    if (record.count >= MAX_ATTEMPTS) {
        return false; // Bị chặn
    }

    record.count++;
    record.lastAttempt = now;
    return true;
}

// Dọn dẹp map định kỳ để tránh tràn bộ nhớ (Mỗi 1 giờ)
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now - record.lastAttempt > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(ip);
        }
    }
}, 60 * 60 * 1000);

export async function POST(request: Request) {
    try {
        // 1. Lấy IP người dùng để check Rate Limit
        // Trên Vercel/Next.js, IP thường nằm trong header 'x-forwarded-for'
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        if (!checkRateLimit(ip)) {
            console.warn(`[Security] Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { error: 'Bạn đã thử quá nhiều lần. Vui lòng quay lại sau 15 phút.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json({ error: 'Thiếu thông tin xác thực' }, { status: 400 });
        }

        // 2. Xác minh ID Token gửi từ client
        const decodedIdToken = await adminAuth.verifyIdToken(idToken);
        const userEmail = decodedIdToken.email?.toLowerCase();

        // 3. Kiểm tra Whitelist (Quan trọng nhất)
        if (!userEmail || !ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
            console.warn(`[Security] Unauthorized access attempt by: ${userEmail} (IP: ${ip})`);
            // Trả về lỗi chung chung để hacker không biết là sai email hay sai token
            return NextResponse.json({ error: 'Quyền truy cập bị từ chối' }, { status: 403 });
        }

        // 4. Tạo Session Cookie
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_DURATION_MS,
        });

        // 5. Trả về Response kèm Cookie cấu hình TỐI ĐA
        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: COOKIE_NAME,
            value: sessionCookie,
            httpOnly: true, // Chống XSS (JS không đọc được)
            secure: process.env.NODE_ENV === 'production', // Bắt buộc HTTPS ở Production
            sameSite: 'lax', // 'Lax' tốt cho UX login, 'Strict' quá gắt có thể gây lỗi redirect từ site khác
            maxAge: SESSION_DURATION_MS / 1000,
            path: '/',
            priority: 'high'
        });

        console.log(`[Security] Admin login success: ${userEmail}`);
        return response;

    } catch (error) {
        console.error('[Login Error]', error);
        return NextResponse.json({ error: 'Xác thực thất bại' }, { status: 401 });
    }
}

// API Logout
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
        name: COOKIE_NAME,
        value: '',
        maxAge: 0,
        path: '/',
    });
    return response;
}