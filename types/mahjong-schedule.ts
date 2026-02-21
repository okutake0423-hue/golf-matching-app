/** Firestore Timestamp は firebase/firestore の Timestamp と互換 */
export type TimestampLike = { seconds: number; nanoseconds: number };

export type MahjongScheduleType = 'RECRUIT' | 'WISH';

/** 【募集モード】麻雀の空き枠を募集 */
export interface MahjongScheduleRecruit {
  id?: string;
  type: 'RECRUIT';
  posterId: string;
  dateStr: string;
  startTime: string;
  dateTime: TimestampLike;
  /** 場所（麻雀会場など） */
  venueName: string;
  /** 参加費（THB） */
  playFee: number;
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
  wishVenueName?: string;
  wishArea?: string;
  maxPlayFee: number;
  monthKey: string;
  createdAt: TimestampLike;
}

export type MahjongScheduleDoc = MahjongScheduleRecruit | MahjongScheduleWish;

export const getMahjongMonthKey = (dateStr: string): string => dateStr.slice(0, 7);

export interface MahjongScheduleRecruitForm {
  type: 'RECRUIT';
  dateStr: string;
  startTime: string;
  venueName: string;
  playFee: number;
  recruitCount: number;
  participants: string[];
  isCompetition?: boolean;
  competitionName?: string;
}

export interface MahjongScheduleWishForm {
  type: 'WISH';
  dateStr: string;
  wishVenueName: string;
  wishArea: string;
  maxPlayFee: number;
}

export type MahjongScheduleFormData = MahjongScheduleRecruitForm | MahjongScheduleWishForm;
