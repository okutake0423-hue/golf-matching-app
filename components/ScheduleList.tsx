'use client';

import type { ScheduleDoc, ScheduleRecruit, ScheduleWish } from '@/types/schedule';
import styles from './ScheduleList.module.css';

type Props = {
  schedules: ScheduleDoc[];
  dateLabel?: string;
};

export function ScheduleList({ schedules, dateLabel }: Props) {
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
            <RecruitCard schedule={s as ScheduleRecruit} />
          ) : (
            <WishCard schedule={s as ScheduleWish} />
          )}
        </li>
      ))}
    </ul>
  );
}

function RecruitCard({ schedule }: { schedule: ScheduleRecruit }) {
  const participants = schedule.participants ?? [];
  const playFee = Number(schedule.playFee) || 0;
  const recruitCount = Number(schedule.recruitCount) || 0;
  return (
    <div className={styles.card}>
      <span className={styles.badge}>募集</span>
      <p className={styles.dateTime}>
        {schedule.dateStr ?? ''} {schedule.startTime ?? ''}
      </p>
      <p className={styles.course}>{schedule.golfCourseName ?? ''}</p>
      <p className={styles.detail}>
        プレーフィー {playFee.toLocaleString()}円 ・ あと{recruitCount}名
      </p>
      {participants.length > 0 && (
        <p className={styles.participants}>
          参加: {participants.join(', ')}
        </p>
      )}
    </div>
  );
}

function WishCard({ schedule }: { schedule: ScheduleWish }) {
  const place =
    schedule.wishCourseName || schedule.wishArea || '未指定';
  const maxPlayFee = Number(schedule.maxPlayFee) || 0;
  return (
    <div className={styles.card}>
      <span className={styles.badgeWish}>希望</span>
      <p className={styles.dateTime}>{schedule.dateStr ?? ''}</p>
      <p className={styles.course}>{place}</p>
      <p className={styles.detail}>
        上限プレーフィー {maxPlayFee.toLocaleString()}円
      </p>
    </div>
  );
}
