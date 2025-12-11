import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const hasCredentials = projectId && clientEmail && privateKey;

const firebaseAdminApp =
    getApps().length > 0
        ? getApps()[0]
        : hasCredentials
            ? initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            })
            : undefined;

if (!firebaseAdminApp) {
    throw new Error(
        'Firebase Admin chưa được cấu hình. Vui lòng bổ sung FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY trong biến môi trường.'
    );
}

const adminAuth = getAuth(firebaseAdminApp);
const adminDb = getFirestore(firebaseAdminApp);

export { adminAuth, adminDb };

