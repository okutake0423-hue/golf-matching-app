import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  ScheduleDoc,
  ScheduleRecruit,
  ScheduleWish,
  ScheduleFormData,
} from '@/types/schedule';
import { getMonthKey } from '@/types/schedule';

const SCHEDULES_COLLECTION = 'schedules';

/**
 * 日付文字列（YYYY-MM-DD）と時間（HH:mm）から Firestore Timestamp を生成
 */
function parseDateTime(dateStr: string, startTime: string): Timestamp {
  const [hours, minutes] = startTime.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return Timestamp.fromDate(d);
}

/**
 * 予定を追加（募集・希望どちらも）
 */
export async function addSchedule(
  posterId: string,
  form: ScheduleFormData
): Promise<string> {
  const col = collection(db, SCHEDULES_COLLECTION);
  const monthKey = getMonthKey(form.dateStr);

  if (form.type === 'RECRUIT') {
    const dateTime = parseDateTime(form.dateStr, form.startTime);
    const payload = {
      type: 'RECRUIT' as const,
      posterId,
      dateStr: form.dateStr,
      startTime: form.startTime,
      dateTime,
      golfCourseName: form.golfCourseName.trim(),
      playFee: Number(form.playFee) || 0,
      recruitCount: Number(form.recruitCount) || 0,
      participants: form.participants ?? [],
      monthKey,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(col, payload);
    return ref.id;
  }

  // WISH
  const wishDateStart = Timestamp.fromDate(new Date(form.dateStr + 'T00:00:00'));
  const payload = {
    type: 'WISH' as const,
    posterId,
    dateStr: form.dateStr,
    wishDateStart,
    wishCourseName: (form.wishCourseName ?? '').trim() || null,
    wishArea: (form.wishArea ?? '').trim() || null,
    maxPlayFee: Number(form.maxPlayFee) || 0,
    monthKey,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(col, payload);
  return ref.id;
}

/**
 * 指定月（YYYY-MM）の予定を取得
 */
export async function getSchedulesByMonth(
  monthKey: string
): Promise<ScheduleDoc[]> {
  const col = collection(db, SCHEDULES_COLLECTION);
  const q = query(
    col,
    where('monthKey', '==', monthKey),
    orderBy('dateStr', 'asc'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  const list: ScheduleDoc[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    if (data.type === 'RECRUIT') {
      list.push({
        id,
        type: 'RECRUIT',
        posterId: data.posterId,
        dateStr: data.dateStr,
        startTime: data.startTime,
        dateTime: data.dateTime,
        golfCourseName: data.golfCourseName ?? '',
        playFee: data.playFee ?? 0,
        recruitCount: data.recruitCount ?? 0,
        participants: data.participants ?? [],
        monthKey: data.monthKey,
        createdAt: data.createdAt,
      } as ScheduleRecruit);
    } else {
      list.push({
        id,
        type: 'WISH',
        posterId: data.posterId,
        dateStr: data.dateStr,
        wishDateStart: data.wishDateStart,
        wishDateEnd: data.wishDateEnd,
        wishCourseName: data.wishCourseName,
        wishArea: data.wishArea,
        maxPlayFee: data.maxPlayFee ?? 0,
        monthKey: data.monthKey,
        createdAt: data.createdAt,
      } as ScheduleWish);
    }
  });
  return list;
}

/**
 * 指定日（YYYY-MM-DD）の予定を取得（月取得結果をクライアントで絞り込みも可）
 */
export async function getSchedulesByDate(
  dateStr: string
): Promise<ScheduleDoc[]> {
  const col = collection(db, SCHEDULES_COLLECTION);
  const q = query(
    col,
    where('dateStr', '==', dateStr),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  const list: ScheduleDoc[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    if (data.type === 'RECRUIT') {
      list.push({
        id,
        type: 'RECRUIT',
        posterId: data.posterId,
        dateStr: data.dateStr,
        startTime: data.startTime,
        dateTime: data.dateTime,
        golfCourseName: data.golfCourseName ?? '',
        playFee: data.playFee ?? 0,
        recruitCount: data.recruitCount ?? 0,
        participants: data.participants ?? [],
        monthKey: data.monthKey,
        createdAt: data.createdAt,
      } as ScheduleRecruit);
    } else {
      list.push({
        id,
        type: 'WISH',
        posterId: data.posterId,
        dateStr: data.dateStr,
        wishDateStart: data.wishDateStart,
        wishDateEnd: data.wishDateEnd,
        wishCourseName: data.wishCourseName,
        wishArea: data.wishArea,
        maxPlayFee: data.maxPlayFee ?? 0,
        monthKey: data.monthKey,
        createdAt: data.createdAt,
      } as ScheduleWish);
    }
  });
  return list;
}
