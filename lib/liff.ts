import liff from '@line/liff';

export type Profile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

let liffInstance: typeof liff | null = null;

export type InitLiffResult = { ok: true } | { ok: false; reason: string };

/**
 * LIFFを初期化します
 */
export const initLiff = async (): Promise<InitLiffResult> => {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'window is not available' };
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
  if (!liffId || liffId === 'your_liff_id_here') {
    return {
      ok: false,
      reason:
        'NEXT_PUBLIC_LIFF_ID が設定されていません。Vercel の場合は Environment Variables に追加し、保存後に Redeploy してください。',
    };
  }

  try {
    if (!liffInstance) {
      await liff.init({ liffId });
      liffInstance = liff;
    }
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error('LIFF initialization failed:', error);
    if (
      /endpoint|url|domain|redirect/i.test(message) ||
      message.includes('invalid')
    ) {
      return {
        ok: false,
        reason:
          'LIFF のエンドポイントURL がこのアプリのURLと一致していません。LINE Developers Console の LIFF 設定で、エンドポイントURL をこのアプリのURL（例: https://xxx.vercel.app）に変更してください。',
      };
    }
    return {
      ok: false,
      reason: `LIFFの初期化に失敗しました: ${message}`,
    };
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
