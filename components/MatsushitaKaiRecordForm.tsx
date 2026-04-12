'use client';

import { useState, useCallback } from 'react';
import {
  emptyMatsushitaParticipantRow,
  type MatsushitaKaiParticipantRow,
  type MatsushitaKaiRecordFormData,
} from '@/types/matsushita-kai';
import styles from './MatsushitaKaiRecordForm.module.css';

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

type Props = {
  onSubmit: (data: MatsushitaKaiRecordFormData) => Promise<void>;
  submitting?: boolean;
};

export function MatsushitaKaiRecordForm({ onSubmit, submitting }: Props) {
  const [competitionName, setCompetitionName] = useState('松下会');
  const [golfCourseName, setGolfCourseName] = useState('');
  const [dateStr, setDateStr] = useState(todayDateStr());
  const [rows, setRows] = useState<MatsushitaKaiParticipantRow[]>(() => [
    emptyMatsushitaParticipantRow(),
    emptyMatsushitaParticipantRow(),
    emptyMatsushitaParticipantRow(),
  ]);
  const [error, setError] = useState<string | null>(null);

  const updateRow = useCallback(
    (index: number, patch: Partial<MatsushitaKaiParticipantRow>) => {
      setRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyMatsushitaParticipantRow()]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!competitionName.trim()) {
        setError('コンペ名を入力してください');
        return;
      }
      if (!golfCourseName.trim()) {
        setError('ゴルフコースを入力してください');
        return;
      }
      if (!dateStr) {
        setError('日付を選択してください');
        return;
      }

      const participants = rows
        .filter((r) => r.displayName.trim() !== '')
        .map((r) => ({
          displayName: r.displayName.trim(),
          group: (r.group ?? '').trim(),
          grossOut: r.grossOut,
          grossIn: r.grossIn,
          handicap: r.handicap,
          netScore: r.netScore,
          rank: r.rank,
        }));

      if (participants.length === 0) {
        setError('参加者を1名以上入力してください（名前）');
        return;
      }

      await onSubmit({
        competitionName: competitionName.trim(),
        golfCourseName: golfCourseName.trim(),
        dateStr,
        participants,
      });
    },
    [competitionName, golfCourseName, dateStr, rows, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>松下会 記録を入力</h2>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label htmlFor="mk-competition" className={styles.label}>
          コンペ名
        </label>
        <input
          id="mk-competition"
          type="text"
          value={competitionName}
          onChange={(e) => setCompetitionName(e.target.value)}
          className={styles.input}
          disabled={submitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="mk-course" className={styles.label}>
          ゴルフコース
        </label>
        <input
          id="mk-course"
          type="text"
          value={golfCourseName}
          onChange={(e) => setGolfCourseName(e.target.value)}
          className={styles.input}
          placeholder="例: ○○ゴルフクラブ"
          disabled={submitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="mk-date" className={styles.label}>
          日付
        </label>
        <input
          id="mk-date"
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className={styles.input}
          disabled={submitting}
        />
      </div>

      <h3 className={styles.sectionTitle}>参加者一覧</h3>
      <p className={styles.hint}>
        名前を入力した行が保存されます。Out・Inは9ホールずつのグロスです。
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>名前</th>
              <th>参加グループ</th>
              <th>Out</th>
              <th>In</th>
              <th>HC</th>
              <th>ネット</th>
              <th>順位</th>
              <th aria-label="行削除" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={row.displayName}
                    onChange={(e) =>
                      updateRow(index, { displayName: e.target.value })
                    }
                    className={styles.cellInput}
                    placeholder="氏名"
                    disabled={submitting}
                    autoComplete="name"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.group}
                    onChange={(e) => updateRow(index, { group: e.target.value })}
                    className={styles.cellInput}
                    placeholder="A組など"
                    disabled={submitting}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={row.grossOut ?? ''}
                    onChange={(e) =>
                      updateRow(index, {
                        grossOut: parseNum(e.target.value),
                      })
                    }
                    className={styles.cellNum}
                    disabled={submitting}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={row.grossIn ?? ''}
                    onChange={(e) =>
                      updateRow(index, {
                        grossIn: parseNum(e.target.value),
                      })
                    }
                    className={styles.cellNum}
                    disabled={submitting}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={row.handicap ?? ''}
                    onChange={(e) =>
                      updateRow(index, {
                        handicap: parseNum(e.target.value),
                      })
                    }
                    className={styles.cellNum}
                    disabled={submitting}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={row.netScore ?? ''}
                    onChange={(e) =>
                      updateRow(index, {
                        netScore: parseNum(e.target.value),
                      })
                    }
                    className={styles.cellNum}
                    disabled={submitting}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={row.rank ?? ''}
                    onChange={(e) =>
                      updateRow(index, {
                        rank: parseNum(e.target.value),
                      })
                    }
                    className={styles.cellNum}
                    disabled={submitting}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.rowRemove}
                    onClick={() => removeRow(index)}
                    disabled={submitting || rows.length <= 1}
                    aria-label="この行を削除"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className={styles.addRow}
        onClick={addRow}
        disabled={submitting}
      >
        行を追加
      </button>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.buttonSubmit}
          disabled={submitting}
        >
          {submitting ? '保存中...' : '記録を保存'}
        </button>
      </div>
    </form>
  );
}
