'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn, getProfile } from '@/lib/liff';
import { addMatsushitaKaiRecord } from '@/lib/firestore-matsushita';
import { MatsushitaKaiRecordForm } from '@/components/MatsushitaKaiRecordForm';
import type { MatsushitaKaiRecordFormData } from '@/types/matsushita-kai';
import styles from './matsushita-kai.module.css';

export default function MatsushitaKaiPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await initLiff();
        if (!result.ok || !isLoggedIn()) {
          router.replace('/');
          return;
        }
        const profile = await getProfile();
        setUserId(profile.userId);
        setReady(true);
      } catch (e) {
        console.error('[MatsushitaKai] init error:', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  const handleSubmit = useCallback(
    async (data: MatsushitaKaiRecordFormData) => {
      if (!userId) return;
      setSubmitting(true);
      setSaveError(null);
      try {
        await addMatsushitaKaiRecord(userId, data);
        alert('記録を保存しました。');
        router.push('/');
      } catch (err) {
        console.error(err);
        setSaveError(
          err instanceof Error ? err.message : '保存に失敗しました'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [userId, router]
  );

  if (!ready) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {saveError && (
          <div className={styles.errorBanner} role="alert">
            {saveError}
          </div>
        )}
        <MatsushitaKaiRecordForm onSubmit={handleSubmit} submitting={submitting} />
        <div className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            ← トップに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
