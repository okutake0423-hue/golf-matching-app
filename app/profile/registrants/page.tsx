'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn } from '@/lib/liff';
import { COMPANY_OPTIONS } from '@/types/profile';
import styles from './registrants.module.css';

type RegistrantsItem = { companyName: string; count: number };

export default function ProfileRegistrantsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [list, setList] = useState<RegistrantsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error('Registrants page init error:', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/profile/registrants');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || '取得に失敗しました');
        }
        const data = await res.json();
        setList(data.list ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : '取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [ready]);

  const companyLabel = (value: string) => {
    const opt = COMPANY_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : value || '未選択';
  };

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
        <h1 className={styles.title}>プロフィール登録者</h1>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>集計を取得しています...</div>
        ) : (
          <>
            <p className={styles.total}>登録者合計: {total}名</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>会社</th>
                    <th>人数</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.companyName || '__empty__'}>
                      <td>{companyLabel(item.companyName)}</td>
                      <td>{item.count}名</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Link href="/" className={styles.backLink}>
          ← トップに戻る
        </Link>
      </main>
    </div>
  );
}
