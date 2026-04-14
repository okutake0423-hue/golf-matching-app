import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CaddyProfileDoc } from '@/types/caddy-profile';

const COLLECTION = 'caddy_profiles';

export async function addCaddyProfile(
  posterId: string,
  posterDisplayName: string,
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
    posterDisplayName: posterDisplayName.trim(),
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
      posterDisplayName: String(data.posterDisplayName ?? ''),
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

export async function getCaddyProfileById(
  profileId: string
): Promise<CaddyProfileDoc | null> {
  const ref = doc(db, COLLECTION, profileId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    posterId: String(data.posterId ?? ''),
    posterDisplayName: String(data.posterDisplayName ?? ''),
    golfCourseName: String(data.golfCourseName ?? ''),
    caddyName: String(data.caddyName ?? ''),
    caddyNumber: String(data.caddyNumber ?? ''),
    age: typeof data.age === 'number' ? data.age : null,
    photoS3Key: String(data.photoS3Key ?? ''),
    createdAt: data.createdAt,
  } as CaddyProfileDoc;
}

export async function updateCaddyProfile(
  profileId: string,
  updates: {
    golfCourseName: string;
    caddyName: string;
    caddyNumber: string;
    age: number | null;
    /** 変更しない場合は undefined */
    photoS3Key?: string;
  }
): Promise<void> {
  const ref = doc(db, COLLECTION, profileId);
  const payload: Record<string, unknown> = {
    golfCourseName: updates.golfCourseName.trim(),
    caddyName: updates.caddyName.trim(),
    caddyNumber: updates.caddyNumber.trim(),
    age: updates.age,
  };
  if (typeof updates.photoS3Key === 'string') {
    payload.photoS3Key = updates.photoS3Key;
  }
  await updateDoc(ref, payload);
}

export async function deleteCaddyProfile(profileId: string): Promise<void> {
  const ref = doc(db, COLLECTION, profileId);
  await deleteDoc(ref);
}
