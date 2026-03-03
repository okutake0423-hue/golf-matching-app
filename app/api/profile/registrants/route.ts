import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

const USERS_COLLECTION = 'users';

/**
 * プロフィール登録者を会社別に集計して返す
 */
export async function GET() {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (!privateKey.includes('\n') && privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')) {
        privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n');
        privateKey = privateKey.replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
      }
    }

    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json(
        { message: 'Firebase Adminの設定が不足しています' },
        { status: 500 }
      );
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    const db = admin.firestore();
    const snapshot = await db.collection(USERS_COLLECTION).get();

    const countByCompany: Record<string, number> = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const company = typeof data.companyName === 'string' && data.companyName.trim() !== ''
        ? data.companyName.trim()
        : '';
      countByCompany[company] = (countByCompany[company] ?? 0) + 1;
    });

    const list = Object.entries(countByCompany).map(([companyName, count]) => ({
      companyName: companyName || '',
      count,
    })).sort((a, b) => {
      if (a.companyName === '') return 1;
      if (b.companyName === '') return -1;
      return a.companyName.localeCompare(b.companyName);
    });

    const total = snapshot.size;
    return NextResponse.json({ list, total });
  } catch (error) {
    console.error('[Profile Registrants API]', error);
    const message = error instanceof Error ? error.message : '取得に失敗しました';
    return NextResponse.json({ message }, { status: 500 });
  }
}
