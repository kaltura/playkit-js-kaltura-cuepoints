export class KalturaCuePoint {
  static KalturaCuePointType: {[type: string]: string} = {
    AD: 'adCuePoint.Ad',
    ANNOTATION: 'annotation.Annotation',
    CODE: 'codeCuePoint.Code',
    EVENT: 'eventCuePoint.Event',
    QUIZ_QUESTION: 'quiz.QUIZ_QUESTION',
    THUMB: 'thumbCuePoint.Thumb'
  };

  static KalturaCuePointStatus: {[type: string]: number} = {
    READY: 1,
    DELETED: 2,
    HANDLED: 3,
    PENDING: 4
  };

  /**
   * @member - The cue point id
   * @type {string}
   */
  id: string;

  /**
   * @member - The cue point intId
   * @type {number}
   */
  intId: number;

  /**
   * @member - The cue point type
   * @type {string}
   */
  cuePointType: string;

  /**
   * @member - The cue point status
   * @type {number}
   */
  status: number;

  /**
   * @member - The entry id
   * @type {string}
   */
  entryId: string;

  /**
   * @member - The partner id
   * @type {number}
   */
  partnerId: number;

  /**
   * @member - The cue point creation date
   * @type {Date}
   */
  createdAt: Date;

  /**
   * @member - The cue point update date
   * @type {Date}
   */
  updatedAt: Date;

  /**
   * @member - The cue point trigger date
   * @type {Date}
   */
  triggeredAt: Date;

  /**
   * @member - The cue point start time
   * @type {Date}
   */
  startTime: number;

  /**
   * @member - The cue point partner
   * @type {string}
   */
  partnerData: string = '';

  constructor(cuePoint: any) {
    this.id = cuePoint.id;
    this.intId = cuePoint.intId;
    this.cuePointType = cuePoint.cuePointType;
    this.status = cuePoint.status;
    this.entryId = cuePoint.entryId;
    this.partnerId = cuePoint.partnerId;
    this.createdAt = cuePoint.createdAt;
    this.updatedAt = cuePoint.updatedAt;
    this.triggeredAt = cuePoint.triggeredAt;
    this.startTime = cuePoint.startTime;
    try {
      this.partnerData = JSON.parse(cuePoint.partnerData);
    } catch (e) {}
  }
}
