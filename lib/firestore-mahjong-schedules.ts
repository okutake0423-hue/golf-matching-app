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
  MahjongScheduleDoc,
  MahjongScheduleRecruit,
  MahjongScheduleWish,
  MahjongScheduleFormData,
} from '@/types/mahjong-schedule';
import { getMahjongMonthKey } from '@/types/mahjong-schedule';

const MAHJONG_SCHEDULES_COLLECTION = 'mahjong_schedules';

function parseDateTime(dateStr: string, startTime: string): Timestamp {
  const [hours, minutes] = startTime.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return Timestamp.fromDate(d);
}

export async function addMahjongSchedule(
  posterId: string,
  form: MahjongScheduleFormData
): Promise<string> {
  const col = collection(db, MAHJONG_SCHEDULES_COLLECTION);
  const monthKey = getMahjongMonthKey(form.dateStr);

  if (form.type === 'RECRUIT') {
    const dateTime = parseDateTime(form.dateStr, form.startTime);
    const payload = {
      type: 'RECRUIT' as const,
      posterId,
      dateStr: form.dateStr,
      startTime: form.startTime,
      dateTime,
      venueName: form.venueName.trim(),
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

  const wishDateStart = Timestamp.fromDate(new Date(form.dateStr + 'T00:00:00'));
  const payload = {
    type: 'WISH' as const,
    posterId,
    dateStr: form.dateStr,
    wishDateStart,
    wishVenueName: (form.wishVenueName ?? '').trim() || null,
    wishArea: (form.wishArea ?? '').trim() || null,
    maxPlayFee: Number(form.maxPlayFee) || 0,
    monthKey,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function getMahjongSchedulesByMonth(monthKey: string): Promise<MahjongScheduleDoc[]> {
  const col = collection(db, MAHJONG_SCHEDULES_COLLECTION);
  const q = query(
    col,
    where('monthKey', '==', monthKey),
    orderBy('dateStr', 'asc'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  const list: MahjongScheduleDoc[] = [];
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
        venueName: data.venueName ?? '',
        playFee: data.playFee ?? 0,
        recruitCount: data.recruitCount ?? 0,
        participants: data.participants ?? [],
        isCompetition: data.isCompetition ?? false,
        competitionName: data.competitionName,
        monthKey: data.monthKey,
        createdAt: data.createdAt,
      } as MahjongScheduleRecruit);
    } else {
      list.push({
        id,
        type: 'WISH',
        posterId: data.posterId,
        dateStr: data.dateStr,
        wishDateStart: data.wishDateStart,
        wishDateEnd: data.wishDateEnd,
        wishVenueName: data.wishVenueName,
        wishArea: data.wishArea,
        maxPlayFee: data.maxPlayFee ?? 0,
        monthKey: data.monthKey,
        createdAt: data.createdAt,
      } as MahjongScheduleWish);
    }
  });
  return list;
}

export async function getMahjongScheduleById(scheduleId: string): Promise<MahjongScheduleDoc | null> {
  const ref = doc(db, MAHJONG_SCHEDULES_COLLECTION, scheduleId);
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
      venueName: data.venueName ?? '',
      playFee: data.playFee ?? 0,
      recruitCount: data.recruitCount ?? 0,
      participants: data.participants ?? [],
      isCompetition: data.isCompetition ?? false,
      competitionName: data.competitionName,
      monthKey: data.monthKey,
      createdAt: data.createdAt,
    } as MahjongScheduleRecruit;
  }
  if (data.type === 'WISH') {
    return {
      id,
      type: 'WISH',
      posterId: data.posterId,
      dateStr: data.dateStr,
      wishDateStart: data.wishDateStart,
      wishDateEnd: data.wishDateEnd,
      wishVenueName: data.wishVenueName,
      wishArea: data.wishArea,
      maxPlayFee: data.maxPlayFee ?? 0,
      monthKey: data.monthKey,
      createdAt: data.createdAt,
    } as MahjongScheduleWish;
  }
  return null;
}

export async function updateMahjongSchedule(
  scheduleId: string,
  updates: {
    dateStr: string;
    startTime: string;
    venueName: string;
    playFee: number;
    recruitCount: number;
    participants: string[];
    isCompetition?: boolean;
    competitionName?: string | null;
  }
): Promise<void> {
  const ref = doc(db, MAHJONG_SCHEDULES_COLLECTION, scheduleId);
  const monthKey = updates.dateStr.slice(0, 7);
  const dateTime = parseDateTime(updates.dateStr, updates.startTime);
  await updateDoc(ref, {
    dateStr: updates.dateStr,
    startTime: updates.startTime,
    dateTime,
    venueName: updates.venueName.trim(),
    playFee: updates.playFee,
    recruitCount: updates.recruitCount,
    participants: updates.participants,
    isCompetition: updates.isCompetition ?? false,
    competitionName: updates.competitionName?.trim() || null,
    monthKey,
  });
}

export async function deleteMahjongSchedule(scheduleId: string): Promise<void> {
  const ref = doc(db, MAHJONG_SCHEDULES_COLLECTION, scheduleId);
  await deleteDoc(ref);
}

export async function joinMahjongSchedule(
  scheduleId: string,
  participantDisplayName: string,
  participantUserId?: string
): Promise<{ success: boolean; remainingCount: number }> {
  const ref = doc(db, MAHJONG_SCHEDULES_COLLECTION, scheduleId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('予定が見つかりません');
  const data = snap.data();
  if (data.type !== 'RECRUIT') throw new Error('募集タイプの予定のみ参加できます');

  const currentParticipants = data.participants ?? [];
  const currentRecruitCount = Number(data.recruitCount) || 0;
  const isAlreadyJoined = currentParticipants.some((p: string) => {
    const parts = p.split(':');
    if (parts.length === 2) {
      return parts[0] === participantUserId || parts[1] === participantDisplayName;
    }
    return p === participantDisplayName;
  });
  if (isAlreadyJoined) throw new Error('既に参加しています');
  if (currentRecruitCount <= 0) throw new Error('募集人数に達しています');

  const participantEntry = participantUserId
    ? `${participantUserId}:${participantDisplayName}`
    : participantDisplayName;
  const newParticipants = [...currentParticipants, participantEntry];
  const newRecruitCount = currentRecruitCount - 1;

  await updateDoc(ref, {
    participants: newParticipants,
    recruitCount: newRecruitCount,
  });
  return { success: true, remainingCount: newRecruitCount };
}
