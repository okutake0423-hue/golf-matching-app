import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
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
      isCompetition: form.isCompetition || null,
      competitionName: form.competitionName?.trim() || null,
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
        isCompetition: data.isCompetition ?? false,
        competitionName: data.competitionName,
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
        isCompetition: data.isCompetition ?? false,
        competitionName: data.competitionName,
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
 * 予定を1件取得（ID指定）
 */
export async function getScheduleById(scheduleId: string): Promise<ScheduleDoc | null> {
  const ref = doc(db, SCHEDULES_COLLECTION, scheduleId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const id = snap.id;
  if (data.type === 'RECRUIT') {
    return {
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
      isCompetition: data.isCompetition ?? false,
      competitionName: data.competitionName,
      monthKey: data.monthKey,
      createdAt: data.createdAt,
    } as ScheduleRecruit;
  }
  if (data.type === 'WISH') {
    return {
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
    } as ScheduleWish;
  }
  return null;
}

/**
 * 募集予定を更新
 */
export async function updateSchedule(
  scheduleId: string,
  updates: {
    dateStr: string;
    startTime: string;
    golfCourseName: string;
    playFee: number;
    recruitCount: number;
    participants: string[];
    isCompetition?: boolean;
    competitionName?: string | null;
  }
): Promise<void> {
  const ref = doc(db, SCHEDULES_COLLECTION, scheduleId);
  const monthKey = updates.dateStr.slice(0, 7);
  const dateTime = parseDateTime(updates.dateStr, updates.startTime);
  await updateDoc(ref, {
    dateStr: updates.dateStr,
    startTime: updates.startTime,
    dateTime,
    golfCourseName: updates.golfCourseName.trim(),
    playFee: updates.playFee,
    recruitCount: updates.recruitCount,
    participants: updates.participants,
    isCompetition: updates.isCompetition ?? false,
    competitionName: updates.competitionName?.trim() || null,
    monthKey,
  });
}

/**
 * 予定を削除
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  const ref = doc(db, SCHEDULES_COLLECTION, scheduleId);
  await deleteDoc(ref);
}

/**
 * 募集に参加する（残り人数を減らし、参加者に表示名とユーザーIDを追加）
 */
export async function joinSchedule(
  scheduleId: string,
  participantDisplayName: string,
  participantUserId?: string
): Promise<{ success: boolean; remainingCount: number }> {
  const ref = doc(db, SCHEDULES_COLLECTION, scheduleId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    throw new Error('予定が見つかりません');
  }
  
  const data = snap.data();
  if (data.type !== 'RECRUIT') {
    throw new Error('募集タイプの予定のみ参加できます');
  }
  
  const currentParticipants = data.participants ?? [];
  const currentRecruitCount = Number(data.recruitCount) || 0;
  
  // 既に参加している場合はエラー
  // 「userId:displayName」形式または「displayName」形式に対応
  const isAlreadyJoined = currentParticipants.some((p: string) => {
    const parts = p.split(':');
    if (parts.length === 2) {
      // 「userId:displayName」形式の場合、userIdまたはdisplayNameで判定
      return parts[0] === participantUserId || parts[1] === participantDisplayName;
    } else {
      // 「displayName」形式の場合、displayNameで判定
      return p === participantDisplayName;
    }
  });
  
  if (isAlreadyJoined) {
    throw new Error('既に参加しています');
  }
  
  // 残り人数が0の場合はエラー
  if (currentRecruitCount <= 0) {
    throw new Error('募集人数に達しています');
  }
  
  // 参加者を追加し、残り人数を減らす
  // ユーザーIDがある場合は「userId:displayName」形式で保存、ない場合は表示名のみ
  const participantEntry = participantUserId 
    ? `${participantUserId}:${participantDisplayName}`
    : participantDisplayName;
  const newParticipants = [...currentParticipants, participantEntry];
  const newRecruitCount = currentRecruitCount - 1;
  
  await updateDoc(ref, {
    participants: newParticipants,
    recruitCount: newRecruitCount,
  });
  
  return {
    success: true,
    remainingCount: newRecruitCount,
  };
}
