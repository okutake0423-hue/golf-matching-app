'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ScheduleDoc, ScheduleRecruit, ScheduleWish } from '@/types/schedule';
import { getUserProfile } from '@/lib/firestore';
import { GuideModal } from '@/components/GuideModal';
import styles from './ScheduleList.module.css';

type Props = {
  schedules: ScheduleDoc[];
  dateLabel?: string;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onDelete?: (scheduleId: string) => Promise<void>;
  onJoin?: (scheduleId: string) => Promise<void>;
};

export function ScheduleList({ schedules, dateLabel, currentUserId, currentUserName, onDelete, onJoin }: Props) {
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
              currentUserName={currentUserName}
              onDelete={onDelete}
              onJoin={onJoin}
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

// 参加者名からユーザーIDを取得するコンポーネント
function ParticipantLink({ name }: { name: string }) {
  // 参加者エントリは「userId:displayName」形式または「displayName」形式
  const parts = name.split(':');
  const userId = parts.length === 2 ? parts[0] : null;
  const displayName = parts.length === 2 ? parts[1] : name;

  // ユーザーIDがある場合はリンク、ない場合は通常のテキスト
  if (userId) {
    return (
      <Link href={`/profile/${userId}`} className={styles.profileLink}>
        {displayName}
      </Link>
    );
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
  schedule: ScheduleRecruit;
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
  
  // 参加ボタン表示条件
  // currentUserNameがnullの場合は、currentUserIdを使用して参加判定を行う
  const userIdentifier = currentUserName || currentUserId || '';
  // 参加者リストに既に含まれているかチェック（「userId:displayName」形式または「displayName」形式に対応）
  const isAlreadyJoined = participants.some(p => {
    const parts = p.split(':');
    if (parts.length === 2) {
      // 「userId:displayName」形式の場合、userIdで判定
      return parts[0] === currentUserId || parts[1] === userIdentifier;
    } else {
      // 「displayName」形式の場合、displayNameで判定
      return p === userIdentifier;
    }
  });
  const canJoin = !isOwnPost 
    && currentUserId 
    && recruitCount > 0 
    && !isAlreadyJoined;
  
  // デバッグログ（開発時のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ScheduleList] RecruitCard canJoin check:', {
        scheduleId: schedule.id,
        isOwnPost,
        currentUserId,
        currentUserName,
        userIdentifier,
        recruitCount,
        participants,
        canJoin,
      });
    }
  }, [schedule.id, isOwnPost, currentUserId, currentUserName, userIdentifier, recruitCount, participants, canJoin]);

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

  const handleJoin = async () => {
    if (!schedule.id || !onJoin || !canJoin) return;
    if (!confirm('この予定に参加しますか？')) return;
    setIsJoining(true);
    try {
      await onJoin(schedule.id);
    } catch (err) {
      console.error('Failed to join schedule:', err);
      alert(err instanceof Error ? err.message : '参加に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  const handleNotify = () => {
    if (!schedule.id) return;
    router.push(`/schedules/${schedule.id}/notify`);
  };

  const handleGuide = () => {
    setShowGuideModal(true);
  };

  const handleEdit = () => {
    if (!schedule.id) return;
    router.push(`/schedules/${schedule.id}/edit`);
  };

  return (
    <div className={styles.card}>
      {showGuideModal && (
        <GuideModal
          schedule={schedule}
          onClose={() => setShowGuideModal(false)}
        />
      )}
      <span className={isCompetition ? styles.badgeCompetition : styles.badge}>
        {isCompetition ? 'コンペ' : '募集'}
      </span>
      {isOwnPost && schedule.id && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteButton}
            aria-label="削除"
          >
            {isDeleting ? '削除中...' : '×'}
          </button>
          <button
            type="button"
            onClick={handleNotify}
            className={styles.notifyButton}
            aria-label="通知"
          >
            通知
          </button>
          <button
            type="button"
            onClick={handleGuide}
            className={styles.guideButton}
            aria-label="案内"
          >
            案内
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className={styles.editButton}
            aria-label="修正"
          >
            修正
          </button>
        </>
      )}
      <p className={styles.posterName}>
        投稿者:{' '}
        <Link href={`/profile/${schedule.posterId}`} className={styles.profileLink}>
          {posterName || '読み込み中...'}
        </Link>
      </p>
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
          参加:{' '}
          {participants.map((participantName, index) => (
            <span key={index}>
              <ParticipantLink name={participantName} />
              {index < participants.length - 1 && ', '}
            </span>
          ))}
        </p>
      )}
      {canJoin && (
        <button
          type="button"
          onClick={handleJoin}
          disabled={isJoining}
          className={styles.joinButton}
        >
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
      <p className={styles.posterName}>
        投稿者:{' '}
        <Link href={`/profile/${schedule.posterId}`} className={styles.profileLink}>
          {posterName || '読み込み中...'}
        </Link>
      </p>
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
