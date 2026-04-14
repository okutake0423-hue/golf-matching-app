'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn, getProfile } from '@/lib/liff';
import { addCaddyProfile } from '@/lib/firestore-caddy';
import { CaddyProfileForm } from '@/components/CaddyProfileForm';
import styles from '../caddy-profiles.module.css';

export default function CaddyProfileNewPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
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
        const p = await getProfile();
        setUserId(p.userId);
        setDisplayName(p.displayName ?? '');
        setReady(true);
      } catch (e) {
        console.error('[caddy-profiles/new]', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  const handleSubmit = useCallback(
    async (data: {
      golfCourseName: string;
      caddyName: string;
      caddyNumber: string;
      age: number | null;
      photoFile: File | null;
    }) => {
      if (!userId) return;
      if (!data.photoFile) {
        setSaveError('写真を選択してください');
        return;
      }
      setSubmitting(true);
      setSaveError(null);
      try {
        const ct = data.photoFile.type || 'image/jpeg';
        const presignRes = await fetch('/api/caddy-profiles/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: ct }),
        });
        const presignData = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok) {
          throw new Error(
            (presignData as { message?: string }).message ||
              'アップロードURLの取得に失敗しました'
          );
        }
        const { url, fields, key } = presignData as {
          url?: string;
          fields?: Record<string, string>;
          key?: string;
        };
        if (!url || !fields || !key) {
          throw new Error('アップロード設定が不正です');
        }

        const form = new FormData();
        for (const [k, v] of Object.entries(fields)) {
          form.append(k, v);
        }
        form.append('file', data.photoFile);
        const putRes = await fetch(url, { method: 'POST', body: form });
        if (!putRes.ok) {
          const t = await putRes.text().catch(() => '');
          throw new Error(`画像のアップロードに失敗しました (${putRes.status})${t ? `\n${t}` : ''}`);
        }

        await addCaddyProfile(userId, displayName, {
          golfCourseName: data.golfCourseName,
          caddyName: data.caddyName,
          caddyNumber: data.caddyNumber,
          age: data.age,
          photoS3Key: key,
        });

        alert('登録しました。');
        router.push('/caddy-profiles');
      } catch (e) {
        console.error(e);
        setSaveError(e instanceof Error ? e.message : '登録に失敗しました');
      } finally {
        setSubmitting(false);
      }
    },
    [userId, displayName, router]
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
        <CaddyProfileForm onSubmit={handleSubmit} submitting={submitting} />
        <div className={styles.nav}>
          <Link href="/caddy-profiles" className={styles.backLink}>
            ← 一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
