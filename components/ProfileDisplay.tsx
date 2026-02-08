'use client';

import type { UserProfileDisplay } from '@/types/profile';
import { PLAY_STYLE_OPTIONS } from '@/types/profile';
import styles from './ProfileDisplay.module.css';

type Props = {
  profile: UserProfileDisplay;
  onEdit?: () => void;
  onLogout?: () => void;
};

export function ProfileDisplay({ profile, onEdit, onLogout }: Props) {
  const playStyleLabel =
    PLAY_STYLE_OPTIONS.find((o) => o.value === profile.playStyle)?.label ??
    profile.playStyle ||
    '—';

  return (
    <div className={styles.profile}>
      <h2 className={styles.profileTitle}>プロフィール</h2>
      {profile.pictureUrl && (
        <img
          src={profile.pictureUrl}
          alt={profile.displayName}
          className={styles.profileImage}
        />
      )}
      <div className={styles.profileInfo}>
        <p className={styles.profileItem}>
          <strong>表示名:</strong> {profile.displayName}
        </p>
        <p className={styles.profileItem}>
          <strong>ユーザーID:</strong> {profile.userId}
        </p>
        {profile.statusMessage && (
          <p className={styles.profileItem}>
            <strong>ステータスメッセージ:</strong> {profile.statusMessage}
          </p>
        )}
        <p className={styles.profileItem}>
          <strong>会社名:</strong> {profile.companyName || '—'}
        </p>
        <p className={styles.profileItem}>
          <strong>平均スコア:</strong>{' '}
          {profile.averageScore != null ? profile.averageScore : '—'}
        </p>
        <p className={styles.profileItem}>
          <strong>プレイスタイル:</strong> {playStyleLabel}
        </p>
      </div>
      <div className={styles.actions}>
        {onEdit && (
          <button type="button" onClick={onEdit} className={styles.buttonEdit}>
            編集
          </button>
        )}
        {onLogout && (
          <button type="button" onClick={onLogout} className={styles.button}>
            ログアウト
          </button>
        )}
      </div>
    </div>
  );
}
