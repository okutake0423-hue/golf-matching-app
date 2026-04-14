'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn } from '@/lib/liff';
import { listCaddyProfiles } from '@/lib/firestore-caddy';
import { CaddyProfileCard } from '@/components/CaddyProfileCard';
import type { CaddyProfileDoc } from '@/types/caddy-profile';
import styles from './caddy-profiles.module.css';

export default function CaddyProfilesListPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<CaddyProfileDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCaddyProfiles();
      setItems(list);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : '一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

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
        console.error('[caddy-profiles] init', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

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
        <h1 className={styles.pageTitle}>キャディープロフィール</h1>
        <p className={styles.lead}>ゴルフコース・キャディー情報と写真を一覧できます。</p>

        <div className={styles.toolbar}>
          <Link href="/caddy-profiles/new" className={styles.primaryLink}>
            新規登録
          </Link>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>読み込み中...</div>
        ) : items.length === 0 ? (
          <p className={styles.empty}>
            登録がありません。「新規登録」から追加してください。
          </p>
        ) : (
          <div className={styles.grid}>
            {items.map((p) => (
              <CaddyProfileCard key={p.id ?? p.photoS3Key} profile={p} />
            ))}
          </div>
        )}

        <div className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            ← トップに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
