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
    } satisfies UserProfileDisplay;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await initLiff();
        setIsInitialized(initialized);

        if (initialized && isLoggedIn()) {
          const lineProfile = await getProfile();
          const merged = await loadMergedProfile(lineProfile);
          setProfile(merged);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('初期化に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await login();
      const lineProfile = await getProfile();
      const merged = await loadMergedProfile(lineProfile);
      setProfile(merged);
    } catch (err) {
      console.error('Login error:', err);
      setError('ログインに失敗しました');
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <strong>LIFFの初期化に失敗しました。</strong>
          <br /><br />
          環境変数 <code>NEXT_PUBLIC_LIFF_ID</code> を設定してください。
          <br /><br />
          <strong>ローカル開発:</strong> プロジェクト直下に <code>.env.local</code> を作成し、
          <code>NEXT_PUBLIC_LIFF_ID=あなたのLIFF_ID</code> を記述。保存後、開発サーバーを再起動。
          <br /><br />
          <strong>Vercel:</strong> プロジェクト → Settings → Environment Variables で
          <code>NEXT_PUBLIC_LIFF_ID</code> を追加し、再デプロイ。
        </div>
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
