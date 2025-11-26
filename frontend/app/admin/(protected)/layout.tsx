import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebaseAdmin';

const COOKIE_NAME = 'adminSession';
const ALLOWED_ADMIN_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

async function verifyAdminSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
        redirect('/admin/login');
    }

    try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

        if (
            ALLOWED_ADMIN_EMAILS.length > 0 &&
            (!decoded.email ||
                !ALLOWED_ADMIN_EMAILS.includes(decoded.email.toLowerCase()))
        ) {
            throw new Error('Email không được cấp quyền');
        }
    } catch (error) {
        console.error('verifyAdminSession error', error);
        redirect('/admin/login');
    }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
    await verifyAdminSession();
    return <>{children}</>;
}

