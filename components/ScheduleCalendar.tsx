'use client';

import { useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { ScheduleDoc } from '@/types/schedule';
import styles from './ScheduleCalendar.module.css';

type Value = Date | null;

type Props = {
  value: Value;
  onChange: (date: Date | null) => void;
  schedules: ScheduleDoc[];
  /** 表示する月（YYYY-MM）。指定しない場合は value や今日の月 */
  activeMonthKey?: string;
  onActiveMonthChange?: (monthKey: string) => void;
};

/** 日付を YYYY-MM-DD に */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toMonthStart(monthKey: string): Date | undefined {
  if (!monthKey || typeof monthKey !== 'string') return undefined;
  const parts = monthKey.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) return undefined;
  return new Date(y, m - 1, 1);
}

export function ScheduleCalendar({
  value,
  onChange,
  schedules,
  activeMonthKey,
  onActiveMonthChange,
}: Props) {
  const dateStrMap = useCallback(() => {
    const map = new Map<string, { hasRecruit: boolean; hasWish: boolean }>();
    const list = Array.isArray(schedules) ? schedules : [];
    list.forEach((s) => {
      if (s?.dateStr) {
        const current = map.get(s.dateStr) || { hasRecruit: false, hasWish: false };
        if (s.type === 'RECRUIT') {
          current.hasRecruit = true;
        } else if (s.type === 'WISH') {
          current.hasWish = true;
        }
        map.set(s.dateStr, current);
      }
    });
    return map;
  }, [schedules])();

  const tileContent = useCallback(
    ({ date }: { date: Date }) => {
      const str = toDateStr(date);
      const info = dateStrMap.get(str);
      if (!info) return null;
      
      // 希望と募集の両方がある場合は希望を優先（青色）
      if (info.hasWish) {
        return <span className={styles.dotWish} aria-hidden />;
      }
      if (info.hasRecruit) {
        return <span className={styles.dot} aria-hidden />;
      }
      return null;
    },
    [dateStrMap]
  );

  const handleChange = useCallback(
    (v: Value | [Value, Value]) => {
      if (v === null) {
        onChange(null);
        return;
      }
      if (Array.isArray(v)) {
        onChange(v[0]);
        return;
      }
      onChange(v);
    },
    [onChange]
  );

  const activeStartDate = activeMonthKey
    ? toMonthStart(activeMonthKey) ?? undefined
    : undefined;

  const handleActiveStartDateChange = useCallback(
    (args: { activeStartDate: Date | null }) => {
      if (!onActiveMonthChange || args.activeStartDate == null) return;
      const d = args.activeStartDate;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      onActiveMonthChange(`${y}-${m}`);
    },
    [onActiveMonthChange]
  );

  return (
    <div className={styles.wrapper}>
      <Calendar
        value={value}
        onChange={handleChange}
        activeStartDate={activeStartDate}
        onActiveStartDateChange={handleActiveStartDateChange}
        formatShortWeekday={(_, date) =>
          ['日', '月', '火', '水', '木', '金', '土'][
            date && typeof date.getDay === 'function' ? date.getDay() : 0
          ]
        }
        tileContent={tileContent}
        className={styles.calendar}
      />
    </div>
  );
}
