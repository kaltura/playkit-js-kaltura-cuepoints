import {Provider} from './provider';
import {CuepointType, CuepointTypeMap} from '../types';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

export class VodProvider extends Provider {
  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    if (this._types.has(CuepointType.SLIDE)) {
      this._addSlides();
    }
  }

  // TEMP - for QA drop only
  _addSlides = () => {
    const {RequestBuilder, ResponseTypes} = KalturaPlayer.providers;
    class AssetLoader implements KalturaPlayerTypes.ILoader {
      _parentEntryId: string = '';
      _requests: any[] = [];
      _response: any = {
        assets: []
      };
      static get id(): string {
        return 'dualscreen';
      }
      constructor(params: any) {
        this._parentEntryId = params.parentEntryId;
        const headers: Map<string, string> = new Map();
        const request = new RequestBuilder(headers);
        request.service = 'cuepoint_cuepoint';
        request.action = 'list';
        request.params = {
          filter: {
            objectType: 'KalturaThumbCuePointFilter',
            entryIdEqual: this._parentEntryId,
            cuePointTypeEqual: 'thumbCuePoint.Thumb',
            subTypeIn: '1,2'
          },
          responseProfile: {
            type: 1,
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
        this._response.assets = response[0]?.data;
      }
      get response(): any {
        return this._response;
      }
      isValid(): boolean {
        return !!this._parentEntryId;
      }
    }

    const ks = this._player.config.provider.ks;
    const serviceUrl = this._player.config.provider.env.serviceUrl;

    this._player.provider
      .doRequest([{loader: AssetLoader, params: {parentEntryId: this._player.getMediaInfo().entryId}}])
      .then((data: Map<string, any>) => {
        if (data && data.has(AssetLoader.id)) {
          const assetLoader = data.get(AssetLoader.id);
          const assets = assetLoader?.response?.assets?.objects || [];
          if (assets.length) {
            let cuePoints = (assetLoader?.response?.assets?.objects || []).map((asset: any) => {
              return {
                assetUrl: `${serviceUrl}/index.php/service/thumbAsset/action/serve/thumbAssetId/${asset.assetId}/ks/${ks}?thumbParams:objectType=KalturaThumbParams&thumbParams:width=600`,
                id: asset.id,
                cuePointType: 'thumbCuePoint.Thumb',
                startTime: asset.startTime / 1000
              };
            });
            cuePoints = cuePoints.sort(function (a: any, b: any) {
              return a.startTime - b.startTime;
            });
            cuePoints = cuePoints.map((cuePoint: any, index: number) => {
              if (!cuePoint.endTime) {
                return {...cuePoint, endTime: index === cuePoints.length - 1 ? Number.MAX_SAFE_INTEGER : cuePoints[index + 1].startTime};
              }
              return cuePoint;
            });
            console.log('>> cuePoints', cuePoints);
            this._player.cuePointManager.addCuePoints(cuePoints);
          }
        }
      })
      .catch((e: any) => {
        this._logger.error(e);
      });
  };
}
