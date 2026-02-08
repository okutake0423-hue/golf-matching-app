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

  const hasCustomInfo =
    (profile.companyName && profile.companyName.trim() !== '') ||
    profile.averageScore != null ||
    (profile.playStyle && profile.playStyle.trim() !== '');

  return (
    <div className={styles.profile}>
      <h2 className={styles.profileTitle}>プロフィール</h2>

      {/* LINEの基本情報 */}
      <section className={styles.section} aria-label="LINEの情報">
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
        </div>
      </section>

      {/* アプリで設定した項目（会社名・平均スコア・プレイスタイル） */}
      <section className={styles.section} aria-label="ゴルフプロフィール">
        <h3 className={styles.sectionTitle}>ゴルフプロフィール</h3>
        <div className={styles.profileInfo}>
          <p className={styles.profileItem}>
            <strong>会社名:</strong>{' '}
            {profile.companyName?.trim() ? profile.companyName : '—'}
          </p>
          <p className={styles.profileItem}>
            <strong>平均スコア:</strong>{' '}
            {profile.averageScore != null ? profile.averageScore : '—'}
          </p>
          <p className={styles.profileItem}>
            <strong>プレイスタイル:</strong> {playStyleLabel}
          </p>
          {!hasCustomInfo && onEdit && (
            <p className={styles.hint}>
              下の「編集」ボタンから会社名・平均スコア・プレイスタイルを設定できます。
            </p>
          )}
        </div>
      </section>

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
