import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebaseAdmin';

// Đảm bảo tên biến môi trường khớp với file API route.ts bạn đã làm
const ALLOWED_ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const COOKIE_NAME = 'adminSession';

async function verifyAdminSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    // 1. Kiểm tra tồn tại Cookie
    if (!sessionCookie) {
        redirect('/admin/login');
    }

    try {
        // 2. Xác thực Session với Firebase Admin (Server-side)
        // checkRevoked: true buộc kiểm tra xem session có bị hủy chưa
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

        // 3. Kiểm tra Email có trong Whitelist không (Lớp bảo vệ thứ 2)
        if (
            ALLOWED_ADMIN_EMAILS.length > 0 &&
            (!decoded.email ||
                !ALLOWED_ADMIN_EMAILS.includes(decoded.email.toLowerCase()))
        ) {
            throw new Error('Email unauthorized');
        }
    } catch (error) {
        console.error('[Security] Session verification failed:', error);
        redirect('/admin/login');
    }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
    // Chặn truy cập nếu không hợp lệ
    await verifyAdminSession();

    return (
        // Bọc trong thẻ div hoặc fragment đều được
        <section>
            {children}
        </section>
    );
}