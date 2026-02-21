'use client';

import { useState, useCallback } from 'react';
import { COMPANY_OPTIONS, PLAY_STYLE_OPTIONS, PROFILE_CHECKBOX_OPTIONS, MAHJONG_LEVEL_OPTIONS, type UserProfileFormData, type ProfileCheckboxValue } from '@/types/profile';
import styles from './ProfileEditForm.module.css';

type Props = {
  initialData: UserProfileFormData;
  onSave: (data: UserProfileFormData) => Promise<void>;
  onCancel?: () => void;
};

export function ProfileEditForm({ initialData, onSave, onCancel }: Props) {
  const [companyName, setCompanyName] = useState(initialData.companyName ?? '');
  const [averageScore, setAverageScore] = useState<string>(
    initialData.averageScore != null && initialData.averageScore !== 0
      ? String(initialData.averageScore)
      : ''
  );
  const [playStyle, setPlayStyle] = useState(initialData.playStyle ?? '');
  const [profileCheckboxes, setProfileCheckboxes] = useState<ProfileCheckboxValue[]>(
    initialData.profileCheckboxes ?? []
  );
  const [mahjongLevel, setMahjongLevel] = useState(initialData.mahjongLevel ?? '');
  const [favoriteYaku, setFavoriteYaku] = useState(initialData.favoriteYaku ?? '');
  const [mahjongRecruitNotify, setMahjongRecruitNotify] = useState(initialData.mahjongRecruitNotify ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaving(true);
      try {
        await onSave({
          companyName,
          averageScore:
            averageScore === '' ? null : parseInt(averageScore, 10) || null,
          playStyle,
          profileCheckboxes,
          mahjongLevel,
          favoriteYaku: favoriteYaku.trim(),
          mahjongRecruitNotify,
        });
        if (onCancel) onCancel();
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存に失敗しました');
      } finally {
        setSaving(false);
      }
    },
    [companyName, averageScore, playStyle, profileCheckboxes, mahjongLevel, favoriteYaku, mahjongRecruitNotify, onSave, onCancel]
  );

  const handleCheckboxChange = useCallback((value: ProfileCheckboxValue, checked: boolean) => {
    if (checked) {
      setProfileCheckboxes((prev) => [...prev, value]);
    } else {
      setProfileCheckboxes((prev) => prev.filter((v) => v !== value));
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>プロフィール編集</h2>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label htmlFor="companyName" className={styles.label}>
          会社名
        </label>
        <select
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className={styles.select}
        >
          {COMPANY_OPTIONS.map((opt) => (
            <option key={opt.value || 'empty'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="averageScore" className={styles.label}>
          平均スコア
        </label>
        <input
          id="averageScore"
          type="number"
          min={1}
          max={200}
          value={averageScore}
          onChange={(e) => setAverageScore(e.target.value)}
          className={styles.input}
          placeholder="例: 95"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="playStyle" className={styles.label}>
          ゴルフのプレイスタイル
        </label>
        <select
          id="playStyle"
          value={playStyle}
          onChange={(e) => setPlayStyle(e.target.value)}
          className={styles.select}
        >
          {PLAY_STYLE_OPTIONS.map((opt) => (
            <option key={opt.value || 'empty'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>通知受取りグループ</label>
        <div className={styles.checkboxGroup}>
          {PROFILE_CHECKBOX_OPTIONS.map((option) => (
            <label key={option.value} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={profileCheckboxes.includes(option.value)}
                onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                className={styles.checkbox}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <h3 className={styles.subsectionTitle}>麻雀プロフィール</h3>
      <div className={styles.field}>
        <label htmlFor="mahjongLevel" className={styles.label}>
          麻雀レベル
        </label>
        <select
          id="mahjongLevel"
          value={mahjongLevel}
          onChange={(e) => setMahjongLevel(e.target.value)}
          className={styles.select}
        >
          {MAHJONG_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value || 'empty'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="favoriteYaku" className={styles.label}>
          好きな役
        </label>
        <input
          id="favoriteYaku"
          type="text"
          value={favoriteYaku}
          onChange={(e) => setFavoriteYaku(e.target.value)}
          className={styles.input}
          placeholder="例: 七対子、立直"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={mahjongRecruitNotify}
            onChange={(e) => setMahjongRecruitNotify(e.target.checked)}
            className={styles.checkbox}
          />
          麻雀募集通知受取り
        </label>
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          disabled={saving}
          className={styles.buttonSubmit}
        >
          {saving ? '保存中...' : '保存'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={styles.buttonCancel}
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
