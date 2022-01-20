import ILoader = KalturaPlayerTypes.ILoader;
import {KalturaCuePointListResponse, KalturaQuizQuestionCuePoint, KalturaCuePoint} from './response-types';

const {RequestBuilder} = KalturaPlayer.providers;
interface KalturaQuizQuestionCuePointsResponse {
  quizQuestionCuePoints: Array<KalturaQuizQuestionCuePoint>;
}
export class QuizQuestionLoader implements ILoader {
  _entryId: string = '';
  _requests: any[] = [];
  _response: KalturaQuizQuestionCuePointsResponse = {quizQuestionCuePoints: []};

  static get id(): string {
    return 'quiz-question';
  }

  constructor(params: {entryId: string}) {
    this._entryId = params.entryId;
    const headers: Map<string, string> = new Map();
    const request = new RequestBuilder(headers);

    request.service = 'cuepoint_cuepoint';
    request.action = 'list';
    request.params = {
      filter: {
        objectType: 'KalturaQuestionCuePointFilter',
        entryIdEqual: this._entryId,
        cuePointTypeEqual: KalturaCuePoint.KalturaCuePointType.QUIZ_QUESTION,
        orderBy: '+startTime'
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
    const cuePointList = new KalturaCuePointListResponse<KalturaQuizQuestionCuePoint>(response[0]?.data, KalturaQuizQuestionCuePoint);
    if (cuePointList.totalCount) {
      this._response.quizQuestionCuePoints = cuePointList.cuePoints;
    }
  }

  get response(): any {
    return this._response;
  }

  isValid(): boolean {
    return !!this._entryId;
  }
}
