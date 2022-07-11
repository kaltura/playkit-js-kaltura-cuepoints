import {KalturaCuePoint} from './kaltura-cue-point';
import {CuePointTags} from "../../../types";

export class KalturaHotspotCuePoint extends KalturaCuePoint {
  text: string;
  endTime?: number;
  tags?: CuePointTags;

  constructor(hotspotCuePoint: any) {
    super(hotspotCuePoint);
    this.text = hotspotCuePoint.text;
    this.endTime = hotspotCuePoint.endTime;
    this.tags = hotspotCuePoint.tags;
  }
}
