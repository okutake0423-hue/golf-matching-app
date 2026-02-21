'use client';

import type { UserProfileDisplay } from '@/types/profile';
import { PLAY_STYLE_OPTIONS, PROFILE_CHECKBOX_OPTIONS, MAHJONG_LEVEL_OPTIONS } from '@/types/profile';
import styles from './ProfileDisplay.module.css';

type Props = {
  profile: UserProfileDisplay;
  onEdit?: () => void;
  onLogout?: () => void;
  onSchedules?: () => void;
  onMahjongSchedules?: () => void;
};

export function ProfileDisplay({ profile, onEdit, onLogout, onSchedules, onMahjongSchedules }: Props) {
  const playStyleLabel =
    (PLAY_STYLE_OPTIONS.find((o) => o.value === profile.playStyle)?.label ??
      profile.playStyle) ||
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
            <strong>Line ID:</strong> {profile.userId?.trim() || '未登録'}
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
          {profile.profileCheckboxes && profile.profileCheckboxes.length > 0 && (
            <div className={styles.profileItem}>
              <strong>通知受取りグループ:</strong>
              <div className={styles.checkboxDisplay}>
                {profile.profileCheckboxes.map((value) => {
                  const option = PROFILE_CHECKBOX_OPTIONS.find((opt) => opt.value === value);
                  return option ? (
                    <span key={value} className={styles.checkboxBadge}>
                      {option.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {!hasCustomInfo && onEdit && (
            <p className={styles.hint}>
              下の「編集」ボタンから会社名・平均スコア・プレイスタイルを設定できます。
            </p>
          )}
        </div>
      </section>

      {/* 麻雀プロフィール */}
      <section className={styles.section} aria-label="麻雀プロフィール">
        <h3 className={styles.sectionTitle}>麻雀プロフィール</h3>
        <div className={styles.profileInfo}>
          <p className={styles.profileItem}>
            <strong>麻雀レベル:</strong>{' '}
            {MAHJONG_LEVEL_OPTIONS.find((o) => o.value === profile.mahjongLevel)?.label ?? profile.mahjongLevel ?? '—'}
          </p>
          <p className={styles.profileItem}>
            <strong>好きな役:</strong>{' '}
            {profile.favoriteYaku?.trim() ? profile.favoriteYaku : '—'}
          </p>
          <p className={styles.profileItem}>
            <strong>募集通知受取り:</strong>{' '}
            {profile.mahjongRecruitNotify ? '受取る' : '受取らない'}
          </p>
        </div>
      </section>

      <div className={styles.actions}>
        {onSchedules && (
          <button type="button" onClick={onSchedules} className={styles.buttonEdit}>
            ゴルフ予定を見る
          </button>
        )}
        {onMahjongSchedules && (
          <button type="button" onClick={onMahjongSchedules} className={styles.buttonEdit}>
            麻雀予定を見る
          </button>
        )}
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
