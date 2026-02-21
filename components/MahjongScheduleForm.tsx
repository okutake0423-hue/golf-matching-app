'use client';

import { useState, useCallback } from 'react';
import type { MahjongScheduleFormData, MahjongScheduleRecruitForm, MahjongScheduleWishForm } from '@/types/mahjong-schedule';
import styles from './ScheduleForm.module.css';

type Props = {
  posterId: string;
  defaultDateStr?: string;
  onSubmit: (form: MahjongScheduleFormData) => Promise<void>;
};

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export function MahjongScheduleForm({ posterId, defaultDateStr, onSubmit }: Props) {
  const [mode, setMode] = useState<'RECRUIT' | 'WISH'>('RECRUIT');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(defaultDateStr ?? todayStr());
  const [startTime, setStartTime] = useState('08:00');
  const [venueName, setVenueName] = useState('');
  const [playFee, setPlayFee] = useState('');
  const [recruitCount, setRecruitCount] = useState('2');
  const [participants, setParticipants] = useState<string[]>([]);
  const [wishVenueName, setWishVenueName] = useState('');
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
          const form: MahjongScheduleRecruitForm = {
            type: 'RECRUIT',
            dateStr,
            startTime,
            venueName,
            playFee: Number(playFee) || 0,
            recruitCount: Number(recruitCount) || 0,
            participants,
            isCompetition: isCompetition || undefined,
            competitionName: isCompetition ? competitionName : undefined,
          };
          await onSubmit(form);
        } else {
          const form: MahjongScheduleWishForm = {
            type: 'WISH',
            dateStr,
            wishVenueName,
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
    [mode, dateStr, startTime, venueName, playFee, recruitCount, participants, isCompetition, competitionName, wishVenueName, wishArea, maxPlayFee, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.modeSwitch}>
        <button type="button" className={mode === 'RECRUIT' ? styles.modeActive : ''} onClick={() => setMode('RECRUIT')}>
          募集する
        </button>
        <button type="button" className={mode === 'WISH' ? styles.modeActive : ''} onClick={() => setMode('WISH')}>
          希望を出す
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label>日付</label>
        <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} required />
      </div>
      {mode === 'RECRUIT' && (
        <>
          <div className={styles.field}>
            <label>開始時間</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>場所</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="例: ○○麻雀荘"
              required
            />
          </div>
          <div className={styles.field}>
            <label>参加費（THB）</label>
            <input type="number" min={0} value={playFee} onChange={(e) => setPlayFee(e.target.value)} placeholder="例: 500" />
          </div>
          <div className={styles.field}>
            <label>募集人数（あと○名）</label>
            <input type="number" min={1} value={recruitCount} onChange={(e) => setRecruitCount(e.target.value)} placeholder="例: 2" />
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
            {participants.length > 0 && <p className={styles.hint}>{participants.join(', ')}</p>}
          </div>
          <div className={styles.field}>
            <label>
              <input
                type="checkbox"
                checked={isCompetition}
                onChange={(e) => {
                  setIsCompetition(e.target.checked);
                  if (!e.target.checked) setCompetitionName('');
                }}
              />
              大会
            </label>
          </div>
          {isCompetition && (
            <div className={styles.field}>
              <label>大会名</label>
              <input type="text" value={competitionName} onChange={(e) => setCompetitionName(e.target.value)} placeholder="例: 社内麻雀大会" />
            </div>
          )}
        </>
      )}
      {mode === 'WISH' && (
        <>
          <div className={styles.field}>
            <label>希望場所</label>
            <input type="text" value={wishVenueName} onChange={(e) => setWishVenueName(e.target.value)} placeholder="任意" />
          </div>
          <div className={styles.field}>
            <label>希望地域</label>
            <input type="text" value={wishArea} onChange={(e) => setWishArea(e.target.value)} placeholder="例: バンコク近郊" />
          </div>
          <div className={styles.field}>
            <label>上限参加費（THB）</label>
            <input type="number" min={0} value={maxPlayFee} onChange={(e) => setMaxPlayFee(e.target.value)} placeholder="例: 500" />
          </div>
        </>
      )}
      <button type="submit" disabled={saving} className={styles.submit}>
        {saving ? '投稿中...' : '投稿する'}
      </button>
    </form>
  );
}
