'use client';

import { useState, useCallback } from 'react';
import type { ScheduleRecruit } from '@/types/schedule';
import styles from './GuideModal.module.css';

type Props = {
  schedule: ScheduleRecruit;
  onClose: () => void;
  onSent?: () => void;
};

/** 参加者リストからLINEに送信可能なユーザーIDのみを抽出（"userId:displayName" 形式のとき userId を返す） */
function getParticipantUserIds(participants: string[]): string[] {
  const ids: string[] = [];
  for (const p of participants) {
    const parts = p.split(':');
    if (parts.length === 2 && parts[0].trim()) {
      ids.push(parts[0].trim());
    }
  }
  return ids;
}

export function GuideModal({ schedule, onClose, onSent }: Props) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantUserIds = getParticipantUserIds(schedule.participants ?? []);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('案内文を入力してください');
      return;
    }

    if (participantUserIds.length === 0) {
      setError('LINEに送信できる参加者がいません。参加者にユーザーIDが紐づいていない可能性があります。');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const res = await fetch('/api/notify/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantUserIds,
          message: trimmed,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || '送信に失敗しました');
        return;
      }

      if (data.sent) {
        alert(`案内を${data.sentCount}件送信しました。`);
        onSent?.();
        onClose();
      } else {
        setError(data.message || '送信できませんでした');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  }, [message, participantUserIds, onClose, onSent]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>案内を送る</h2>
        <div className={styles.scheduleInfo}>
          <p><strong>日付:</strong> {schedule.dateStr} {schedule.startTime || ''}</p>
          <p><strong>コース:</strong> {schedule.golfCourseName}</p>
          <p><strong>送信先:</strong> 参加者 {participantUserIds.length}名</p>
        </div>
        <div className={styles.field}>
          <label htmlFor="guide-message" className={styles.label}>
            案内文
          </label>
          <textarea
            id="guide-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={styles.textarea}
            placeholder="参加者に送りたい案内を入力してください"
            rows={6}
            disabled={isSending}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className={styles.buttonSend}
          >
            {isSending ? '送信中...' : '案内を送信'}
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
