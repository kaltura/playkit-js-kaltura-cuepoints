import ILoader = KalturaPlayerTypes.ILoader;
import {KalturaCuePointListResponse, KalturaThumbCuePoint, KalturaCuePoint} from './response-types';

const {RequestBuilder} = KalturaPlayer.providers;
interface KalturaThumbCuePointsResponse {
  thumbCuePoints: Array<KalturaThumbCuePoint>;
}
export class ThumbLoader implements ILoader {
  _entryId: string = '';
  _requests: any[] = [];
  _response: KalturaThumbCuePointsResponse = {thumbCuePoints: []};

  static get id(): string {
    return 'thumb';
  }

  /**
   * @constructor
   * @param {Object} params loader params
   */
  constructor(params: {entryId: string; subTypesFilter: string}) {
    this._entryId = params.entryId;
    const headers: Map<string, string> = new Map();
    const request = new RequestBuilder(headers);
    const INCLUDE_FIELDS = 1;

    request.service = 'cuepoint_cuepoint';
    request.action = 'list';
    request.params = {
      filter: {
        objectType: 'KalturaThumbCuePointFilter',
        entryIdEqual: this._entryId,
        cuePointTypeEqual: KalturaCuePoint.KalturaCuePointType.THUMB,
        subTypeIn: params.subTypesFilter
      },
      responseProfile: {
        type: INCLUDE_FIELDS,
        fields: 'id, assetId, startTime, cuePointType'
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
    const thumbCuePointList = new KalturaCuePointListResponse<KalturaThumbCuePoint>(response[0]?.data, KalturaThumbCuePoint);
    if (thumbCuePointList.totalCount) {
      this._response.thumbCuePoints = thumbCuePointList.cuePoints;
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
