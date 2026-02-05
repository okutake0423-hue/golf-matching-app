import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithCustomToken, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebaseアプリの初期化（既に初期化されている場合は再利用）
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Authインスタンスの取得
export const auth: Auth = getAuth(app);

/**
 * LIFFのIDトークンを使ってFirebaseにログインします
 * バックエンドAPIでカスタムトークンを取得してからFirebaseにログインします
 */
export const signInWithLineToken = async (lineIdToken: string): Promise<User> => {
  try {
    // バックエンドAPIでカスタムトークンを取得
    const response = await fetch('/api/auth/line', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: lineIdToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'カスタムトークンの取得に失敗しました');
    }

    const { customToken } = await response.json();

    // カスタムトークンでFirebaseにログイン
    const userCredential = await signInWithCustomToken(auth, customToken);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase sign-in error:', error);
    throw error;
  }
};

export default app;
