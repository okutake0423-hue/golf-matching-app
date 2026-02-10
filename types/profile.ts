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
 * プロフィールのチェックボックス項目
 */
export const PROFILE_CHECKBOX_OPTIONS = [
  { value: 'company_competition', label: '社内コンペ' },
  { value: 'md', label: 'MD' },
  { value: 'fd', label: 'FD' },
  { value: 'ew', label: 'EW' },
  { value: 'pid', label: 'PID' },
] as const;

export type ProfileCheckboxValue = (typeof PROFILE_CHECKBOX_OPTIONS)[number]['value'];

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
  /** プロフィールチェックボックス項目（複数選択可能） */
  profileCheckboxes?: ProfileCheckboxValue[];
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
  profileCheckboxes?: ProfileCheckboxValue[];
}

/**
 * 編集フォーム用（Firestoreに保存する項目のみ）
 */
export interface UserProfileFormData {
  companyName: string;
  averageScore: number | null;
  playStyle: string;
  profileCheckboxes?: ProfileCheckboxValue[];
}
