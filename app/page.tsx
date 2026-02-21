'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initLiff, isLoggedIn, login, logout, getProfile, type Profile } from '@/lib/liff';
import { getUserProfile } from '@/lib/firestore';
import { ProfileDisplay } from '@/components/ProfileDisplay';
import type { UserProfileDisplay } from '@/types/profile';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileDisplay | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMergedProfile = async (lineProfile: Profile) => {
    const stored = await getUserProfile(lineProfile.userId);
    return {
      userId: lineProfile.userId,
      displayName: lineProfile.displayName,
      pictureUrl: lineProfile.pictureUrl,
      statusMessage: lineProfile.statusMessage,
      companyName: stored?.companyName ?? '',
      averageScore: stored?.averageScore ?? null,
      playStyle: stored?.playStyle ?? '',
      profileCheckboxes: stored?.profileCheckboxes ?? [],
    } satisfies UserProfileDisplay;
  };

  useEffect(() => {
    const initialize = async () => {
      console.log('[App] 初期化開始', {
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
      });
      try {
        const result = await initLiff();
        console.log('[App] LIFF初期化結果:', result);
        setIsInitialized(result.ok);

        if (!result.ok) {
          console.error('[App] LIFF初期化失敗:', result.reason);
          setError(result.reason);
          return;
        }

        if (isLoggedIn()) {
          console.log('[App] ログイン済み、プロフィール取得中...');
          const lineProfile = await getProfile();
          const merged = await loadMergedProfile(lineProfile);
          setProfile(merged);
          console.log('[App] プロフィール取得完了');
        } else {
          console.log('[App] 未ログイン');
        }
      } catch (err) {
        console.error('[App] 初期化エラー:', err);
        const errorMessage = err instanceof Error 
          ? `${err.message}\n\nスタック:\n${err.stack || 'なし'}`
          : String(err);
        setError(`予期しないエラーが発生しました:\n\n${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // LIFFのログインを実行（リダイレクトが発生する可能性がある）
      await login();
      
      // ログイン後、少し待ってからログイン状態を確認
      // LIFFのlogin()はリダイレクトを伴うため、このコードに到達しない可能性がある
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ログイン状態を確認
      if (isLoggedIn()) {
        const lineProfile = await getProfile();
        const merged = await loadMergedProfile(lineProfile);
        setProfile(merged);
      } else {
        // ログインが完了していない場合、ページをリロードして再試行
        // LIFFのログインフローは通常リダイレクトを伴うため、
        // この時点でログインが完了していない場合は、リダイレクトが発生していない可能性がある
        console.warn('[App] ログイン後もログイン状態がfalseです。ページをリロードします。');
        window.location.reload();
      }
    } catch (err) {
      console.error('[App] Login error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`ログインに失敗しました: ${errorMessage}\n\nブラウザのコンソール（F12 → Console）に詳細なエラー情報が表示されています。`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('ログアウトに失敗しました');
    }
  };

  const handleEdit = () => {
    router.push('/profile/edit');
  };

  const handleSchedules = () => {
    router.push('/schedules');
  };

  const handleMahjongSchedules = () => {
    router.push('/mahjong');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  const handleRetryInit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await initLiff();
      setIsInitialized(result.ok);
      if (!result.ok) setError(result.reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : '初期化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const liffIdSet = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LIFF_ID && process.env.NEXT_PUBLIC_LIFF_ID !== 'your_liff_id_here';
    const isLineBrowser = typeof window !== 'undefined' && /Line/i.test(navigator.userAgent);
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>ゴルフマッチングアプリ</h1>
          <div className={styles.error}>
            <strong>LIFFの初期化に失敗しました</strong>
            <br /><br />
            {error || '不明なエラー'}
          </div>
          
          <div className={styles.diagnostic}>
            <strong>診断情報:</strong>
            <ul>
              <li>現在のURL: <code>{currentUrl || '取得できませんでした'}</code></li>
              <li>LIFF ID設定: {liffIdSet ? '✓ 設定済み' : '✗ 未設定またはデフォルト値'}</li>
              <li>ブラウザ: {isLineBrowser ? '✓ LINEアプリ内ブラウザ' : '✗ 通常のブラウザ（LINEアプリから開いてください）'}</li>
              <li>User Agent: <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{userAgent || '取得できませんでした'}</code></li>
            </ul>
            <p className={styles.diagnosticNote}>
              <strong>確認手順:</strong><br />
              1. <strong>ブラウザのコンソールを開く</strong>（F12 → Console タブ）で、`[LIFF]` や `[App]` で始まるログを確認してください<br />
              2. LINE Developers Console → チャネル → LIFF → エンドポイントURL が上記「現在のURL」と<strong>完全に一致</strong>しているか確認（大文字小文字、末尾の / も含めて）<br />
              3. Vercel → Settings → Environment Variables に NEXT_PUBLIC_LIFF_ID が設定され、<strong>Redeploy 済み</strong>か確認<br />
              4. LINE アプリ内でこのリンクを再度タップして開き直す<br />
              5. それでも解決しない場合、コンソールに表示されている<strong>エラーメッセージ全体</strong>をコピーして共有してください
            </p>
          </div>
          
          <p className={styles.errorHint}>
            <strong>重要:</strong> ブラウザの開発者ツール（F12）→ Console タブに詳細なエラー情報が表示されています。その内容を確認してください。
          </p>
          <button type="button" onClick={handleRetryInit} className={styles.button}>
            再試行
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>ゴルフマッチングアプリ</h1>

        {error && <div className={styles.error}>{error}</div>}

        {profile ? (
          <ProfileDisplay
            profile={profile}
            onEdit={handleEdit}
            onLogout={handleLogout}
            onSchedules={handleSchedules}
            onMahjongSchedules={handleMahjongSchedules}
          />
        ) : (
          <div className={styles.login}>
            <p className={styles.loginMessage}>
              LINEでログインしてください
            </p>
            <button onClick={handleLogin} className={styles.button}>
              LINEでログイン
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
