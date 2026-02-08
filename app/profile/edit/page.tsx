'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn, getProfile } from '@/lib/liff';
import { getUserProfile, setUserProfile } from '@/lib/firestore';
import { ProfileEditForm } from '@/components/ProfileEditForm';
import type { UserProfileFormData, UserProfileDisplay } from '@/types/profile';
import styles from './edit.module.css';

export default function ProfileEditPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<UserProfileFormData | null>(
    null
  );
  const [lineProfile, setLineProfile] = useState<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const initialized = await initLiff();
      if (!initialized || !isLoggedIn()) {
        router.replace('/');
        return;
      }
      try {
        const line = await getProfile();
        setLineProfile(line);
        const stored = await getUserProfile(line.userId);
        setInitialData({
          companyName: stored?.companyName ?? '',
          averageScore: stored?.averageScore ?? null,
          playStyle: stored?.playStyle ?? '',
        });
      } catch (err) {
        console.error(err);
        setError('プロフィールの読み込みに失敗しました');
      } finally {
        setLoading(false);
        setReady(true);
      }
    };
    load();
  }, [router]);

  const handleSave = async (data: UserProfileFormData) => {
    if (!lineProfile) return;
    await setUserProfile(
      lineProfile.userId,
      {
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        statusMessage: lineProfile.statusMessage,
      },
      data
    );
    router.push('/');
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (!ready || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (error || !initialData || !lineProfile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error ?? 'ログインしてください'}</div>
        <Link href="/" className={styles.link}>
          トップへ
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <ProfileEditForm
          initialData={initialData}
          onSave={handleSave}
          onCancel={handleCancel}
        />
        <p className={styles.back}>
          <Link href="/" className={styles.link}>
            ← トップへ戻る
          </Link>
        </p>
      </main>
    </div>
  );
}
