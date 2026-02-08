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

function toMonthStart(monthKey: string): Date {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

export function ScheduleCalendar({
  value,
  onChange,
  schedules,
  activeMonthKey,
  onActiveMonthChange,
}: Props) {
  const dateStrSet = useCallback(() => {
    const set = new Set<string>();
    schedules.forEach((s) => set.add(s.dateStr));
    return set;
  }, [schedules])();

  const tileContent = useCallback(
    ({ date }: { date: Date }) => {
      const str = toDateStr(date);
      if (!dateStrSet.has(str)) return null;
      return <span className={styles.dot} aria-hidden />;
    },
    [dateStrSet]
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
    ? toMonthStart(activeMonthKey)
    : undefined;

  const handleActiveStartDateChange = useCallback(
    (args: { activeStartDate: Date }) => {
      if (!onActiveMonthChange) return;
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
          ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
        }
        tileContent={tileContent}
        className={styles.calendar}
      />
    </div>
  );
}
