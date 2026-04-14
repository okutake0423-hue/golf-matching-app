'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn, getProfile } from '@/lib/liff';
import {
  getCaddyProfileById,
  updateCaddyProfile,
} from '@/lib/firestore-caddy';
import { CaddyProfileForm } from '@/components/CaddyProfileForm';
import styles from '../../caddy-profiles.module.css';

export default function CaddyProfileEditPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.profileId as string;

  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Awaited<
    ReturnType<typeof getCaddyProfileById>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        setReady(true);
      } catch (e) {
        console.error('[caddy-profiles/edit]', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    const load = async () => {
      if (!ready || !profileId || !userId) return;
      setLoading(true);
      setLoadError(null);
      try {
        const doc = await getCaddyProfileById(profileId);
        if (!doc) {
          setLoadError('データが見つかりません');
          setProfile(null);
          return;
        }
        if (doc.posterId !== userId) {
          setLoadError('このプロフィールを編集する権限がありません');
          setProfile(null);
          return;
        }
        setProfile(doc);
      } catch (e) {
        console.error(e);
        setLoadError('読み込みに失敗しました');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, profileId, userId]);

  const handleSubmit = useCallback(
    async (data: {
      golfCourseName: string;
      caddyName: string;
      caddyNumber: string;
      age: number | null;
      photoFile: File | null;
    }) => {
      if (!profileId || !profile) return;
      setSubmitting(true);
      setSaveError(null);
      try {
        let photoS3Key: string | undefined;
        if (data.photoFile) {
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
            throw new Error(
              `画像のアップロードに失敗しました (${putRes.status})${t ? `\n${t}` : ''}`
            );
          }
          photoS3Key = key;
        }

        await updateCaddyProfile(profileId, {
          golfCourseName: data.golfCourseName,
          caddyName: data.caddyName,
          caddyNumber: data.caddyNumber,
          age: data.age,
          ...(photoS3Key ? { photoS3Key } : {}),
        });

        alert('保存しました。');
        router.push('/caddy-profiles');
      } catch (e) {
        console.error(e);
        setSaveError(e instanceof Error ? e.message : '保存に失敗しました');
      } finally {
        setSubmitting(false);
      }
    },
    [profileId, profile, router]
  );

  if (!ready || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.errorBanner} role="alert">
            {loadError ?? 'データがありません'}
          </div>
          <div className={styles.nav}>
            <Link href="/caddy-profiles" className={styles.backLink}>
              ← 一覧に戻る
            </Link>
          </div>
        </main>
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
        <CaddyProfileForm
          variant="edit"
          initialValues={{
            golfCourseName: profile.golfCourseName,
            caddyName: profile.caddyName,
            caddyNumber: profile.caddyNumber,
            age: profile.age,
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
        <div className={styles.nav}>
          <Link href="/caddy-profiles" className={styles.backLink}>
            ← 一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
