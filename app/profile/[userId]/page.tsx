'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initLiff, isLoggedIn } from '@/lib/liff';
import { getUserProfile } from '@/lib/firestore';
import { ProfileDisplay } from '@/components/ProfileDisplay';
import type { UserProfileDisplay } from '@/types/profile';
import styles from './page.module.css';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileDisplay | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // LIFFの初期化（ログイン確認のため）
        const result = await initLiff();
        setIsInitialized(result.ok);
        
        if (!result.ok) {
          setError('LIFFの初期化に失敗しました');
          setIsLoading(false);
          return;
        }

        // ユーザープロフィールを取得
        const userProfile = await getUserProfile(userId);
        
        if (!userProfile) {
          setError('ユーザーが見つかりませんでした');
          setIsLoading(false);
          return;
        }

        // UserProfileDisplay形式に変換
        const displayProfile: UserProfileDisplay = {
          userId: userProfile.userId,
          displayName: userProfile.displayName,
          pictureUrl: userProfile.pictureUrl,
          statusMessage: userProfile.statusMessage,
          companyName: userProfile.companyName ?? '',
          averageScore: userProfile.averageScore ?? null,
          playStyle: userProfile.playStyle ?? '',
          profileCheckboxes: userProfile.profileCheckboxes ?? [],
        };

        setProfile(displayProfile);
      } catch (err) {
        console.error('[UserProfilePage] エラー:', err);
        setError(err instanceof Error ? err.message : 'プロフィールの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      initialize();
    }
  }, [userId]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>プロフィール</h1>
          <div className={styles.error}>{error || 'ユーザーが見つかりませんでした'}</div>
          <button type="button" onClick={handleBack} className={styles.button}>
            戻る
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <ProfileDisplay profile={profile} />
        <div className={styles.actions}>
          <button type="button" onClick={handleBack} className={styles.button}>
            戻る
          </button>
        </div>
      </main>
    </div>
  );
}
