import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

const ALLOWED_ADMIN_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const COOKIE_NAME = 'adminSession';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24; // 24h

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Thiếu idToken' }, { status: 400 });
        }

        const decodedIdToken = await adminAuth.verifyIdToken(idToken);

        if (
            ALLOWED_ADMIN_EMAILS.length > 0 &&
            (!decodedIdToken.email ||
                !ALLOWED_ADMIN_EMAILS.includes(decodedIdToken.email.toLowerCase()))
        ) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
        }

        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_DURATION_MS,
        });

        const response = NextResponse.json({ success: true });
        response.cookies.set({
            name: COOKIE_NAME,
            value: sessionCookie,
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: SESSION_DURATION_MS / 1000,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('POST /api/auth/session error', error);
        return NextResponse.json({ error: 'Xác thực thất bại' }, { status: 401 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
        name: COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
    });
    return response;
}

