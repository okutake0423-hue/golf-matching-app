'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn } from '@/lib/liff';
import {
  getMatsushitaKaiRecordById,
  updateMatsushitaKaiRecord,
} from '@/lib/firestore-matsushita';
import { MatsushitaKaiImageImport } from '@/components/MatsushitaKaiImageImport';
import { MatsushitaKaiRecordForm } from '@/components/MatsushitaKaiRecordForm';
import type { MatsushitaKaiRecordFormData } from '@/types/matsushita-kai';
import styles from '../../matsushita-kai.module.css';

export default function MatsushitaKaiEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ready, setReady] = useState(false);
  const [initialData, setInitialData] = useState<MatsushitaKaiRecordFormData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await initLiff();
        if (!result.ok || !isLoggedIn()) {
          router.replace('/');
          return;
        }
        setReady(true);
      } catch (e) {
        console.error('[MatsushitaKai edit] init error:', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!ready || !id) return;

    const load = async () => {
      setLoadError(null);
      try {
        const doc = await getMatsushitaKaiRecordById(id);
        if (!doc) {
          setLoadError('記録が見つかりません');
          return;
        }
        setInitialData({
          competitionName: doc.competitionName,
          golfCourseName: doc.golfCourseName,
          dateStr: doc.dateStr,
          participants: doc.participants,
        });
      } catch (e) {
        console.error(e);
        setLoadError(e instanceof Error ? e.message : '読み込みに失敗しました');
      }
    };
    load();
  }, [ready, id]);

  const handleSubmit = useCallback(
    async (data: MatsushitaKaiRecordFormData) => {
      setSubmitting(true);
      setSaveError(null);
      try {
        await updateMatsushitaKaiRecord(id, data);
        alert('記録を更新しました。');
        router.push('/matsushita-kai');
      } catch (err) {
        console.error(err);
        setSaveError(err instanceof Error ? err.message : '更新に失敗しました');
      } finally {
        setSubmitting(false);
      }
    },
    [id, router]
  );

  const handleImported = useCallback((data: MatsushitaKaiRecordFormData) => {
    // 解析結果で現在の編集内容を置き換える（必要ならユーザーが修正して更新）
    setInitialData(data);
    setFormKey((k) => k + 1);
  }, []);

  if (!ready) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.errorBanner}>{loadError}</div>
          <div className={styles.nav}>
            <Link href="/matsushita-kai" className={styles.backLink}>
              ← 一覧に戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>記録を読み込み中...</div>
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
        <MatsushitaKaiImageImport onImported={handleImported} />
        <MatsushitaKaiRecordForm
          key={`${id}-${formKey}`}
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
        <div className={styles.nav}>
          <Link href="/matsushita-kai" className={styles.backLink}>
            ← 一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
