'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { initLiff, isLoggedIn, getProfile } from '@/lib/liff';
import { getMahjongSchedulesByMonth, addMahjongSchedule, deleteMahjongSchedule, joinMahjongSchedule } from '@/lib/firestore-mahjong-schedules';
import { MahjongScheduleList } from '@/components/MahjongScheduleList';
import { MahjongScheduleForm } from '@/components/MahjongScheduleForm';
import type { MahjongScheduleDoc, MahjongScheduleFormData, MahjongScheduleRecruit } from '@/types/mahjong-schedule';
import { getMahjongMonthKey } from '@/types/mahjong-schedule';
import styles from './mahjong.module.css';

const MahjongScheduleCalendar = dynamic(
  () =>
    import('@/components/MahjongScheduleCalendar').then((m) => ({
      default: m.MahjongScheduleCalendar,
    })),
  { ssr: false, loading: () => <div className={styles.loading}>カレンダー読み込み中...</div> }
);

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MahjongPage() {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<MahjongScheduleDoc[]>([]);
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return getMahjongMonthKey(toDateStr(d));
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const list = await getMahjongSchedulesByMonth(key);
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
        console.error('Mahjong init error:', e);
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
    async (form: MahjongScheduleFormData) => {
      if (!userId) throw new Error('ログインしてください');
      await addMahjongSchedule(userId, form);
      const key = getMahjongMonthKey(form.dateStr);
      await loadSchedules(key);
      setMonthKey(key);
    },
    [userId, loadSchedules]
  );

  const scrollToForm = useCallback(() => {
    document.getElementById('mahjong-form')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleDelete = useCallback(
    async (scheduleId: string) => {
      try {
        await deleteMahjongSchedule(scheduleId);
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

      const participantName = userName || userId;

      try {
        const result = await joinMahjongSchedule(scheduleId, participantName, userId || undefined);

        const schedule = schedules.find((s) => s.id === scheduleId) as MahjongScheduleRecruit | undefined;
        if (schedule && schedule.type === 'RECRUIT') {
          try {
            await fetch('/api/notify/line', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ownerUserId: schedule.posterId,
                participantName,
                scheduleInfo: {
                  dateStr: schedule.dateStr,
                  startTime: schedule.startTime,
                  venueName: schedule.venueName,
                  remainingCount: result.remainingCount,
                },
              }),
            });
          } catch (notifyErr) {
            console.error('LINE通知の送信に失敗しました:', notifyErr);
          }
        }

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

  const todayStr = toDateStr(new Date());
  const listSchedules = selectedDate
    ? schedules.filter((s) => s.dateStr === toDateStr(selectedDate))
    : schedules.filter((s) => s.dateStr >= todayStr);
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
          <h1 className={styles.title}>麻雀予定</h1>
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
        <h1 className={styles.title}>麻雀予定</h1>
        <div className={styles.headerActions}>
          <p className={styles.back}>
            <Link href="/">← トップへ</Link>
          </p>
          <button type="button" onClick={scrollToForm} className={styles.buttonInput}>
            予定を入力
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>カレンダー</h2>
          <MahjongScheduleCalendar
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
            <MahjongScheduleList
              schedules={listSchedules}
              dateLabel={dateLabel}
              currentUserId={userId}
              currentUserName={userName}
              onDelete={handleDelete}
              onJoin={handleJoin}
            />
          )}
        </section>

        <section id="mahjong-form" className={styles.section}>
          <h2 className={styles.sectionTitle}>予定を投稿</h2>
          <MahjongScheduleForm
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
