/**
 * ゴルフのプレイスタイル（選択肢）
 */
export const PLAY_STYLE_OPTIONS = [
  { value: '', label: '未選択' },
  { value: 'enjoy', label: 'エンジョイ' },
  { value: 'serious', label: '真剣' },
  { value: 'both', label: '状況に応じて' },
] as const;

export type PlayStyleValue = (typeof PLAY_STYLE_OPTIONS)[number]['value'];

/**
 * Firestoreの users コレクションに保存するドキュメントの型
 * ドキュメントID = userId（LINEのユーザーID）
 */
export interface UserProfileDoc {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  /** 会社名 */
  companyName: string;
  /** 平均スコア（未入力は null または 0） */
  averageScore: number | null;
  /** ゴルフのプレイスタイル */
  playStyle: string;
  updatedAt: ReturnType<typeof Date.prototype.getTime>;
}

/**
 * 表示・編集用：LINEプロフィール + Firestoreの独自項目をマージした型
 */
export interface UserProfileDisplay {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  companyName: string;
  averageScore: number | null;
  playStyle: string;
}

/**
 * 編集フォーム用（Firestoreに保存する項目のみ）
 */
export interface UserProfileFormData {
  companyName: string;
  averageScore: number | null;
  playStyle: string;
}
