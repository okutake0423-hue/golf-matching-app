import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CaddyProfileDoc } from '@/types/caddy-profile';

const COLLECTION = 'caddy_profiles';

export async function addCaddyProfile(
  posterId: string,
  data: {
    golfCourseName: string;
    caddyName: string;
    caddyNumber: string;
    age: number | null;
    photoS3Key: string;
  }
): Promise<string> {
  const col = collection(db, COLLECTION);
  const ref = await addDoc(col, {
    posterId,
    golfCourseName: data.golfCourseName.trim(),
    caddyName: data.caddyName.trim(),
    caddyNumber: data.caddyNumber.trim(),
    age: data.age,
    photoS3Key: data.photoS3Key,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listCaddyProfiles(): Promise<CaddyProfileDoc[]> {
  const col = collection(db, COLLECTION);
  const q = query(col, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const list: CaddyProfileDoc[] = [];
  snap.forEach((d) => {
    const data = d.data();
    list.push({
      id: d.id,
      posterId: String(data.posterId ?? ''),
      golfCourseName: String(data.golfCourseName ?? ''),
      caddyName: String(data.caddyName ?? ''),
      caddyNumber: String(data.caddyNumber ?? ''),
      age: typeof data.age === 'number' ? data.age : null,
      photoS3Key: String(data.photoS3Key ?? ''),
      createdAt: data.createdAt,
    } as CaddyProfileDoc);
  });
  return list;
}
