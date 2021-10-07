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

  private _sortCuePoints<T extends {startTime: number}>(cuePoints: T[]) {
    return cuePoints.sort(function (a: any, b: any) {
      return a.startTime - b.startTime;
    });
  }

  private _fixCuePointsEndTime<T extends {startTime: number; endTime: number}>(cuePoints: T[]) {
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

  private _handleViewChangeResponse(data: Map<string, any>) {
    function createCuePointList(viewChangeCuePoints: Array<KalturaCodeCuePoint>) {
      return viewChangeCuePoints.map((viewChangeCuePoint: KalturaCodeCuePoint) => {
        return {
          id: viewChangeCuePoint.id,
          startTime: viewChangeCuePoint.startTime / 1000,
          endTime: viewChangeCuePoint.endTime,
          cuePointType: viewChangeCuePoint.cuePointType,
          partnerData: viewChangeCuePoint.partnerData
        };
      });
    }
    const cuePointsLoader: ViewChangeLoader = data.get(ViewChangeLoader.id);
    const changeCuePoints: Array<KalturaCodeCuePoint> = cuePointsLoader?.response.viewChangeCuePoints || [];
    this._logger.debug(`_fetchVodData viewChange response successful with ${changeCuePoints.length} cue points`);

    if (changeCuePoints.length) {
      let cuePoints = createCuePointList(changeCuePoints);

      let {lockedCuePoints, viewChangeCuePoints} = cuePoints.reduce<any>(
        (prev: any, curr: any) => {
          if (curr.partnerData?.viewModeLockState) {
            return {lockedCuePoints: [...prev.lockedCuePoints, curr], viewChangeCuePoints: prev.viewChangeCuePoints};
          } else {
            return {lockedCuePoints: prev.lockedCuePoints, viewChangeCuePoints: [...prev.viewChangeCuePoints, curr]};
          }
        },
        {lockedCuePoints: [], viewChangeCuePoints: []}
      );

      lockedCuePoints = this._sortCuePoints(lockedCuePoints);
      lockedCuePoints = this._fixCuePointsEndTime(lockedCuePoints);

      viewChangeCuePoints = this._sortCuePoints(viewChangeCuePoints);
      viewChangeCuePoints = this._fixCuePointsEndTime(viewChangeCuePoints);

      this._player.cuePointManager.addCuePoints(viewChangeCuePoints);
      this._player.cuePointManager.addCuePoints(lockedCuePoints);
    }
  }

  private _handleThumbResponse(data: Map<string, any>) {
    const createCuePointList = (thumbCuePoints: Array<KalturaThumbCuePoint>) => {
      return thumbCuePoints.map((thumbCuePoint: KalturaThumbCuePoint) => {
        return {
          assetUrl: makeAssetUrl(this._player.config.provider.env?.serviceUrl, thumbCuePoint.assetId, this._player.config.session.ks),
          id: thumbCuePoint.id,
          cuePointType: thumbCuePoint.cuePointType,
          startTime: thumbCuePoint.startTime / 1000,
          endTime: 0
        };
      });
    };
    const thumbCuePointsLoader: ThumbLoader = data.get(ThumbLoader.id);
    const thumbCuePoints: Array<KalturaThumbCuePoint> = thumbCuePointsLoader?.response.thumbCuePoints || [];
    this._logger.debug(`_fetchVodData thumb response successful with ${thumbCuePoints.length} cue points`);
    if (thumbCuePoints.length) {
      let cuePoints = createCuePointList(thumbCuePoints);
      cuePoints = this._sortCuePoints(cuePoints);
      cuePoints = this._fixCuePointsEndTime(cuePoints);
      this._player.cuePointManager.addCuePoints(cuePoints);
    }
  }
}
