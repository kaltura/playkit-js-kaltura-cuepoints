import {KalturaCuePoint} from './kaltura-cue-point';

export class KalturaHotspotCuePoint extends KalturaCuePoint {
  text: string;
  endTime?: number;

  constructor(hotspotCuePoint: any) {
    super(hotspotCuePoint);
    this.text = hotspotCuePoint.text;
    this.endTime = hotspotCuePoint.endTime;
  }
}
