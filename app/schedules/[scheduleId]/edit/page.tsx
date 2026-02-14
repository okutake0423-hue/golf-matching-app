'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { initLiff, isLoggedIn, getProfile } from '@/lib/liff';
import { getScheduleById, updateSchedule } from '@/lib/firestore-schedules';
import type { ScheduleRecruit } from '@/types/schedule';
import styles from './edit.module.css';

/** 参加者リストからLINEに送信可能なユーザーIDを抽出 */
function getParticipantUserIds(participants: string[]): string[] {
  const ids: string[] = [];
  for (const p of participants) {
    const parts = p.split(':');
    if (parts.length === 2 && parts[0].trim()) ids.push(parts[0].trim());
  }
  return ids;
}

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.scheduleId as string;

  const [ready, setReady] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleRecruit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォーム状態
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [golfCourseName, setGolfCourseName] = useState('');
  const [playFee, setPlayFee] = useState('');
  const [recruitCount, setRecruitCount] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [isCompetition, setIsCompetition] = useState(false);
  const [competitionName, setCompetitionName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await initLiff();
        if (!result.ok || !isLoggedIn()) {
          router.replace('/');
          return;
        }
        await getProfile();
        setReady(true);
      } catch (e) {
        console.error('Edit page init error:', e);
        router.replace('/');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    const load = async () => {
      if (!scheduleId || !ready) return;
      try {
        const profile = await getProfile();
        const userId = profile.userId;
        const doc = await getScheduleById(scheduleId);
        if (!doc || doc.type !== 'RECRUIT') {
          setError('予定が見つかりません');
          setLoading(false);
          return;
        }
        const s = doc as ScheduleRecruit;
        if (s.posterId !== userId) {
          setError('この予定を編集する権限がありません');
          setLoading(false);
          return;
        }
        setSchedule(s);
        setDateStr(s.dateStr ?? '');
        setStartTime(s.startTime ?? '08:00');
        setGolfCourseName(s.golfCourseName ?? '');
        setPlayFee(String(s.playFee ?? ''));
        setRecruitCount(String(s.recruitCount ?? '0'));
        setParticipants(s.participants ?? []);
        setIsCompetition(s.isCompetition ?? false);
        setCompetitionName(s.competitionName ?? '');
      } catch (err) {
        console.error('Failed to load schedule:', err);
        setError('予定の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [scheduleId, ready]);

  const removeParticipant = useCallback((index: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
    setRecruitCount((prev) => String(Math.max(0, parseInt(prev, 10) + 1)));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!schedule?.id) return;
      setSaving(true);
      setError(null);
      try {
        const playFeeNum = Number(playFee) || 0;
        const recruitCountNum = Math.max(0, Number(recruitCount) || 0);

        await updateSchedule(schedule.id, {
          dateStr,
          startTime,
          golfCourseName: golfCourseName.trim(),
          playFee: playFeeNum,
          recruitCount: recruitCountNum,
          participants,
          isCompetition,
          competitionName: isCompetition ? competitionName.trim() : null,
        });

        const participantUserIds = getParticipantUserIds(participants);
        const summary =
          `以下の予定が更新されました。\n\n` +
          (isCompetition && competitionName ? `【${competitionName}】\n` : '') +
          `日付: ${dateStr}\n時間: ${startTime}\nコース: ${golfCourseName}\n` +
          `プレーフィー: ${playFeeNum.toLocaleString()}THB ・ あと${recruitCountNum}名\n\n` +
          `アプリ: https://golf-matching-app.vercel.app/`;

        if (participantUserIds.length > 0) {
          await fetch('/api/notify/schedule-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantUserIds, scheduleInfo: { summary } }),
          });
        }

        router.push('/schedules');
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存に失敗しました');
      } finally {
        setSaving(false);
      }
    },
    [
      schedule?.id,
      dateStr,
      startTime,
      golfCourseName,
      playFee,
      recruitCount,
      participants,
      isCompetition,
      competitionName,
      router,
    ]
  );

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
          <h1 className={styles.title}>募集を修正</h1>
          <div className={styles.error}>{error}</div>
          <Link href="/schedules" className={styles.backLink}>
            予定一覧に戻る
          </Link>
        </main>
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>募集を修正</h1>
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>日付</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>開始時間</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>ゴルフコース名</label>
            <input
              type="text"
              value={golfCourseName}
              onChange={(e) => setGolfCourseName(e.target.value)}
              placeholder="例: ○○カントリークラブ"
              required
            />
          </div>
          <div className={styles.field}>
            <label>プレーフィー（THB）</label>
            <input
              type="number"
              min={0}
              value={playFee}
              onChange={(e) => setPlayFee(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>募集人数（あと○名）</label>
            <input
              type="number"
              min={0}
              value={recruitCount}
              onChange={(e) => setRecruitCount(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>参加者（削除する場合は×を押してください）</label>
            {participants.length === 0 ? (
              <p className={styles.hint}>参加者はいません</p>
            ) : (
              <ul className={styles.participantList}>
                {participants.map((entry, index) => {
                  const displayName = entry.includes(':') ? entry.split(':')[1] : entry;
                  return (
                    <li key={index} className={styles.participantItem}>
                      <span>{displayName}</span>
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className={styles.removeBtn}
                        aria-label="参加者を削除"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isCompetition}
                onChange={(e) => {
                  setIsCompetition(e.target.checked);
                  if (!e.target.checked) setCompetitionName('');
                }}
              />
              コンペ
            </label>
          </div>
          {isCompetition && (
            <div className={styles.field}>
              <label>コンペ名</label>
              <input
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="例: 社内ゴルフコンペ"
              />
            </div>
          )}

          <div className={styles.actions}>
            <button type="submit" disabled={saving} className={styles.buttonSubmit}>
              {saving ? '保存中...' : '変更を保存'}
            </button>
            <Link href="/schedules" className={styles.buttonCancel}>
              キャンセル
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
