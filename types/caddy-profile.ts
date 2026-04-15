import type { TimestampLike } from '@/types/schedule';

/** 1〜3の評価（数値が大きいほど高評価） */
export type CaddyScore123 = 1 | 2 | 3;

/** Firestore `caddy_profiles` ドキュメント */
export interface CaddyProfileDoc {
  id?: string;
  posterId: string;
  /** 投稿者表示名（LIFF profile.displayName）。未保存の既存データでは空の可能性あり */
  posterDisplayName?: string;
  golfCourseName: string;
  caddyName: string;
  /** キャディー番号（表記ゆれ対応のため文字列） */
  caddyNumber: string;
  age: number | null;
  /** 愛嬌（1〜3、3が高い） */
  charmScore: CaddyScore123 | null;
  /** ライン読み（1〜3、3が高い） */
  lineReadingScore: CaddyScore123 | null;
  /** S3オブジェクトキー（プレフィックス caddy-profiles/） */
  photoS3Key: string;
  createdAt: TimestampLike;
}

export interface CaddyProfileFormData {
  golfCourseName: string;
  caddyName: string;
  caddyNumber: string;
  age: number | null;
  charmScore: CaddyScore123;
  lineReadingScore: CaddyScore123;
}
