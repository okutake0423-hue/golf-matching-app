import liff from '@line/liff';

export type Profile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

let liffInstance: typeof liff | null = null;

/**
 * LIFFを初期化します
 */
export const initLiff = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    console.error('LIFF ID is not set');
    return false;
  }

  try {
    if (!liffInstance) {
      await liff.init({ liffId });
      liffInstance = liff;
    }
    return true;
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    return false;
  }
};

/**
 * LIFFがログイン済みかどうかを確認します
 */
export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined' || !liffInstance) {
    return false;
  }
  return liffInstance.isLoggedIn();
};

/**
 * LINEログインを実行します
 */
export const login = async (): Promise<void> => {
  if (typeof window === 'undefined' || !liffInstance) {
    throw new Error('LIFF is not initialized');
  }
  if (!liffInstance.isLoggedIn()) {
    liffInstance.login();
  }
};

/**
 * LINEログアウトを実行します
 */
export const logout = async (): Promise<void> => {
  if (typeof window === 'undefined' || !liffInstance) {
    throw new Error('LIFF is not initialized');
  }
  if (liffInstance.isLoggedIn()) {
    liffInstance.logout();
  }
};

/**
 * ユーザープロフィールを取得します
 */
export const getProfile = async (): Promise<Profile> => {
  if (typeof window === 'undefined' || !liffInstance) {
    throw new Error('LIFF is not initialized');
  }
  if (!liffInstance.isLoggedIn()) {
    throw new Error('User is not logged in');
  }

  const profile = await liffInstance.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
  };
};

/**
 * IDトークンを取得します（Firebase認証で使用）
 */
export const getIdToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !liffInstance) {
    return null;
  }
  if (!liffInstance.isLoggedIn()) {
    return null;
  }
  return liffInstance.getIDToken();
};
