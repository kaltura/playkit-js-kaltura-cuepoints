import ILoader = KalturaPlayerTypes.ILoader;
import {KalturaCuePointListResponse, KalturaQuizAnswerCuePoint, KalturaCuePoint} from './response-types';

const {RequestBuilder} = KalturaPlayer.providers;
interface KalturaQuizAnswerCuePointsResponse {
  quizAnswerCuePoints: Array<KalturaQuizAnswerCuePoint>;
}
export class QuizAnswerLoader implements ILoader {
  _entryId: string = '';
  _quizUserEntryId: string = '';
  _requests: any[] = [];
  _response: KalturaQuizAnswerCuePointsResponse = {quizAnswerCuePoints: []};

  static get id(): string {
    return 'quiz-answer';
  }

  constructor(params: {entryId: string; quizUserEntryId: string}) {
    this._entryId = params.entryId;
    this._quizUserEntryId = params.quizUserEntryId;
    const headers: Map<string, string> = new Map();
    const request = new RequestBuilder(headers);

    request.service = 'cuepoint_cuepoint';
    request.action = 'list';
    request.params = {
      filter: {
        objectType: 'KalturaAnswerCuePointFilter',
        entryIdEqual: this._entryId,
        cuePointTypeEqual: KalturaCuePoint.KalturaCuePointType.QUIZ_ANSWER,
        quizUserEntryIdEqual: this._quizUserEntryId
      }
    };
    this.requests.push(request);
  }

  set requests(requests: any[]) {
    this._requests = requests;
  }

  get requests(): any[] {
    return this._requests;
  }

  set response(response: any) {
    const cuePointList = new KalturaCuePointListResponse<KalturaQuizAnswerCuePoint>(response[0]?.data, KalturaQuizAnswerCuePoint);
    if (cuePointList.totalCount) {
      this._response.quizAnswerCuePoints = cuePointList.cuePoints;
    }
  }

  get response(): any {
    return this._response;
  }

  isValid(): boolean {
    return Boolean(this._entryId && this._quizUserEntryId);
  }
}
