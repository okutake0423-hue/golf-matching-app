import { signInWithCustomToken, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { getIdToken } from './liff';

/**
 * LIFFのIDトークンを使ってFirebaseにログインします
 * バックエンドAPIでカスタムトークンを取得してからFirebaseにログインします
 */
export const signInWithLine = async (): Promise<User | null> => {
  try {
    // LIFFのIDトークンを取得
    const lineIdToken = await getIdToken();
    if (!lineIdToken) {
      throw new Error('LINE IDトークンを取得できませんでした');
    }

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
    return null;
  }
};

/**
 * Firebaseからログアウトします
 */
export const signOutFirebase = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase sign-out error:', error);
    throw error;
  }
};

/**
 * 現在のFirebaseユーザーを取得します
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
