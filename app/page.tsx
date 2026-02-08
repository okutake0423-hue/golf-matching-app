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
        const result = await initLiff();
        setIsInitialized(result.ok);

        if (!result.ok) {
          setError(result.reason);
          return;
        }

        if (isLoggedIn()) {
          const lineProfile = await getProfile();
          const merged = await loadMergedProfile(lineProfile);
          setProfile(merged);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError(
          err instanceof Error ? err.message : '初期化に失敗しました'
        );
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

  const handleSchedules = () => {
    router.push('/schedules');
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
        <main className={styles.main}>
          <h1 className={styles.title}>ゴルフマッチングアプリ</h1>
          <div className={styles.error}>
            <strong>初期化に失敗しました</strong>
            <br /><br />
            {error || '不明なエラー'}
          </div>
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
