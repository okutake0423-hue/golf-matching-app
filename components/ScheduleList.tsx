'use client';

import { useEffect, useState } from 'react';
import type { ScheduleDoc, ScheduleRecruit, ScheduleWish } from '@/types/schedule';
import { getUserProfile } from '@/lib/firestore';
import styles from './ScheduleList.module.css';

type Props = {
  schedules: ScheduleDoc[];
  dateLabel?: string;
  currentUserId?: string | null;
  onDelete?: (scheduleId: string) => Promise<void>;
};

export function ScheduleList({ schedules, dateLabel, currentUserId, onDelete }: Props) {
  if (schedules.length === 0) {
    return (
      <div className={styles.empty}>
        {dateLabel ? `${dateLabel}の予定はありません` : '予定はありません'}
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {schedules.map((s, index) => (
        <li key={s.id ?? `schedule-${index}`} className={styles.item}>
          {s.type === 'RECRUIT' ? (
            <RecruitCard
              schedule={s as ScheduleRecruit}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          ) : (
            <WishCard
              schedule={s as ScheduleWish}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function RecruitCard({
  schedule,
  currentUserId,
  onDelete,
}: {
  schedule: ScheduleRecruit;
  currentUserId?: string | null;
  onDelete?: (scheduleId: string) => Promise<void>;
}) {
  const [posterName, setPosterName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const participants = schedule.participants ?? [];
  const playFee = Number(schedule.playFee) || 0;
  const recruitCount = Number(schedule.recruitCount) || 0;
  const isOwnPost = currentUserId === schedule.posterId;
  const isCompetition = schedule.isCompetition ?? false;

  useEffect(() => {
    const loadPosterName = async () => {
      try {
        const profile = await getUserProfile(schedule.posterId);
        setPosterName(profile?.displayName || schedule.posterId);
      } catch (err) {
        console.error('Failed to load poster name:', err);
        setPosterName(schedule.posterId);
      }
    };
    loadPosterName();
  }, [schedule.posterId]);

  const handleDelete = async () => {
    if (!schedule.id || !onDelete || !isOwnPost) return;
    if (!confirm('この予定を削除しますか？')) return;
    setIsDeleting(true);
    try {
      await onDelete(schedule.id);
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.card}>
      <span className={isCompetition ? styles.badgeCompetition : styles.badge}>
        {isCompetition ? 'コンペ' : '募集'}
      </span>
      {isOwnPost && schedule.id && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className={styles.deleteButton}
          aria-label="削除"
        >
          {isDeleting ? '削除中...' : '×'}
        </button>
      )}
      <p className={styles.posterName}>投稿者: {posterName || '読み込み中...'}</p>
      <p className={styles.dateTime}>
        {schedule.dateStr ?? ''} {schedule.startTime ?? ''}
      </p>
      {isCompetition && schedule.competitionName && (
        <p className={styles.competitionName}>{schedule.competitionName}</p>
      )}
      <p className={styles.course}>{schedule.golfCourseName ?? ''}</p>
      <p className={styles.detail}>
        プレーフィー {playFee.toLocaleString()}THB ・ あと{recruitCount}名
      </p>
      {participants.length > 0 && (
        <p className={styles.participants}>
          参加: {participants.join(', ')}
        </p>
      )}
    </div>
  );
}

function WishCard({
  schedule,
  currentUserId,
  onDelete,
}: {
  schedule: ScheduleWish;
  currentUserId?: string | null;
  onDelete?: (scheduleId: string) => Promise<void>;
}) {
  const [posterName, setPosterName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const place =
    schedule.wishCourseName || schedule.wishArea || '未指定';
  const maxPlayFee = Number(schedule.maxPlayFee) || 0;
  const isOwnPost = currentUserId === schedule.posterId;

  useEffect(() => {
    const loadPosterName = async () => {
      try {
        const profile = await getUserProfile(schedule.posterId);
        setPosterName(profile?.displayName || schedule.posterId);
      } catch (err) {
        console.error('Failed to load poster name:', err);
        setPosterName(schedule.posterId);
      }
    };
    loadPosterName();
  }, [schedule.posterId]);

  const handleDelete = async () => {
    if (!schedule.id || !onDelete || !isOwnPost) return;
    if (!confirm('この予定を削除しますか？')) return;
    setIsDeleting(true);
    try {
      await onDelete(schedule.id);
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.card}>
      <span className={styles.badgeWish}>希望</span>
      {isOwnPost && schedule.id && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className={styles.deleteButton}
          aria-label="削除"
        >
          {isDeleting ? '削除中...' : '×'}
        </button>
      )}
      <p className={styles.posterName}>投稿者: {posterName || '読み込み中...'}</p>
      <p className={styles.dateTime}>{schedule.dateStr ?? ''}</p>
      <p className={styles.course}>{place}</p>
      {schedule.wishArea && (
        <p className={styles.area}>希望地域: {schedule.wishArea}</p>
      )}
      <p className={styles.detail}>
        上限プレーフィー {maxPlayFee.toLocaleString()}THB
      </p>
    </div>
  );
}
