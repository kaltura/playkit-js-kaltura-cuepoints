import {KalturaCuePoint} from './kaltura-cue-point';

export interface CorrectAnswerKeys {
  objectType: string;
  value: string;
}

export class KalturaQuizAnswerCuePoint extends KalturaCuePoint {
  answerKey: string;
  correctAnswerKeys: Array<CorrectAnswerKeys>;
  objectType: string;
  isCorrect: boolean;
  parentId: string;
  quizUserEntryId: string;
  userId: string;

  constructor(codeCuePoint: any) {
    super(codeCuePoint);
    this.answerKey = codeCuePoint.answerKey;
    this.correctAnswerKeys = codeCuePoint.correctAnswerKeys;
    this.objectType = codeCuePoint.objectType;
    this.isCorrect = codeCuePoint.isCorrect;
    this.parentId = codeCuePoint.parentId;
    this.quizUserEntryId = codeCuePoint.quizUserEntryId;
    this.userId = codeCuePoint.userId;
  }
}
