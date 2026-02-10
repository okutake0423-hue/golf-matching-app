'use client';

import { useState, useCallback } from 'react';
import type { ScheduleFormData, ScheduleRecruitForm, ScheduleWishForm } from '@/types/schedule';
import styles from './ScheduleForm.module.css';

type Props = {
  posterId: string;
  defaultDateStr?: string;
  onSubmit: (form: ScheduleFormData) => Promise<void>;
};

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export function ScheduleForm({ posterId, defaultDateStr, onSubmit }: Props) {
  const [mode, setMode] = useState<'RECRUIT' | 'WISH'>('RECRUIT');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateStr, setDateStr] = useState(defaultDateStr ?? todayStr());
  const [startTime, setStartTime] = useState('08:00');
  const [golfCourseName, setGolfCourseName] = useState('');
  const [playFee, setPlayFee] = useState('');
  const [recruitCount, setRecruitCount] = useState('2');
  const [participants, setParticipants] = useState<string[]>([]);

  const [wishCourseName, setWishCourseName] = useState('');
  const [wishArea, setWishArea] = useState('');
  const [maxPlayFee, setMaxPlayFee] = useState('');
  const [isCompetition, setIsCompetition] = useState(false);
  const [competitionName, setCompetitionName] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaving(true);
      try {
        if (mode === 'RECRUIT') {
          const form: ScheduleRecruitForm = {
            type: 'RECRUIT',
            dateStr,
            startTime,
            golfCourseName,
            playFee: Number(playFee) || 0,
            recruitCount: Number(recruitCount) || 0,
            participants,
            isCompetition: isCompetition || undefined,
            competitionName: isCompetition ? competitionName : undefined,
          };
          await onSubmit(form);
        } else {
          const form: ScheduleWishForm = {
            type: 'WISH',
            dateStr,
            wishCourseName,
            wishArea,
            maxPlayFee: Number(maxPlayFee) || 0,
          };
          await onSubmit(form);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存に失敗しました');
      } finally {
        setSaving(false);
      }
    },
    [
      mode,
      dateStr,
      startTime,
      golfCourseName,
      playFee,
      recruitCount,
      participants,
      isCompetition,
      competitionName,
      wishCourseName,
      wishArea,
      maxPlayFee,
      onSubmit,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.modeSwitch}>
        <button
          type="button"
          className={mode === 'RECRUIT' ? styles.modeActive : ''}
          onClick={() => setMode('RECRUIT')}
        >
          募集する
        </button>
        <button
          type="button"
          className={mode === 'WISH' ? styles.modeActive : ''}
          onClick={() => setMode('WISH')}
        >
          希望を出す
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label>日付</label>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          required
        />
      </div>

      {mode === 'RECRUIT' && (
        <>
          <div className={styles.field}>
            <label>開始時間</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>ゴルフコース名</label>
            <input
              type="text"
              value={golfCourseName}
              onChange={(e) => setGolfCourseName(e.target.value)}
              placeholder="例: ○○カントリークラブ"
              required
            />
          </div>
          <div className={styles.field}>
            <label>プレーフィー（THB）</label>
            <input
              type="number"
              min={0}
              value={playFee}
              onChange={(e) => setPlayFee(e.target.value)}
              placeholder="例: 2000-3000"
            />
          </div>
          <div className={styles.field}>
            <label>募集人数（あと○名）</label>
            <input
              type="number"
              min={1}
              value={recruitCount}
              onChange={(e) => setRecruitCount(e.target.value)}
              placeholder="例: 2"
            />
          </div>
          <div className={styles.field}>
            <label>参加確定者（カンマ区切りで追加）</label>
            <input
              type="text"
              placeholder="名前やIDをカンマ区切り"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (!v) return;
                setParticipants(v.split(/[,，]/).map((s) => s.trim()).filter(Boolean));
                e.target.value = '';
              }}
            />
            {participants.length > 0 && (
              <p className={styles.hint}>{participants.join(', ')}</p>
            )}
          </div>
          <div className={styles.field}>
            <label>
              <input
                type="checkbox"
                checked={isCompetition}
                onChange={(e) => {
                  setIsCompetition(e.target.checked);
                  if (!e.target.checked) {
                    setCompetitionName('');
                  }
                }}
              />
              コンペ
            </label>
          </div>
          {isCompetition && (
            <div className={styles.field}>
              <label>コンペ名</label>
              <input
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="例: 社内ゴルフコンペ"
              />
            </div>
          )}
        </>
      )}

      {mode === 'WISH' && (
        <>
          <div className={styles.field}>
            <label>希望コース名</label>
            <input
              type="text"
              value={wishCourseName}
              onChange={(e) => setWishCourseName(e.target.value)}
              placeholder="任意"
            />
          </div>
          <div className={styles.field}>
            <label>希望地域</label>
            <input
              type="text"
              value={wishArea}
              onChange={(e) => setWishArea(e.target.value)}
              placeholder="例: バンコク近郊"
            />
          </div>
          <div className={styles.field}>
            <label>上限プレーフィー（THB）</label>
            <input
              type="number"
              min={0}
              value={maxPlayFee}
              onChange={(e) => setMaxPlayFee(e.target.value)}
              placeholder="例: 2000-3000"
            />
          </div>
        </>
      )}

      <button type="submit" disabled={saving} className={styles.submit}>
        {saving ? '投稿中...' : '投稿する'}
      </button>
    </form>
  );
}
