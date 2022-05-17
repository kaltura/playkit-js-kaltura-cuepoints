import ILoader = KalturaPlayerTypes.ILoader;

const {RequestBuilder} = KalturaPlayer.providers;

export class ThumbUrlLoader implements ILoader {
  _thumbAssetId: string = '';
  _requests: any[] = [];
  _response: string = '';

  static get id(): string {
    return 'thumburlloader';
  }

  /**
   * @constructor
   * @param {Object} params loader params
   */
  constructor(params: {thumbAssetId: string}) {
    const headers: Map<string, string> = new Map();
    const request = new RequestBuilder(headers);
    this._thumbAssetId = params.thumbAssetId;
    request.service = 'thumbAsset';
    request.action = 'getUrl';
    request.params = {
      id: this._thumbAssetId
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
      this._response = response[0]?.data;
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
    return !!this._thumbAssetId;
  }
}
