/**
 * 会社名（選択肢）
 */
export const COMPANY_OPTIONS = [
  { value: '', label: '未選択' },
  { value: 'PSTH', label: 'PSTH' },
  { value: 'PECTH', label: 'PECTH' },
  { value: 'PMRTH', label: 'PMRTH' },
  { value: 'PMFTHNN', label: 'PMFTHNN' },
  { value: 'PMFTHKK', label: 'PMFTHKK' },
  { value: 'PMFAT', label: 'PMFAT' },
  { value: 'PIDSTH', label: 'PIDSTH' },
  { value: 'PSPTTH', label: 'PSPTTH' },
  { value: 'PASAP', label: 'PASAP' },
  { value: 'PIDSXTH', label: 'PIDSXTH' },
] as const;

export type CompanyValue = (typeof COMPANY_OPTIONS)[number]['value'];

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
 * 麻雀レベル（選択肢）
 */
export const MAHJONG_LEVEL_OPTIONS = [
  { value: '', label: '未選択' },
  { value: 'rules_only', label: 'ルール知ってる、符計算できない' },
  { value: 'fu_ok', label: '符計算はできます、麻雀大好き' },
  { value: 'jukki', label: '雀鬼' },
] as const;

export type MahjongLevelValue = (typeof MAHJONG_LEVEL_OPTIONS)[number]['value'];

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
  /** 麻雀レベル */
  mahjongLevel?: string;
  /** 好きな役 */
  favoriteYaku?: string;
  /** 麻雀募集通知受取り */
  mahjongRecruitNotify?: boolean;
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
  mahjongLevel?: string;
  favoriteYaku?: string;
  mahjongRecruitNotify?: boolean;
}

/**
 * 編集フォーム用（Firestoreに保存する項目のみ）
 */
export interface UserProfileFormData {
  companyName: string;
  averageScore: number | null;
  playStyle: string;
  profileCheckboxes?: ProfileCheckboxValue[];
  mahjongLevel?: string;
  favoriteYaku?: string;
  mahjongRecruitNotify?: boolean;
}
