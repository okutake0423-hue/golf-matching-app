'use client';

import { useState, useCallback } from 'react';
import { PROFILE_CHECKBOX_OPTIONS, type ProfileCheckboxValue } from '@/types/profile';
import styles from './NotifyModal.module.css';

type Props = {
  scheduleInfo: {
    dateStr: string;
    startTime?: string;
    golfCourseName: string;
    isCompetition?: boolean;
    competitionName?: string;
  };
  onSend: (selectedCheckboxes: ProfileCheckboxValue[]) => Promise<void>;
  onClose: () => void;
};

export function NotifyModal({ scheduleInfo, onSend, onClose }: Props) {
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<ProfileCheckboxValue[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckboxChange = useCallback((value: ProfileCheckboxValue, checked: boolean) => {
    if (checked) {
      setSelectedCheckboxes((prev) => [...prev, value]);
    } else {
      setSelectedCheckboxes((prev) => prev.filter((v) => v !== value));
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (selectedCheckboxes.length === 0) {
      setError('少なくとも1つの項目を選択してください');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      await onSend(selectedCheckboxes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知の送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  }, [selectedCheckboxes, onSend, onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>通知を送信</h2>
        <div className={styles.scheduleInfo}>
          <p><strong>日付:</strong> {scheduleInfo.dateStr}</p>
          {scheduleInfo.startTime && (
            <p><strong>時間:</strong> {scheduleInfo.startTime}</p>
          )}
          <p><strong>コース:</strong> {scheduleInfo.golfCourseName}</p>
          {scheduleInfo.isCompetition && scheduleInfo.competitionName && (
            <p><strong>コンペ名:</strong> {scheduleInfo.competitionName}</p>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>通知を送る対象（通知受取りグループ）</label>
          <div className={styles.checkboxGroup}>
            {PROFILE_CHECKBOX_OPTIONS.map((option) => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedCheckboxes.includes(option.value)}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  className={styles.checkbox}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || selectedCheckboxes.length === 0}
            className={styles.buttonSend}
          >
            {isSending ? '送信中...' : '通知を送信'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className={styles.buttonCancel}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
