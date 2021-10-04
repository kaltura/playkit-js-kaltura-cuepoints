export type CuepointTypeMap = Map<string, boolean>;

export const CuepointType: Record<string, string> = {
  AOA: 'aoa',
  CHAPTER: 'chapter',
  SLIDE: 'slide',
  HOTSPOT: 'hotspot'
};

export enum KalturaThumbCuePointSubType {
  CHAPTER = 2,
  SLIDE = 1
}
export enum KalturaCuePointType {
  // All: 'All',
  // AnswersOnAir: 'AnswersOnAir',
  // Chapters: 'Chapters',
  SLIDE = 'slide'
  // Hotspots: 'Hotspots',
  // Captions: 'Captions'
}
