'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { initLiff, isLoggedIn, getProfile } from '@/lib/liff';
import { getSchedulesByMonth, addSchedule, deleteSchedule, joinSchedule } from '@/lib/firestore-schedules';
import { ScheduleList } from '@/components/ScheduleList';
import { ScheduleForm } from '@/components/ScheduleForm';
import type { ScheduleDoc, ScheduleFormData, ScheduleRecruit } from '@/types/schedule';
import { getMonthKey } from '@/types/schedule';
import styles from './schedules.module.css';

const ScheduleCalendar = dynamic(
  () =>
    import('@/components/ScheduleCalendar').then((m) => ({
      default: m.ScheduleCalendar,
    })),
  { ssr: false, loading: () => <div className={styles.loading}>カレンダー読み込み中...</div> }
);

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function SchedulesPage() {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ScheduleDoc[]>([]);
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return getMonthKey(toDateStr(d));
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const list = await getSchedulesByMonth(key);
      setSchedules(list);
    } catch (err) {
      console.error(err);
      setError('予定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules(monthKey);
  }, [monthKey, loadSchedules]);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await initLiff();
        if (!result.ok || !isLoggedIn()) {
          setReady(true);
          return;
        }
        const profile = await getProfile();
        setUserId(profile?.userId ?? null);
        setUserName(profile?.displayName ?? null);
      } catch (e) {
        console.error('Schedules init error:', e);
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  const handleCalendarMonthChange = useCallback((key: string) => {
    setMonthKey(key);
  }, []);

  const handleSubmit = useCallback(
    async (form: ScheduleFormData) => {
      if (!userId) throw new Error('ログインしてください');
      await addSchedule(userId, form);
      const key = getMonthKey(form.dateStr);
      await loadSchedules(key);
      setMonthKey(key);
    },
    [userId, loadSchedules]
  );

  const scrollToForm = useCallback(() => {
    document.getElementById('schedule-form')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleDelete = useCallback(
    async (scheduleId: string) => {
      try {
        await deleteSchedule(scheduleId);
        await loadSchedules(monthKey);
      } catch (err) {
        console.error('Failed to delete schedule:', err);
        setError('削除に失敗しました');
      }
    },
    [monthKey, loadSchedules]
  );

  const handleJoin = useCallback(
    async (scheduleId: string) => {
      if (!userId) {
        alert('ログインしてください');
        return;
      }

      // userNameがnullの場合はuserIdを使用
      const participantName = userName || userId;

      try {
        // 参加処理（ユーザーIDも渡す）
        const result = await joinSchedule(scheduleId, participantName, userId || undefined);
        
        // 参加した予定の情報を取得してLINE通知を送信
        const schedule = schedules.find((s) => s.id === scheduleId) as ScheduleRecruit | undefined;
        if (schedule && schedule.type === 'RECRUIT') {
          try {
            await fetch('/api/notify/line', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ownerUserId: schedule.posterId,
                participantName: participantName,
                scheduleInfo: {
                  dateStr: schedule.dateStr,
                  startTime: schedule.startTime,
                  golfCourseName: schedule.golfCourseName,
                  remainingCount: result.remainingCount,
                },
              }),
            });
          } catch (notifyErr) {
            console.error('LINE通知の送信に失敗しました:', notifyErr);
            // 通知失敗でも参加処理は成功とする
          }
        }
        
        // 予定一覧を再読み込み
        await loadSchedules(monthKey);
        alert('参加しました！');
      } catch (err) {
        console.error('Failed to join schedule:', err);
        const errorMessage = err instanceof Error ? err.message : '参加に失敗しました';
        setError(errorMessage);
        alert(errorMessage);
      }
    },
    [userId, userName, schedules, monthKey, loadSchedules]
  );

  const listSchedules = selectedDate
    ? schedules.filter((s) => s.dateStr === toDateStr(selectedDate))
    : schedules;
  const dateLabel = selectedDate
    ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`
    : undefined;

  if (!ready) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>ゴルフ予定</h1>
          <p className={styles.loginPrompt}>
            <Link href="/">LINEでログイン</Link>すると予定の登録・表示ができます。
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>ゴルフ予定</h1>
        <div className={styles.headerActions}>
          <p className={styles.back}>
            <Link href="/">← トップへ</Link>
          </p>
          <button type="button" onClick={scrollToForm} className={styles.buttonInput}>
            スケジュールを入力
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>カレンダー</h2>
          <ScheduleCalendar
            value={selectedDate}
            onChange={setSelectedDate}
            schedules={schedules}
            activeMonthKey={monthKey}
            onActiveMonthChange={handleCalendarMonthChange}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {dateLabel ? `${dateLabel}の予定` : '今月の予定一覧'}
          </h2>
          {loading ? (
            <p className={styles.loading}>取得中...</p>
          ) : (
            <ScheduleList
              schedules={listSchedules}
              dateLabel={dateLabel}
              currentUserId={userId}
              currentUserName={userName}
              onDelete={handleDelete}
              onJoin={handleJoin}
            />
          )}
        </section>

        <section id="schedule-form" className={styles.section}>
          <h2 className={styles.sectionTitle}>予定を投稿</h2>
          <ScheduleForm
            posterId={userId}
            defaultDateStr={
              selectedDate ? toDateStr(selectedDate) : undefined
            }
            onSubmit={handleSubmit}
          />
        </section>
      </main>
    </div>
  );
}
