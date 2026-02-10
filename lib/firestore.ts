import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfileDoc, UserProfileFormData } from '@/types/profile';

const USERS_COLLECTION = 'users';

/**
 * userId をドキュメントIDとして Firestore からユーザープロフィールを取得
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfileDoc | null> {
  const ref = doc(db, USERS_COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    userId: data.userId,
    displayName: data.displayName ?? '',
    pictureUrl: data.pictureUrl,
    statusMessage: data.statusMessage,
    companyName: data.companyName ?? '',
    averageScore: data.averageScore ?? null,
    playStyle: data.playStyle ?? '',
    profileCheckboxes: data.profileCheckboxes ?? [],
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : data.updatedAt,
  } as UserProfileDoc;
}

/**
 * ユーザープロフィールを Firestore に保存・更新
 * ドキュメントID = userId
 */
export async function setUserProfile(
  userId: string,
  lineProfile: {
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  },
  formData: UserProfileFormData
): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    ref,
    {
      userId,
      displayName: lineProfile.displayName,
      pictureUrl: lineProfile.pictureUrl ?? null,
      statusMessage: lineProfile.statusMessage ?? null,
      companyName: formData.companyName.trim(),
      averageScore:
        formData.averageScore != null ? Number(formData.averageScore) : null,
      playStyle: formData.playStyle,
      profileCheckboxes: formData.profileCheckboxes ?? [],
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
