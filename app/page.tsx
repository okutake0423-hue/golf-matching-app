'use client';

import { useEffect, useState } from 'react';
import { initLiff, isLoggedIn, login, logout, getProfile, type Profile } from '@/lib/liff';
import styles from './page.module.css';

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await initLiff();
        setIsInitialized(initialized);

        if (initialized && isLoggedIn()) {
          // ログイン済みの場合、プロフィールを取得
          const userProfile = await getProfile();
          setProfile(userProfile);
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
      // ログイン後、プロフィールを取得
      const userProfile = await getProfile();
      setProfile(userProfile);
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
          LIFFの初期化に失敗しました。環境変数を確認してください。
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
          <div className={styles.profile}>
            <h2 className={styles.profileTitle}>プロフィール</h2>
            {profile.pictureUrl && (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className={styles.profileImage}
              />
            )}
            <div className={styles.profileInfo}>
              <p className={styles.profileItem}>
                <strong>表示名:</strong> {profile.displayName}
              </p>
              <p className={styles.profileItem}>
                <strong>ユーザーID:</strong> {profile.userId}
              </p>
              {profile.statusMessage && (
                <p className={styles.profileItem}>
                  <strong>ステータスメッセージ:</strong> {profile.statusMessage}
                </p>
              )}
            </div>
            <button onClick={handleLogout} className={styles.button}>
              ログアウト
            </button>
          </div>
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
