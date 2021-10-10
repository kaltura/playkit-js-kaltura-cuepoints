import {KalturaCuePoint} from './kaltura-cue-point';

export class KalturaCodeCuePoint extends KalturaCuePoint {
  /**
   * @member - The CodeCuePoint code
   * @type {string}
   */
  code: string;
  /**
   * @member - The CodeCuePoint description
   * @type {string}
   */
  description: string;

  /**
   * @member - The CodeCuePoint end time
   * @type {string}
   */
  endTime: number;

  /**
   * @member - The duration of the CodeCuePoint
   * @type {number}
   */
  duration: number;

  constructor(codeCuePoint: any) {
    super(codeCuePoint);
    this.code = codeCuePoint.code;
    this.description = codeCuePoint.description;
    this.endTime = codeCuePoint.endTime;
    this.duration = codeCuePoint.duration;
  }
}
