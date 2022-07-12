import ILoader = KalturaPlayerTypes.ILoader;
import {KalturaCuePointListResponse, KalturaHotspotCuePoint, KalturaCuePoint} from './response-types';
import {CuePointTags} from '../../types';

const {RequestBuilder} = KalturaPlayer.providers;
interface KalturaHotSpotCuePointsResponse {
  hotspotCuePoints: Array<KalturaHotspotCuePoint>;
}
export class HotspotLoader implements ILoader {
  _entryId: string = '';
  _requests: any[] = [];
  _response: KalturaHotSpotCuePointsResponse = {hotspotCuePoints: []};

  static get id(): string {
    return 'hotspot';
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
        objectType: 'KalturaCuePointFilter',
        entryIdEqual: this._entryId,
        cuePointTypeEqual: KalturaCuePoint.KalturaCuePointType.ANNOTATION,
        tagsLike: CuePointTags.HOTSPOT
      },
      responseProfile: {
        type: INCLUDE_FIELDS,
        fields: 'id, startTime, endTime, cuePointType, partnerData, text, tags'
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
    const hotspotCuePointList = new KalturaCuePointListResponse<KalturaHotspotCuePoint>(response[0]?.data, KalturaHotspotCuePoint);
    if (hotspotCuePointList.totalCount) {
      this._response.hotspotCuePoints = hotspotCuePointList.cuePoints;
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
