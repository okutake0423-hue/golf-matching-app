import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getOrCreateApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0] as FirebaseApp;
  }
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    firebaseConfig.apiKey === 'your_firebase_api_key'
  ) {
    throw new Error(
      'Firebaseの環境変数が設定されていません。Vercelの場合は Settings → Environment Variables で NEXT_PUBLIC_FIREBASE_API_KEY と NEXT_PUBLIC_FIREBASE_PROJECT_ID などを設定し、保存後に「Redeploy」してください。'
    );
  }
  return initializeApp(firebaseConfig);
}

const app = getOrCreateApp();

// Authインスタンスの取得
export const auth: Auth = getAuth(app);

// Firestoreインスタンスの取得
export const db: Firestore = getFirestore(app);

export default app;
