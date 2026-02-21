/** Firestore Timestamp は firebase/firestore の Timestamp と互換 */
export type TimestampLike = { seconds: number; nanoseconds: number };

export type MahjongScheduleType = 'RECRUIT' | 'WISH';

/** 開始プレイ時間帯 */
export type PlayTimeSlot = '朝から' | '昼から' | '夕方から';

/** 【募集モード】麻雀の空き枠を募集 */
export interface MahjongScheduleRecruit {
  id?: string;
  type: 'RECRUIT';
  posterId: string;
  dateStr: string;
  /** 開始プレイ時間帯 */
  playTimeSlot: PlayTimeSlot;
  /** 想定プレイ時間（例: 2時間） */
  expectedPlayTime: string;
  dateTime: TimestampLike;
  /** 場所（麻雀会場など） */
  venueName: string;
  recruitCount: number;
  participants: string[];
  /** 大会かどうか */
  isCompetition?: boolean;
  competitionName?: string;
  monthKey: string;
  createdAt: TimestampLike;
}

/** 【希望モード】参加したい意思表明 */
export interface MahjongScheduleWish {
  id?: string;
  type: 'WISH';
  posterId: string;
  dateStr: string;
  wishDateStart: TimestampLike;
  wishDateEnd?: TimestampLike;
  /** 開始プレイ時間帯 */
  playTimeSlot: PlayTimeSlot;
  /** 想定プレイ時間（例: 2時間） */
  expectedPlayTime: string;
  monthKey: string;
  createdAt: TimestampLike;
}

export type MahjongScheduleDoc = MahjongScheduleRecruit | MahjongScheduleWish;

export const getMahjongMonthKey = (dateStr: string): string => dateStr.slice(0, 7);

export interface MahjongScheduleRecruitForm {
  type: 'RECRUIT';
  dateStr: string;
  playTimeSlot: PlayTimeSlot;
  expectedPlayTime: string;
  venueName: string;
  recruitCount: number;
  participants: string[];
  isCompetition?: boolean;
  competitionName?: string;
}

export interface MahjongScheduleWishForm {
  type: 'WISH';
  dateStr: string;
  playTimeSlot: PlayTimeSlot;
  expectedPlayTime: string;
}

export type MahjongScheduleFormData = MahjongScheduleRecruitForm | MahjongScheduleWishForm;
