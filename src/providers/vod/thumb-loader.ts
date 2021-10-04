import ILoader = KalturaPlayerTypes.ILoader;
import {KalturaCuePointListResponse} from './response-types/kaltura-cue-point-list-response';
import {KalturaThumbCuePoint} from './response-types/kaltura-thumb-cue-point';

const {RequestBuilder} = KalturaPlayer.providers;
interface KalturaCuePointsResponse {
  thumbCuePoints: Array<KalturaThumbCuePoint>;
}
export class ThumbLoader implements ILoader {
  _entryId: string = '';
  _requests: any[] = [];
  _response: KalturaCuePointsResponse = {thumbCuePoints: []};

  static get id(): string {
    return 'thumb';
  }

  /**
   * @constructor
   * @param {Object} params loader params
   */
  constructor(params: {entryId: string; subTypesFilter: Array<number>}) {
    this._entryId = params.entryId;
    const headers: Map<string, string> = new Map();
    const request = new RequestBuilder(headers);
    const INCLUDE_FIELDS = 1;

    request.service = 'cuepoint_cuepoint';
    request.action = 'list';
    request.params = {
      filter: {
        entryIdEqual: this._entryId,
        cuePointTypeEqual: 'thumbCuePoint.Thumb',
        subTypeIn: params.subTypesFilter
      },
      responseProfile: {
        type: INCLUDE_FIELDS,
        fields: 'id, assetId, startTime'
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
    const thumbCuePointList = new KalturaCuePointListResponse(response[0]?.data);
    if (thumbCuePointList.totalCount) {
      this._response.thumbCuePoints = thumbCuePointList.thumbCuePoints;
    }
  }

  get response(): any {
    return this._response;
  }

  /**
   * Loader validation function
   * @function
   * @returns {boolean} Is valid
   */
  isValid(): boolean {
    return !!this._entryId;
  }
}
