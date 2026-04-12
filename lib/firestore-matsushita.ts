import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { MatsushitaKaiRecordFormData } from '@/types/matsushita-kai';

const MATSUSHITA_KAI_COLLECTION = 'matsushita_kai_records';

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
