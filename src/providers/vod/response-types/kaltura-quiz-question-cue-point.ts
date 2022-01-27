import {KalturaCuePoint} from './kaltura-cue-point';

export enum KalturaQuestionType {
  fillInBlank = 5,
  goTo = 7,
  hotSpot = 6,
  multipleAnswerQuestion = 4,
  multipleChoiceAnswer = 1,
  openQuestion = 8,
  reflectionPoint = 3,
  trueFalse = 2
}

export interface OptionalAnswer {
  isCorrect: boolean;
  key: string;
  objectType: string;
  text?: string;
  weight: number;
}

export class KalturaQuizQuestionCuePoint extends KalturaCuePoint {
  excludeFromScore: boolean;
  objectType: string;
  optionalAnswers: Array<OptionalAnswer>;
  hint?: string;
  explanation?: string;
  question: string;
  questionType: KalturaQuestionType;
  userId: string;

  constructor(codeCuePoint: any) {
    super(codeCuePoint);
    this.excludeFromScore = codeCuePoint.excludeFromScore;
    this.objectType = codeCuePoint.objectType;
    this.optionalAnswers = codeCuePoint.optionalAnswers;
    this.hint = codeCuePoint.hint;
    this.explanation = codeCuePoint.explanation;
    this.question = codeCuePoint.question;
    this.questionType = codeCuePoint.questionType;
    this.userId = codeCuePoint.userId;
  }
}
