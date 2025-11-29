import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

// Lấy danh sách admin từ biến môi trường Server
const ALLOWED_ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const COOKIE_NAME = 'adminSession';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5; // 5 ngày (để admin đỡ phải login lại nhiều lần)

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json({ error: 'Thiếu thông tin xác thực' }, { status: 400 });
        }

        // 1. Xác minh ID Token gửi từ client
        const decodedIdToken = await adminAuth.verifyIdToken(idToken);
        const userEmail = decodedIdToken.email?.toLowerCase();

        // 2. Kiểm tra xem email này có trong danh sách Admin cho phép không
        // Đây là bước quan trọng nhất để chặn người lạ
        if (!userEmail || !ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
            console.warn(`[Security] Unauthorized access attempt by: ${userEmail}`);
            return NextResponse.json({ error: 'Tài khoản không có quyền truy cập Admin' }, { status: 403 });
        }

        // 3. Tạo Session Cookie
        // Cookie này đại diện cho phiên làm việc của Admin, an toàn hơn dùng token trực tiếp
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_DURATION_MS,
        });

        // 4. Trả về Response kèm Cookie
        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: COOKIE_NAME,
            value: sessionCookie,
            httpOnly: true, // Javascript client không thể đọc (chống XSS)
            // secure: process.env.NODE_ENV !== 'production',
            secure: process.env.NODE_ENV !== 'development', // Bắt buộc HTTPS ở production
            // sameSite: 'lax',
            sameSite: 'strict',// Giúp giữ cookie khi chuyển trang mượt mà hơn
            maxAge: SESSION_DURATION_MS / 1000,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('[Login Error]', error);
        return NextResponse.json({ error: 'Xác thực thất bại, vui lòng thử lại' }, { status: 401 });
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