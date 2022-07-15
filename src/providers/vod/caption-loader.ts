import ILoader = KalturaPlayerTypes.ILoader;
import {KalturaCaption} from './response-types';

const {RequestBuilder} = KalturaPlayer.providers;
interface CaptionResponse {
  captions: Array<KalturaCaption>;
}
export class CaptionLoader implements ILoader {
  _captionAssetId: string = '';
  _requests: any[] = [];
  _response: CaptionResponse = {captions: []};

  static get id(): string {
    return 'caption';
  }

  /**
   * @constructor
   * @param {Object} params loader params
   */
  constructor(params: {captionAssetId: string}) {
    this._captionAssetId = params.captionAssetId;
    const headers: Map<string, string> = new Map();
    const request = new RequestBuilder(headers);

    request.service = 'caption_captionasset';
    request.action = 'serveAsJson';
    request.params = {
      captionAssetId: this._captionAssetId
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
    const captionData = response[0]?.data?.objects;
    if (captionData && Array.isArray(captionData)) {
      this._response.captions = captionData.map((caption, index) => {
        return new KalturaCaption(caption, `${this._captionAssetId}-${index}`);
      });
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
    return !!this._captionAssetId;
  }
}
