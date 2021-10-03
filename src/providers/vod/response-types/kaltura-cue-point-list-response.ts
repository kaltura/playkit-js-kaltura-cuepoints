import {KalturaThumbCuePoint} from './kaltura-thumb-cue-point';

export class KalturaCuePointListResponse {
  /**
   * @member - The total count
   * @type {number}
   */
  totalCount: number = 0;
  /**
   * @member - The entries
   * @type {Array<KalturaThumbCuePoint>}
   */
  thumbCuePoints: Array<KalturaThumbCuePoint> = [];

  /**
   * @constructor
   * @param {Object} responseObj The json response
   */
  constructor(responseObj: any) {
    this.totalCount = responseObj.totalCount;
    if (this.totalCount > 0) {
      responseObj.objects.map((cuePoint: any) => this.thumbCuePoints.push(new KalturaThumbCuePoint(cuePoint)));
    }
  }
}
