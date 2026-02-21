'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { MahjongScheduleDoc, MahjongScheduleRecruit, MahjongScheduleWish } from '@/types/mahjong-schedule';
import { getUserProfile } from '@/lib/firestore';
import { MahjongGuideModal } from '@/components/MahjongGuideModal';
import styles from './ScheduleList.module.css';

type Props = {
  schedules: MahjongScheduleDoc[];
  dateLabel?: string;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onDelete?: (scheduleId: string) => Promise<void>;
  onJoin?: (scheduleId: string) => Promise<void>;
};

function ParticipantLink({ name }: { name: string }) {
  const parts = name.split(':');
  const userId = parts.length === 2 ? parts[0] : null;
  const displayName = parts.length === 2 ? parts[1] : name;
  if (userId) {
    return <Link href={`/profile/${userId}`} className={styles.profileLink}>{displayName}</Link>;
  }
  return <span>{displayName}</span>;
}

function RecruitCard({
  schedule,
  currentUserId,
  currentUserName,
  onDelete,
  onJoin,
}: {
  schedule: MahjongScheduleRecruit;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onDelete?: (scheduleId: string) => Promise<void>;
  onJoin?: (scheduleId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [posterName, setPosterName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const participants = schedule.participants ?? [];
  const playFee = Number(schedule.playFee) || 0;
  const recruitCount = Number(schedule.recruitCount) || 0;
  const isOwnPost = currentUserId === schedule.posterId;
  const isCompetition = schedule.isCompetition ?? false;
  const userIdentifier = currentUserName || currentUserId || '';
  const isAlreadyJoined = participants.some(p => {
    const parts = p.split(':');
    if (parts.length === 2) return parts[0] === currentUserId || parts[1] === userIdentifier;
    return p === userIdentifier;
  });
  const canJoin = !isOwnPost && currentUserId && recruitCount > 0 && !isAlreadyJoined;

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getUserProfile(schedule.posterId);
        setPosterName(profile?.displayName || schedule.posterId);
      } catch {
        setPosterName(schedule.posterId);
      }
    };
    load();
  }, [schedule.posterId]);

  const handleDelete = async () => {
    if (!schedule.id || !onDelete || !isOwnPost) return;
    if (!confirm('この予定を削除しますか？')) return;
    setIsDeleting(true);
    try {
      await onDelete(schedule.id);
    } catch {
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJoin = async () => {
    if (!schedule.id || !onJoin || !canJoin) return;
    if (!confirm('この予定に参加しますか？')) return;
    setIsJoining(true);
    try {
      await onJoin(schedule.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '参加に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.card}>
      {showGuideModal && <MahjongGuideModal schedule={schedule} onClose={() => setShowGuideModal(false)} />}
      <span className={isCompetition ? styles.badgeCompetition : styles.badge}>
        {isCompetition ? '大会' : '募集'}
      </span>
      {isOwnPost && schedule.id && (
        <>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className={styles.deleteButton} aria-label="削除">
            {isDeleting ? '削除中...' : '×'}
          </button>
          <button type="button" onClick={() => router.push(`/mahjong/${schedule.id}/notify`)} className={styles.notifyButton} aria-label="通知">
            通知
          </button>
          <button type="button" onClick={() => setShowGuideModal(true)} className={styles.guideButton} aria-label="案内">
            案内
          </button>
          <button type="button" onClick={() => router.push(`/mahjong/${schedule.id}/edit`)} className={styles.editButton} aria-label="修正">
            修正
          </button>
        </>
      )}
      <p className={styles.posterName}>
        投稿者: <Link href={`/profile/${schedule.posterId}`} className={styles.profileLink}>{posterName || '読み込み中...'}</Link>
      </p>
      <p className={styles.dateTime}>{schedule.dateStr ?? ''} {schedule.startTime ?? ''}</p>
      {isCompetition && schedule.competitionName && <p className={styles.competitionName}>{schedule.competitionName}</p>}
      <p className={styles.course}>{schedule.venueName ?? ''}</p>
      <p className={styles.detail}>参加費 {playFee.toLocaleString()}THB ・ あと{recruitCount}名</p>
      {participants.length > 0 && (
        <p className={styles.participants}>
          参加: {participants.map((p, i) => (
            <span key={i}><ParticipantLink name={p} />{i < participants.length - 1 && ', '}</span>
          ))}
        </p>
      )}
      {canJoin && (
        <button type="button" onClick={handleJoin} disabled={isJoining} className={styles.joinButton}>
          {isJoining ? '参加中...' : '参加'}
        </button>
      )}
    </div>
  );
}

function WishCard({
  schedule,
  currentUserId,
  onDelete,
}: {
  schedule: MahjongScheduleWish;
  currentUserId?: string | null;
  onDelete?: (scheduleId: string) => Promise<void>;
}) {
  const [posterName, setPosterName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const place = schedule.wishVenueName || schedule.wishArea || '未指定';
  const maxPlayFee = Number(schedule.maxPlayFee) || 0;
  const isOwnPost = currentUserId === schedule.posterId;

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getUserProfile(schedule.posterId);
        setPosterName(profile?.displayName || schedule.posterId);
      } catch {
        setPosterName(schedule.posterId);
      }
    };
    load();
  }, [schedule.posterId]);

  const handleDelete = async () => {
    if (!schedule.id || !onDelete || !isOwnPost) return;
    if (!confirm('この予定を削除しますか？')) return;
    setIsDeleting(true);
    try {
      await onDelete(schedule.id);
    } catch {
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.card}>
      <span className={styles.badgeWish}>希望</span>
      {isOwnPost && schedule.id && (
        <button type="button" onClick={handleDelete} disabled={isDeleting} className={styles.deleteButton} aria-label="削除">
          {isDeleting ? '削除中...' : '×'}
        </button>
      )}
      <p className={styles.posterName}>
        投稿者: <Link href={`/profile/${schedule.posterId}`} className={styles.profileLink}>{posterName || '読み込み中...'}</Link>
      </p>
      <p className={styles.dateTime}>{schedule.dateStr ?? ''}</p>
      <p className={styles.course}>{place}</p>
      {schedule.wishArea && <p className={styles.area}>希望地域: {schedule.wishArea}</p>}
      <p className={styles.detail}>上限参加費 {maxPlayFee.toLocaleString()}THB</p>
    </div>
  );
}

export function MahjongScheduleList({ schedules, dateLabel, currentUserId, currentUserName, onDelete, onJoin }: Props) {
  if (schedules.length === 0) {
    return <div className={styles.empty}>{dateLabel ? `${dateLabel}の予定はありません` : '予定はありません'}</div>;
  }
  return (
    <ul className={styles.list}>
      {schedules.map((s, index) => (
        <li key={s.id ?? `mahjong-${index}`} className={styles.item}>
          {s.type === 'RECRUIT' ? (
            <RecruitCard schedule={s as MahjongScheduleRecruit} currentUserId={currentUserId} currentUserName={currentUserName} onDelete={onDelete} onJoin={onJoin} />
          ) : (
            <WishCard schedule={s as MahjongScheduleWish} currentUserId={currentUserId} onDelete={onDelete} />
          )}
        </li>
      ))}
    </ul>
  );
}
