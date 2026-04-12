'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn } from '@/lib/liff';
import {
  listMatsushitaKaiRecords,
  deleteMatsushitaKaiRecord,
} from '@/lib/firestore-matsushita';
import type { MatsushitaKaiRecordListItem } from '@/types/matsushita-kai';
import styles from './matsushita-kai.module.css';

export default function MatsushitaKaiListPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<MatsushitaKaiRecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listMatsushitaKaiRecords();
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
        console.error('[MatsushitaKai list] init error:', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('この記録を削除しますか？')) return;
      setDeletingId(id);
      try {
        await deleteMatsushitaKaiRecord(id);
        setItems((prev) => prev.filter((x) => x.id !== id));
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : '削除に失敗しました');
      } finally {
        setDeletingId(null);
      }
    },
    []
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
        <h1 className={styles.pageTitle}>松下会記録</h1>
        <p className={styles.lead}>開催ごとのスコア・順位を一覧できます。</p>

        <div className={styles.toolbar}>
          <Link href="/matsushita-kai/new" className={styles.primaryLink}>
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
          <p className={styles.empty}>記録がありません。「新規登録」から追加してください。</p>
        ) : (
          <div className={styles.listTableWrap}>
            <table className={styles.listTable}>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>コンペ名</th>
                  <th>コース</th>
                  <th>参加人数</th>
                  <th className={styles.colActions}>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.dateStr}</td>
                    <td>{row.competitionName}</td>
                    <td>{row.golfCourseName}</td>
                    <td>{row.participantCount}名</td>
                    <td className={styles.colActions}>
                      <Link
                        href={`/matsushita-kai/${row.id}/edit`}
                        className={styles.inlineLink}
                      >
                        編集
                      </Link>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        {deletingId === row.id ? '削除中...' : '削除'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
