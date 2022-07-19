import {KalturaCuePoint} from './kaltura-cue-point';

interface CaptionContent {
  text: string;
}

interface Caption {
  startTime: number;
  endTime: number;
  content: Array<CaptionContent>;
}

export class KalturaCaption {
  id: string;
  startTime: number;
  endTime: number;
  content: Array<{text: string}>;
  cuePointType: string;
  constructor(caption: Caption, id: string) {
    this.cuePointType = KalturaCuePoint.KalturaCuePointType.CAPTION;
    this.id = id;
    this.startTime = caption.startTime;
    this.endTime = caption.endTime;
    this.content = caption.content;
  }
}
