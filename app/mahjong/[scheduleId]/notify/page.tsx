'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn } from '@/lib/liff';
import { getMahjongSchedulesByMonth } from '@/lib/firestore-mahjong-schedules';
import type { MahjongScheduleRecruit } from '@/types/mahjong-schedule';
import styles from './notify.module.css';

export default function MahjongNotifyPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.scheduleId as string;

  const [ready, setReady] = useState(false);
  const [schedule, setSchedule] = useState<MahjongScheduleRecruit | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Notify page init error:', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!scheduleId || !ready) return;

      try {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const schedules = await getMahjongSchedulesByMonth(monthKey);

        const found = schedules.find((s) => s.id === scheduleId && s.type === 'RECRUIT') as MahjongScheduleRecruit | undefined;

        if (!found) {
          setError('予定が見つかりません');
          setLoading(false);
          return;
        }

        setSchedule(found);
      } catch (err) {
        console.error('Failed to load schedule:', err);
        setError('予定の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [scheduleId, ready]);

  const handleSend = useCallback(async () => {
    if (!schedule) return;

    setIsSending(true);
    setError(null);
    try {
      const response = await fetch('/api/notify/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mahjongRecruitNotify: true,
          scheduleInfo: {
            dateStr: schedule.dateStr,
            playTimeSlot: schedule.playTimeSlot,
            expectedPlayTime: schedule.expectedPlayTime,
            venueName: schedule.venueName,
            isCompetition: schedule.isCompetition ?? false,
            competitionName: schedule.competitionName,
          },
        }),
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { message: `サーバーエラー (${response.status})` };
        }

        const errorMessage = error.message || '通知の送信に失敗しました';
        console.error('[MahjongNotifyPage] APIエラー:', {
          status: response.status,
          statusText: response.statusText,
          error: error,
        });

        let displayMessage = errorMessage;
        if (error.details) {
          console.error('[MahjongNotifyPage] エラー詳細:', error.details);
        }
        if (error.missingVariables && error.missingVariables.length > 0) {
          displayMessage = `${errorMessage}\n\n不足している環境変数: ${error.missingVariables.join(', ')}`;
        }

        throw new Error(displayMessage);
      }

      const result = await response.json();

      if (result.sent === false) {
        if (result.message) {
          alert(result.message);
        } else {
          alert('通知の送信に失敗しました。詳細はコンソールを確認してください。');
        }
        console.error('通知送信結果:', result);
        return;
      }

      if (result.errors && result.errors.length > 0) {
        console.warn('一部の通知送信に失敗:', result.errors);
        alert(`${result.sentCount}件の通知を送信しました（一部失敗: ${result.errors.length}件）`);
      } else {
        alert(`${result.sentCount}件の通知を送信しました`);
      }

      router.push('/mahjong');
    } catch (err) {
      console.error('[MahjongNotifyPage] 通知送信エラー:', err);
      let errorMessage = '通知の送信に失敗しました';

      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes('Firebase Admin SDK')) {
          errorMessage = `${err.message}\n\nVercelの環境変数に FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY が設定されているか確認してください。`;
        }
      }

      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  }, [schedule, router]);

  if (!ready || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (error && !schedule) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>通知を送信</h1>
          <div className={styles.error}>{error}</div>
          <Link href="/mahjong" className={styles.backLink}>
            ← 予定一覧に戻る
          </Link>
        </main>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>通知を送信</h1>
          <div className={styles.loading}>予定を読み込み中...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>通知を送信</h1>

        <div className={styles.scheduleInfo}>
          <h2 className={styles.sectionTitle}>予定情報</h2>
          <p><strong>日付:</strong> {schedule.dateStr}</p>
          <p><strong>時間帯:</strong> {schedule.playTimeSlot || ''}{schedule.expectedPlayTime ? ` / ${schedule.expectedPlayTime}` : ''}</p>
          <p><strong>場所:</strong> {schedule.venueName}</p>
          {schedule.isCompetition && schedule.competitionName && (
            <p><strong>大会名:</strong> {schedule.competitionName}</p>
          )}
        </div>

        <p className={styles.hint}>
          麻雀プロフィールで「募集通知受取り」をONにしているユーザーにLINE通知を送信します。
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className={styles.buttonSend}
          >
            {isSending ? '送信中...' : '通知を送信'}
          </button>
          <Link href="/mahjong" className={styles.buttonCancel}>
            キャンセル
          </Link>
        </div>

        <div className={styles.navLinks}>
          <Link href="/mahjong" className={styles.backLink}>
            ← 予定一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
