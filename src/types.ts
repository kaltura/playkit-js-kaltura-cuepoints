export type CuepointTypeMap = Map<string, boolean>;

export enum KalturaThumbCuePointSubType {
  SLIDE = 1,
  CHAPTER = 2
}
export enum KalturaCuePointType {
  PUBLIC_QNA = 'publicqna',
  USER_QNA = 'userqna',
  CODE_QNA = 'codeqna',
  QUIZ = 'quiz',
  SLIDE = 'slide',
  VIEW_CHANGE = 'viewchange',
  CHAPTER = 'chapter',
  HOTSPOT = 'hotspot',
  CAPTION = 'caption'
}

export enum CuePointTags {
  ANSWERONAIR = 'qna',
  HOTSPOT = 'hotspots'
}

export interface CuePoint {
  id: string;
  startTime: number;
  endTime: number;
  metadata: Record<string, any>;
}
