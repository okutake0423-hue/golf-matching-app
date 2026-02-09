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
    console.log('[LIFF] 初期化開始', { liffId, currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A' });
    if (!liffInstance) {
      await liff.init({ liffId });
      liffInstance = liff;
      console.log('[LIFF] 初期化成功');
    }
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    const errorDetails = {
      message,
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      fullError: String(error),
    };
    console.error('[LIFF] 初期化失敗 - 詳細:', errorDetails);
    console.error('[LIFF] エラーオブジェクト全体:', error);
    
    if (
      /endpoint|url|domain|redirect/i.test(message) ||
      message.includes('invalid')
    ) {
      return {
        ok: false,
        reason:
          `LIFF のエンドポイントURL がこのアプリのURLと一致していません。\n\nエラー詳細: ${message}\n\n確認してください：\n・LINE Developers Console → LIFF の「エンドポイント URL」が、今開いているアドレスと完全に一致しているか（https:// で始まり、末尾に / を付けない）\n・現在のURL: ${typeof window !== 'undefined' ? window.location.href : '取得できませんでした'}`,
      };
    }
    if (/failed to fetch|network|networkerror/i.test(message)) {
      return {
        ok: false,
        reason:
          `LIFF への接続に失敗しました（Failed to fetch）。\n\nエラー詳細: ${message}\n\n確認してください：\n・このページは LINE アプリの「LIFF を開く」から開いていますか？（ブラウザで URL を直接開くと失敗します）\n・LINE Developers Console → LIFF の「エンドポイント URL」が、今開いているアドレスと完全に一致していますか？（https:// で始まり、末尾に / を付けない）\n・Wi‑Fi・モバイル回線が有効で、LINE のサーバーに届く環境ですか？\n・現在のURL: ${typeof window !== 'undefined' ? window.location.href : '取得できませんでした'}`,
      };
    }
    return {
      ok: false,
      reason:
        `LIFFの初期化に失敗しました\n\nエラー詳細: ${message}\nエラー名: ${errorDetails.name}\n\n確認してください：\n・LINE アプリから「LIFF を開く」で開いていますか？（ブラウザでURLを直接開くと失敗します）\n・LINE Developers Console → LIFF の「エンドポイント URL」が、今のアドレスと完全に一致していますか？\n・NEXT_PUBLIC_LIFF_ID とエンドポイント URL は本番環境に合わせて設定済みですか？\n・現在のURL: ${typeof window !== 'undefined' ? window.location.href : '取得できませんでした'}\n\nブラウザのコンソール（F12 → Console）に詳細なエラー情報が表示されています。`,
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
