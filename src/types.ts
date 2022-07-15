export type CuepointTypeMap = Map<string, boolean>;

export enum KalturaThumbCuePointSubType {
  SLIDE = 1,
  CHAPTER = 2
}
export enum KalturaCuePointType {
  QNA = 'qna',
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
