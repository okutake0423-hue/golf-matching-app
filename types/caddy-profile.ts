import type { TimestampLike } from '@/types/schedule';

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
  /** S3オブジェクトキー（プレフィックス caddy-profiles/） */
  photoS3Key: string;
  createdAt: TimestampLike;
}

export interface CaddyProfileFormData {
  golfCourseName: string;
  caddyName: string;
  caddyNumber: string;
  age: number | null;
}
