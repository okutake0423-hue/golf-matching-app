/**
 * 松下会（会社コンペ）1回分の記録
 */

/** 参加者1名分のスコア・順位 */
export interface MatsushitaKaiParticipantRow {
  /** 表示名 */
  displayName: string;
  /** 参加グループ */
  group: string;
  /** 前半（Out）グロス */
  grossOut: number | null;
  /** 後半（In）グロス */
  grossIn: number | null;
  /** ハンディキャップ */
  handicap: number | null;
  /** ネットスコア */
  netScore: number | null;
  /** 順位 */
  rank: number | null;
}

/** フォーム送信・Firestore 保存用 */
export interface MatsushitaKaiRecordFormData {
  competitionName: string;
  golfCourseName: string;
  /** YYYY-MM-DD */
  dateStr: string;
  participants: MatsushitaKaiParticipantRow[];
}

export function emptyMatsushitaParticipantRow(): MatsushitaKaiParticipantRow {
  return {
    displayName: '',
    group: '',
    grossOut: null,
    grossIn: null,
    handicap: null,
    netScore: null,
    rank: null,
  };
}

/** Firestore から取得した1件（一覧・編集用） */
export interface MatsushitaKaiRecordDoc {
  id: string;
  competitionName: string;
  golfCourseName: string;
  dateStr: string;
  participants: MatsushitaKaiParticipantRow[];
  createdByUserId?: string;
}

/** 一覧行の表示用 */
export interface MatsushitaKaiRecordListItem {
  id: string;
  competitionName: string;
  golfCourseName: string;
  dateStr: string;
  participantCount: number;
}
