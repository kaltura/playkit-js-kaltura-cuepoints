import ILoader = KalturaPlayerTypes.ILoader;
import {KalturaCuePointListResponse, KalturaCuePoint} from './response-types';
import {KalturaCodeCuePoint} from './response-types/kaltura-code-cue-point';

const {RequestBuilder} = KalturaPlayer.providers;
interface KalturaViewChangeCuePointsResponse {
  viewChangeCuePoints: Array<KalturaCuePoint>;
}
export class ViewChangeLoader implements ILoader {
  _entryId: string = '';
  _requests: any[] = [];
  _response: KalturaViewChangeCuePointsResponse = {viewChangeCuePoints: []};

  static get id(): string {
    return 'viewchange';
  }

  /**
   * @constructor
   * @param {Object} params loader params
   */
  constructor(params: {entryId: string}) {
    this._entryId = params.entryId;
    const headers: Map<string, string> = new Map();
    const request = new RequestBuilder(headers);
    const INCLUDE_FIELDS = 1;

    request.service = 'cuepoint_cuepoint';
    request.action = 'list';
    request.params = {
      filter: {
        objectType: 'KalturaCodeCuePointFilter',
        entryIdEqual: this._entryId,
        cuePointTypeEqual: KalturaCuePoint.KalturaCuePointType.CODE
      },
      responseProfile: {
        type: INCLUDE_FIELDS,
        fields: 'id, startTime, endTime, partnerData, cuePointType'
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
    const cuePointList = new KalturaCuePointListResponse<KalturaCodeCuePoint>(response[0]?.data, KalturaCodeCuePoint);
    if (cuePointList.totalCount) {
      this._response.viewChangeCuePoints = cuePointList.cuePoints;
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
