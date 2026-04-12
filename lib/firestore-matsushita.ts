import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  MatsushitaKaiRecordDoc,
  MatsushitaKaiRecordFormData,
  MatsushitaKaiParticipantRow,
  MatsushitaKaiRecordListItem,
} from '@/types/matsushita-kai';

const MATSUSHITA_KAI_COLLECTION = 'matsushita_kai_records';

function mapParticipant(raw: unknown): MatsushitaKaiParticipantRow {
  const r = raw as Record<string, unknown>;
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  return {
    displayName: String(r.displayName ?? ''),
    group: String(r.group ?? ''),
    grossOut: num(r.grossOut),
    grossIn: num(r.grossIn),
    handicap: num(r.handicap),
    netScore: num(r.netScore),
    rank: num(r.rank),
  };
}

function mapDoc(id: string, data: Record<string, unknown>): MatsushitaKaiRecordDoc {
  const parts = Array.isArray(data.participants)
    ? data.participants.map(mapParticipant)
    : [];
  return {
    id,
    competitionName: String(data.competitionName ?? ''),
    golfCourseName: String(data.golfCourseName ?? ''),
    dateStr: String(data.dateStr ?? ''),
    participants: parts,
    createdByUserId:
      typeof data.createdByUserId === 'string' ? data.createdByUserId : undefined,
  };
}

/**
 * 松下会の記録を1件保存する
 */
export async function addMatsushitaKaiRecord(
  createdByUserId: string,
  data: MatsushitaKaiRecordFormData
): Promise<string> {
  const col = collection(db, MATSUSHITA_KAI_COLLECTION);
  const ref = await addDoc(col, {
    competitionName: data.competitionName.trim(),
    golfCourseName: data.golfCourseName.trim(),
    dateStr: data.dateStr,
    participants: data.participants.map((p) => ({
      displayName: p.displayName.trim(),
      group: (p.group ?? '').trim(),
      grossOut: p.grossOut,
      grossIn: p.grossIn,
      handicap: p.handicap,
      netScore: p.netScore,
      rank: p.rank,
    })),
    createdByUserId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * 一覧（日付の新しい順）
 */
export async function listMatsushitaKaiRecords(): Promise<MatsushitaKaiRecordListItem[]> {
  const col = collection(db, MATSUSHITA_KAI_COLLECTION);
  const q = query(col, orderBy('dateStr', 'desc'));
  const snap = await getDocs(q);
  const list: MatsushitaKaiRecordListItem[] = [];
  snap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const participants = Array.isArray(data.participants) ? data.participants : [];
    list.push({
      id: d.id,
      competitionName: String(data.competitionName ?? ''),
      golfCourseName: String(data.golfCourseName ?? ''),
      dateStr: String(data.dateStr ?? ''),
      participantCount: participants.length,
    });
  });
  return list;
}

/**
 * 1件取得
 */
export async function getMatsushitaKaiRecordById(
  id: string
): Promise<MatsushitaKaiRecordDoc | null> {
  const ref = doc(db, MATSUSHITA_KAI_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * 更新
 */
export async function updateMatsushitaKaiRecord(
  id: string,
  data: MatsushitaKaiRecordFormData
): Promise<void> {
  const ref = doc(db, MATSUSHITA_KAI_COLLECTION, id);
  await updateDoc(ref, {
    competitionName: data.competitionName.trim(),
    golfCourseName: data.golfCourseName.trim(),
    dateStr: data.dateStr,
    participants: data.participants.map((p) => ({
      displayName: p.displayName.trim(),
      group: (p.group ?? '').trim(),
      grossOut: p.grossOut,
      grossIn: p.grossIn,
      handicap: p.handicap,
      netScore: p.netScore,
      rank: p.rank,
    })),
    updatedAt: serverTimestamp(),
  });
}

/**
 * 削除
 */
export async function deleteMatsushitaKaiRecord(id: string): Promise<void> {
  const ref = doc(db, MATSUSHITA_KAI_COLLECTION, id);
  await deleteDoc(ref);
}
