/** Firestore Timestamp は firebase/firestore の Timestamp と互換 */
export type TimestampLike = { seconds: number; nanoseconds: number };

/**
 * 予定の種類
 * - RECRUIT: 募集モード（空き枠を募集）
 * - WISH: 希望モード（参加したい意思表明）
 */
export type ScheduleType = 'RECRUIT' | 'WISH';

/**
 * 【募集モード】グループが決まっていて空き枠を募集する場合
 * Firestore: schedules コレクション
 */
export interface ScheduleRecruit {
  id?: string;
  type: 'RECRUIT';
  /** 投稿者ID（LINE userId） */
  posterId: string;
  /** 日付（YYYY-MM-DD）。カレンダー・月別取得用 */
  dateStr: string;
  /** 開始時間（HH:mm） */
  startTime: string;
  /** 日時（Firestore Timestamp）。ソート・範囲検索用 */
  dateTime: TimestampLike;
  /** ゴルフコース名 */
  golfCourseName: string;
  /** プレーフィー（円） */
  playFee: number;
  /** 募集人数（あと○名の「○」） */
  recruitCount: number;
  /** 参加確定者リスト（表示名または userId） */
  participants: string[];
  /** 月別取得用（YYYY-MM） */
  monthKey: string;
  createdAt: TimestampLike;
}

/**
 * 【希望モード】参加したい意思を表明する場合
 */
export interface ScheduleWish {
  id?: string;
  type: 'WISH';
  /** 投稿者ID（LINE userId） */
  posterId: string;
  /** 希望日（YYYY-MM-DD）。カレンダー・月別取得用 */
  dateStr: string;
  /** 希望日時開始（Firestore Timestamp） */
  wishDateStart: TimestampLike;
  /** 希望日時終了（期間の場合。任意） */
  wishDateEnd?: TimestampLike;
  /** 希望コース名（任意） */
  wishCourseName?: string;
  /** 希望地域（任意。コース名とどちらか） */
  wishArea?: string;
  /** 上限プレーフィー（円） */
  maxPlayFee: number;
  /** 月別取得用（YYYY-MM） */
  monthKey: string;
  createdAt: TimestampLike;
}

/** 予定ドキュメントの union */
export type ScheduleDoc = ScheduleRecruit | ScheduleWish;

/** 月別取得用：ドキュメントに付与するキー（YYYY-MM） */
export const getMonthKey = (dateStr: string): string =>
  dateStr.slice(0, 7);

/** フォーム：募集モード用 */
export interface ScheduleRecruitForm {
  type: 'RECRUIT';
  dateStr: string;
  startTime: string;
  golfCourseName: string;
  playFee: number;
  recruitCount: number;
  participants: string[];
}

/** フォーム：希望モード用 */
export interface ScheduleWishForm {
  type: 'WISH';
  dateStr: string;
  wishCourseName: string;
  wishArea: string;
  maxPlayFee: number;
}

export type ScheduleFormData = ScheduleRecruitForm | ScheduleWishForm;
