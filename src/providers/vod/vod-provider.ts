import {Provider, ProviderRequest} from '../provider';
import {ThumbLoader} from './thumb-loader';
import {KalturaThumbCuePoint} from './response-types';
import {KalturaCuePointType, KalturaThumbCuePointSubType, CuepointTypeMap} from '../../types';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import {makeAssetUrl} from '../utils';
import {ViewChangeLoader} from './view-change-loader';
import {KalturaCodeCuePoint} from './response-types/kaltura-code-cue-point';
const DEFAULT_SERVICE_URL = '//cdnapisec.kaltura.com/api_v3';

export class VodProvider extends Provider {
  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._fetchVodData();
  }

  _fetchVodData() {
    let thumbSubTypesFilter = '';
    if (this._types.has(KalturaCuePointType.SLIDE)) {
      thumbSubTypesFilter = `${KalturaThumbCuePointSubType.SLIDE},`;
    }

    // preparation for chapters
    // if (this._types.has(KalturaCuePoints.KalturaCuePointType.CHAPTER)) {
    //   subTypesFilter = `${subTypesFilter}${KalturaCuePoints.KalturaThumbCuePointSubType.CHAPTER},`;
    // }

    let requests: Array<ProviderRequest> = [];
    if (thumbSubTypesFilter) {
      requests.push({loader: ThumbLoader, params: {entryId: this._player.config.sources.id, subTypesFilter: thumbSubTypesFilter}});
    }

    if (this._types.has(KalturaCuePointType.VIEW_CHANGE)) {
      requests.push({loader: ViewChangeLoader, params: {entryId: this._player.config.sources.id}});
    }

    if (requests.length) {
      this._player.provider
        .doRequest(requests)
        .then((data: Map<string, any>) => {
          if (data && data.has(ThumbLoader.id)) {
            this._handleThumbResponse(data);
          }
          if (data && data.has(ViewChangeLoader.id)) {
            this._handleViewChangeResponse(data);
          }
        })
        .catch((e: any) => {
          this._logger.warn('Provider cue points doRequest was rejected');
        });
    }
  }

  private _handleViewChangeResponse(data: Map<string, any>) {
    function createCuePointList(viewChangeCuePoints: Array<KalturaCodeCuePoint>) {
      return viewChangeCuePoints.map((viewChangeCuePoint: KalturaCodeCuePoint) => {
        return {
          id: viewChangeCuePoint.id,
          startTime: viewChangeCuePoint.startTime / 1000,
          endTime: viewChangeCuePoint.endTime,
          cuePointType: viewChangeCuePoint.cuePointType,
          partnerData: viewChangeCuePoint.partnerData,
        };
      });
    }
    const cuePointsLoader: ViewChangeLoader = data.get(ViewChangeLoader.id);
    const viewChangeCuePoints: Array<KalturaCodeCuePoint> = cuePointsLoader?.response.viewChangeCuePoints || [];
    this._logger.debug(`_fetchVodData viewChange response successful with ${viewChangeCuePoints.length} cue points`);

    if (viewChangeCuePoints.length) {
      let cuePoints = createCuePointList(viewChangeCuePoints);
      cuePoints = this._sortCuePoints(cuePoints);
      cuePoints = this._fixCuePointsEndTime(cuePoints);
      this._player.cuePointManager.addCuePoints(cuePoints);
    }
  }

  private _sortCuePoints<T extends {startTime: number}>(cuePoints: T[]) {
    return cuePoints.sort(function (a: any, b: any) {
      return a.startTime - b.startTime;
    });
  }

  private _fixCuePointsEndTime<T extends {startTime: number, endTime: number}>(cuePoints: T[]) {
    return cuePoints.map((cuePoint: any, index: number) => {
      if (!cuePoint.endTime) {
        return {
          ...cuePoint,
          endTime: index === cuePoints.length - 1 ? Number.MAX_SAFE_INTEGER : cuePoints[index + 1].startTime
        };
      }
      return cuePoint;
    });
  }
  private _handleThumbResponse(data: Map<string, any>) {
    function createCuePointList(thumbCuePoints: Array<KalturaThumbCuePoint>, ks: string, serviceUrl: string) {
      return thumbCuePoints.map((thumbCuePoint: KalturaThumbCuePoint) => {
        return {
          assetUrl: makeAssetUrl(serviceUrl, thumbCuePoint.assetId, ks),
          id: thumbCuePoint.id,
          cuePointType: thumbCuePoint.cuePointType,
          startTime: thumbCuePoint.startTime / 1000,
          endTime: 0
        };
      });
    }
    const thumbCuePointsLoader: ThumbLoader = data.get(ThumbLoader.id);
    const thumbCuePoints: Array<KalturaThumbCuePoint> = thumbCuePointsLoader?.response.thumbCuePoints || [];
    this._logger.debug(`_fetchVodData thumb response successful with ${thumbCuePoints.length} cue points`);
    const ks = this._player.config.session.ks || '';
    const serviceUrl = this._player.config.provider.env?.serviceUrl || DEFAULT_SERVICE_URL;
    if (thumbCuePoints.length) {
      let cuePoints = createCuePointList(thumbCuePoints, ks, serviceUrl);
      cuePoints = this._sortCuePoints(cuePoints);
      cuePoints = this._fixCuePointsEndTime(cuePoints);
      this._player.cuePointManager.addCuePoints(cuePoints);
    }
  }
}
