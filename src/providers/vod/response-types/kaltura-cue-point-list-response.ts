import {KalturaCuePoint} from './kaltura-cue-point';

export class KalturaCuePointListResponse<KalturaCuePointType extends KalturaCuePoint> {
  /**
   * @member - The total count
   * @type {number}
   */
  totalCount: number = 0;
  /**
   * @member - The entries
   * @type {Array<KalturaThumbCuePoint>}
   */
  cuePoints: Array<KalturaCuePointType> = [];

  /**
   * @constructor
   * @param {Object} responseObj The json response
   */
  constructor(responseObj: any, type: {new (cuePoint: any): KalturaCuePointType}) {
    this.totalCount = responseObj.totalCount;
    if (this.totalCount > 0) {
      responseObj.objects.map((cuePoint: any) => {
        const cp = new type(cuePoint);
        this.cuePoints.push(cp);
      });
    }
  }
}
