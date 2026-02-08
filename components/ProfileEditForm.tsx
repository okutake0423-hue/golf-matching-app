'use client';

import { useState, useCallback } from 'react';
import { PLAY_STYLE_OPTIONS, type UserProfileFormData } from '@/types/profile';
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
        });
        if (onCancel) onCancel();
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存に失敗しました');
      } finally {
        setSaving(false);
      }
    },
    [companyName, averageScore, playStyle, onSave, onCancel]
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>プロフィール編集</h2>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label htmlFor="companyName" className={styles.label}>
          会社名
        </label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className={styles.input}
          placeholder="例: 株式会社〇〇"
        />
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
