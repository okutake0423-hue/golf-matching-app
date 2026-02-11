'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn } from '@/lib/liff';
import { getSchedulesByMonth } from '@/lib/firestore-schedules';
import { PROFILE_CHECKBOX_OPTIONS, type ProfileCheckboxValue } from '@/types/profile';
import type { ScheduleRecruit } from '@/types/schedule';
import styles from './notify.module.css';

export default function NotifyPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.scheduleId as string;

  const [ready, setReady] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleRecruit | null>(null);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<ProfileCheckboxValue[]>([]);
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
        // 現在の月の予定を取得（簡易実装）
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const schedules = await getSchedulesByMonth(monthKey);
        
        const found = schedules.find((s) => s.id === scheduleId && s.type === 'RECRUIT') as ScheduleRecruit | undefined;
        
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

  const handleCheckboxChange = useCallback((value: ProfileCheckboxValue, checked: boolean) => {
    if (checked) {
      setSelectedCheckboxes((prev) => [...prev, value]);
    } else {
      setSelectedCheckboxes((prev) => prev.filter((v) => v !== value));
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!schedule || selectedCheckboxes.length === 0) {
      setError('少なくとも1つの項目を選択してください');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const response = await fetch('/api/notify/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileCheckboxes: selectedCheckboxes,
          scheduleInfo: {
            dateStr: schedule.dateStr,
            startTime: schedule.startTime,
            golfCourseName: schedule.golfCourseName,
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
        console.error('[NotifyPage] APIエラー:', {
          status: response.status,
          statusText: response.statusText,
          error: error,
        });
        
        // 詳細なエラー情報を表示
        let displayMessage = errorMessage;
        if (error.details) {
          console.error('[NotifyPage] エラー詳細:', error.details);
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
      
      router.push('/schedules');
    } catch (err) {
      console.error('[NotifyPage] 通知送信エラー:', err);
      let errorMessage = '通知の送信に失敗しました';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // APIから返された詳細なエラー情報を表示
        if (err.message.includes('Firebase Admin SDK')) {
          errorMessage = `${err.message}\n\nVercelの環境変数に FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY が設定されているか確認してください。`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  }, [schedule, selectedCheckboxes, router]);

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
          <Link href="/schedules" className={styles.backLink}>
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
          {schedule.startTime && (
            <p><strong>時間:</strong> {schedule.startTime}</p>
          )}
          <p><strong>コース:</strong> {schedule.golfCourseName}</p>
          {schedule.isCompetition && schedule.competitionName && (
            <p><strong>コンペ名:</strong> {schedule.competitionName}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>通知を送る対象（プロフィール項目）</label>
          <div className={styles.checkboxGroup}>
            {PROFILE_CHECKBOX_OPTIONS.map((option) => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedCheckboxes.includes(option.value)}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  className={styles.checkbox}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || selectedCheckboxes.length === 0}
            className={styles.buttonSend}
          >
            {isSending ? '送信中...' : '通知を送信'}
          </button>
          <Link href="/schedules" className={styles.buttonCancel}>
            キャンセル
          </Link>
        </div>

        <div className={styles.navLinks}>
          <Link href="/schedules" className={styles.backLink}>
            ← 予定一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
