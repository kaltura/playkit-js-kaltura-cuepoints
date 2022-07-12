import {KalturaCuePoint} from './kaltura-cue-point';
import {KalturaThumbCuePointSubType} from '../../../types';

export class KalturaThumbCuePoint extends KalturaCuePoint {
  /**
   * @member - The ThumbCuePoint asset id
   * @type {string}
   */
  assetId: string;
  /**
   * @member - The ThumbCuePoint description
   * @type {string}
   */
  description: string;

  /**
   * @member - The ThumbCuePoint title
   * @type {string}
   */
  title: string;

  /**
   * @member - The sub type of the ThumbCuePoint
   * @type {number}
   */
  subType: KalturaThumbCuePointSubType;

  constructor(thumbCuePoint: any) {
    super(thumbCuePoint);
    this.assetId = thumbCuePoint.assetId;
    this.description = thumbCuePoint.description;
    this.title = thumbCuePoint.title;
    this.subType = thumbCuePoint.subType;
  }
}
